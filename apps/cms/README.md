# cms — Headless, multi-tenant WordPress

A headless WordPress **Multisite** network for the monorepo, run entirely in
Docker. One install serves **five tenants** (sites); each serves content over its
REST API and a GraphQL endpoint (via [WPGraphQL](https://www.wpgraphql.com/)).
The Next.js app in `apps/web` consumes them as a decoupled, multi-tenant frontend.

## Services

| Service     | Image                         | Purpose                                                     |
| ----------- | ----------------------------- | ----------------------------------------------------------- |
| `db`        | `mariadb:11.4`                | MySQL-compatible database (persisted volume)                |
| `wordpress` | `wordpress:7.1.3-php8.3-apache` | WordPress backend, exposed on `WORDPRESS_PORT`              |
| `wp-cli`    | `wordpress:cli-php8.3`        | One-shot init: core, multisite, 4 tenants, WPGraphQL, exits |

## Tenants

Subdirectory Multisite — all five sites share one origin:

| Tenant       | URL                           | GraphQL                              |
| ------------ | ----------------------------- | ------------------------------------ |
| AMC+ (main)  | http://localhost/             | http://localhost/graphql             |
| Shudder      | http://localhost/shudder/     | http://localhost/shudder/graphql     |
| Acorn        | http://localhost/acorn/       | http://localhost/acorn/graphql       |
| Sundance Now | http://localhost/sundancenow/ | http://localhost/sundancenow/graphql |
| We TV        | http://localhost/wetv/        | http://localhost/wetv/graphql        |

REST is likewise per-tenant, e.g. `http://localhost/shudder/wp-json/wp/v2`.

## Quick start

```bash
cp .env.example .env          # optional; compose has sensible defaults
docker compose up -d          # or: pnpm --filter cms up
docker compose logs -f wp-cli # watch first-run setup finish
```

On first launch the `wp-cli` service installs WordPress core, converts it to a
subdirectory Multisite network, creates the four additional tenant sites,
network-activates WPGraphQL, writes the multisite `.htaccess`, and flushes
rewrites. It is idempotent — safe to leave in place across restarts.

- **Admin:** http://localhost/wp-admin (default `admin` / `admin`) — the Network
  Admin manages all five sites.

> **Port 80 is required.** Subdirectory Multisite stores the network domain
> without a port, so WordPress's site lookups break on a custom port. If port 80
> is taken locally, free it before starting (running on another port needs
> additional domain configuration and is not supported here).

## Commands

Run from this directory (or via `pnpm --filter cms <script>` from the repo root):

| Command                    | Description                                                 |
| -------------------------- | ----------------------------------------------------------- |
| `pnpm --filter cms up`     | Start all services in the background                        |
| `pnpm --filter cms logs`   | Tail logs for all services                                  |
| `pnpm --filter cms setup`  | Tail the first-run initializer logs                         |
| `pnpm --filter cms down`   | Stop services (keeps data)                                  |
| `pnpm --filter cms clean`  | Stop services and delete volumes (resets)                   |
| `pnpm --filter cms export` | Dump the DB + uploads into `exports/` for handoff           |
| `pnpm --filter cms import` | Restore the newest (or a given) export (⚠️ overwrites data) |

`export` writes dated `wordpress-<date>.sql.gz` + `uploads-<date>.tar.gz` into the
gitignored `exports/` dir (share out-of-band — see `exports/HANDOFF.md`). `import`
takes an optional date stamp or file path and defaults to the newest dump;
`FORCE=1` skips its confirmation prompt.

## Connecting the Next.js app

`apps/web` reads a single origin and appends each tenant's path. Add to
`apps/web/.env.local` (see `apps/web/.env.local.example`):

```
WORDPRESS_BASE_URL=http://localhost
```

Draft Mode previews need three more (see [Preview](#preview-draft-mode) below):

```
WORDPRESS_PREVIEW_SECRET=mosaic-dev-preview-secret
WORDPRESS_PREVIEW_USER=admin
WORDPRESS_PREVIEW_APP_PASSWORD=
```

The web app's data fetcher lives in `apps/web/lib/wordpress.ts`; the `/posts`
page demonstrates switching between all five tenants.

## "View Page" opens the frontend

`mu-plugins/headless-permalinks.php` repoints WordPress's view affordances at
`apps/web`, so editors land on the real site instead of WordPress's theme. It
filters `get_permalink()`, which covers all of them at once: the **View** row
action in the posts/pages list, the admin bar's **View Page**, the editor's
**View Page** link, and the "Page published." notice.

The target is `<frontend origin>/<slug>` — `apps/web` resolves content by slug
alone (middleware rewrites `/<slug>` to `/sites/<brand>/<slug>`), so the post
type and page hierarchy don't affect the URL.

Each tenant maps to its own brand origin, defaulting to the local dev proxy
(`apps/proxy`):

| Tenant       | "View Page" target                             |
| ------------ | ---------------------------------------------- |
| AMC+ (main)  | http://amcplus.localhost:3001/&lt;slug&gt;     |
| Shudder      | http://shudder.localhost:3001/&lt;slug&gt;     |
| Acorn        | http://acorn.localhost:3001/&lt;slug&gt;       |
| Sundance Now | http://sundancenow.localhost:3001/&lt;slug&gt; |
| We TV        | http://wetv.localhost:3001/&lt;slug&gt;        |

Point it at deployed frontends with the `MOSAIC_FRONTEND_ORIGINS` env var — a
comma-separated list of `brand=origin` pairs. Unlisted brands keep their
default:

```yaml
# docker-compose.yml, under the `wordpress` service
environment:
  MOSAIC_FRONTEND_ORIGINS: amcplus=https://amcplus.com,shudder=https://shudder.com,acorn=https://acorn.tv
```

Two things it deliberately leaves alone:

- **The content API.** The filters only run for admin and REST requests, so
  WPGraphQL's `uri`/`link` fields — what `apps/web` actually reads — stay as
  WordPress generates them.
- **"Visit Site"** and `home_url()`, which is what builds the REST and GraphQL
  endpoint URLs — rewriting those would break the content API.

Media keeps WordPress URLs too, since the frontend has no attachment route.

The **Preview** button is handled separately — see below.

## Preview (Draft Mode)

`mu-plugins/headless-preview.php` points the **Preview** button at the Next.js
frontend's Draft Mode route instead of WordPress's theme, so unpublished changes
preview on the real site. It filters `preview_post_link` at priority 20 —
after `headless-permalinks.php`'s own keep-Preview-on-WordPress filter (priority
10) — so it wins regardless of plugin load order, and it reuses that file's
tenant→origin resolver, so each tenant previews on its own brand origin.

The round trip:

1. **Preview** links to `<frontend origin>/api/preview?secret=…&id=…&type=…&slug=…`.
2. [`apps/web/app/api/preview/route.ts`](../web/app/api/preview/route.ts)
   validates the shared secret, enables Draft Mode, stores the target as a
   `mosaic-preview` (`<type>:<id>`) cookie, and redirects to `/<slug>`.
3. The page reads that cookie and fetches the draft over the **authenticated**
   REST API (`?context=edit`, HTTP Basic with an Application Password) via
   `getPreviewById()` in `apps/web/lib/wordpress.ts`, rather than the public
   GraphQL endpoint, which only exposes published content.
4. A banner on the previewed page links to `/api/preview/exit`, which disables
   Draft Mode and clears the cookie.

Configuration — the secret must match on both sides:

| Side      | Variable                         | Notes                                        |
| --------- | -------------------------------- | -------------------------------------------- |
| WordPress | `MOSAIC_PREVIEW_SECRET`          | Falls back to a known dev value when unset    |
| Next.js   | `WORDPRESS_PREVIEW_SECRET`       | Same fallback — keep the two in sync          |
| Next.js   | `WORDPRESS_PREVIEW_USER`         | WordPress user the draft fetch authenticates as |
| Next.js   | `WORDPRESS_PREVIEW_APP_PASSWORD` | That user's Application Password (required)   |

Locally both sides use the fallback, so only the Application Password has to be
filled in (`apps/web/.env.local`). For a deployment, set a real secret on the
`wordpress` service in `docker-compose.yml` (alongside `MOSAIC_FRONTEND_ORIGINS`)
and mirror it in the frontend's environment.

Create the Application Password in wp-admin (**Users → Profile → Application
Passwords**) or with wp-cli:

```bash
docker compose run --rm --entrypoint wp wp-cli user application-password \
  create admin "mosaic-preview" --porcelain --url=http://localhost/
```

WordPress hides Application Passwords on non-SSL installs, so the plugin
re-enables them (`wp_is_application_passwords_available`) for this plain-HTTP
local network; over HTTPS that filter is a no-op.

## Content types

### Movie (`movie`)

`mu-plugins/movie-cpt.php` registers a `movie` custom post type (schema.org/Movie),
a `genre` taxonomy, and its custom fields. It lives in `wp-content/mu-plugins`
(bind-mounted by compose), so it auto-activates network-wide for every tenant —
no per-site activation. Edits to the file are live on the next request; a
`down`/`up` cycle re-flushes rewrites so the `/movies` routes resolve.

Field mapping from the schema.org/Movie JSON-LD:

| JSON-LD           | WordPress                                                            |
| ----------------- | -------------------------------------------------------------------- |
| `name`            | post title                                                           |
| `description`     | post content                                                         |
| `genre[]`         | `genre` taxonomy terms                                               |
| `url`             | `movieUrl`                                                           |
| `contentRating[]` | `contentRating`                                                      |
| `duration`        | `duration` (ISO-8601, e.g. `PT1H53M25S`)                             |
| `releasedEvent`   | `datePublished`, `releaseRegions`                                    |
| `actor[].name`    | `actors` (order preserved)                                           |
| `image`           | `image` (`contentUrl`, `dateModified`, `regionsAllowed`)             |
| `potentialAction` | `watchTargets` (EntryPoints), `accessSpecifications` (subscriptions) |

Both REST and GraphQL are exposed. Query a tenant's movies over GraphQL:

```graphql
query {
  movies(first: 10) {
    nodes {
      title
      movieUrl
      duration
      contentRating
      actors
      genres {
        nodes {
          name
        }
      }
      image {
        contentUrl
        regionsAllowed
      }
      watchTargets {
        urlTemplate
        actionPlatform
      }
      accessSpecifications {
        subscriptionName
        availabilityStarts
        availabilityEnds
        eligibleRegions
      }
    }
  }
}
```

REST equivalents live at `<tenant>/wp-json/wp/v2/movies` (custom fields under `meta`).

### TV Series (`tv_series`)

`mu-plugins/tvseries-cpt.php` registers a `tv_series` custom post type from the
schema.org/TVSeason JSON-LD (a numbered season pointing at its parent series via
`partOfSeries`; named `tv_series` per request). It shares the `genre` taxonomy
with movies and follows the same REST + GraphQL exposure.

Field mapping (differs from Movie: no `duration`; adds `seasonNumber` and
`partOfSeries`):

| JSON-LD           | WordPress                                                            |
| ----------------- | -------------------------------------------------------------------- |
| `name`            | post title                                                           |
| `description`     | post content                                                         |
| `genre[]`         | `genre` taxonomy terms                                               |
| `url`             | `seriesUrl`                                                          |
| `contentRating[]` | `contentRating`                                                      |
| `seasonNumber`    | `seasonNumber` (Int)                                                 |
| `partOfSeries`    | `partOfSeries` (`id`, `name`)                                        |
| `releasedEvent`   | `datePublished`, `releaseRegions`                                    |
| `actor[].name`    | `actors` (order preserved)                                           |
| `image`           | `image` (`contentUrl`, `dateModified`, `regionsAllowed`)             |
| `potentialAction` | `watchTargets` (EntryPoints), `accessSpecifications` (subscriptions) |

GraphQL:

```graphql
query {
  tvSeriesCollection(first: 10) {
    nodes {
      title
      seasonNumber
      seriesUrl
      contentRating
      partOfSeries {
        id
        name
      }
      actors
      genres {
        nodes {
          name
        }
      }
      image {
        contentUrl
        regionsAllowed
      }
      watchTargets {
        urlTemplate
        actionPlatform
      }
      accessSpecifications {
        subscriptionName
        availabilityStarts
        availabilityEnds
        eligibleRegions
      }
    }
  }
}
```

REST equivalents live at `<tenant>/wp-json/wp/v2/tv-series` (custom fields under `meta`).

### TV Season (`tv_season`)

`mu-plugins/tvseason-cpt.php` registers a `tv_season` custom post type from the
schema.org/TVSeason JSON-LD. Same field shape as `tv_series` above (it is the
same schema.org type), with its own meta keys and GraphQL types
(`TvSeason` / `tvSeasons`, `seasonUrl`).

GraphQL:

```graphql
query {
  tvSeasons(first: 10) {
    nodes {
      title
      seasonNumber
      seasonUrl
      contentRating
      partOfSeries {
        id
        name
      }
      actors
      genres {
        nodes {
          name
        }
      }
      image {
        contentUrl
        regionsAllowed
      }
      watchTargets {
        urlTemplate
        actionPlatform
      }
      accessSpecifications {
        subscriptionName
        availabilityStarts
        availabilityEnds
        eligibleRegions
      }
    }
  }
}
```

REST equivalents live at `<tenant>/wp-json/wp/v2/tv-seasons` (custom fields under `meta`).

### Importing a schema.org feed

`mu-plugins/schema-import.php` adds a `wp schema import` WP-CLI command that
loads a schema.org JSON feed and routes each record by its `@type`:

| `@type`    | Post type   |
| ---------- | ----------- |
| `Movie`    | `movie`     |
| `TVSeries` | `tv_series` |
| `TVSeason` | `tv_season` |

The feed may be a single JSON-LD object, a JSON array of objects, an object with
a top-level `@graph` array, or a schema.org `DataFeed` (records under
`dataFeedElement`). Records whose `@type` isn't one of the three above (e.g.
`TVEpisode`) are skipped and summarized at the end. Records are upserted
(matched by their source `@id`), so re-running is idempotent.

The feed source defaults to the `WORDPRESS_IMPORT_FEED_URL` env var (URL or a
file path inside the container). When set, first-run `setup.sh` imports it into
the primary site automatically. Run it manually any time:

```bash
# Uses $WORDPRESS_IMPORT_FEED_URL, primary (AMC+) site:
docker compose run --rm --entrypoint wp wp-cli schema import

# Explicit source, into a specific tenant:
docker compose run --rm --entrypoint wp wp-cli schema import \
  --feed=https://example.com/feed.json --url=http://localhost/shudder/
```

(The `wp` binary lives in the `wp-cli` service, so `run --entrypoint wp` is used
rather than `exec`.)

## Blocks

`mu-plugins/blocks.php` registers one `mosaic/*` dynamic block per `@repo/ui`
component so editors can place components in content; the frontend reads the
saved attributes and renders the real component. Attributes mirror the
component's serializable props. Each block also has a plain-JS editor script in
`mu-plugins/blocks/<name>-editor.js` (no build step) so it appears in the
inserter.

| Block                | Component    | Attributes                                                                                                                                                                                                                       |
| -------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mosaic/button`      | `Button`     | `label` (string), `variant` (`primary` \| `secondary` \| `tertiary`, default `primary`), `icon` (sprite name, e.g. `play`), `href` (renders a link when set)                                                                     |
| `mosaic/hero`        | `Hero`       | `backgroundSrc`, `logoSrc`, `logoAlt`, `title`, `description`, `priceText`, `legal`, `ctaLabel`, `ctaHref` (all strings/URLs)                                                                                                    |
| `mosaic/header`      | `Header`     | `siteName` (string), `logoSrc` (URL), `href` (link target)                                                                                                                                                                       |
| `mosaic/card`        | `Card`       | `contentType` (`movie` \| `tv_series`), `contentId` (integer) — the attached title — plus `label` (string), `imageSrc`, `imageAlt`, `backgroundSrc`, `href` (strings/URLs; seeded from the attached title, editable to override) |

**Attaching a title to a card.** The `mosaic/card` editor has a per-card search
field (`blocks/card-editor.js`), which queries the REST search
endpoint scoped to the `movie` and `tv_series` subtypes
(`/wp/v2/search?subtype=movie,tv_series`). Selecting a result stores the
reference (`contentType`/`contentId`) and seeds the card's `label`/`href` from
the entry, plus `backgroundSrc` from the title's artwork meta
(`_movie_image`/`_tvseries_image` `contentUrl`) when present. The `apps/web`
frontend renders the card from those stored fields.

## Menu item options

Menus are authored in the classic editor (**Appearance → Menus**) and read by the
frontend over WPGraphQL. Two mu-plugins add per-item checkboxes there:

| Checkbox           | mu-plugin           | Stored as                     | GraphQL field        |
| ------------------ | ------------------- | ----------------------------- | -------------------- |
| **Open in new tab** | `menu-new-tab.php`  | `_menu_item_target` (`_blank`) | `MenuItem.target`    |
| **Use icon**        | `menu-use-icon.php` | `_mosaic_use_icon` (`1`)       | `MenuItem.useIcon`   |

- **Open in new tab** binds to WordPress's native link-target field (normally
  hidden behind Screen Options) and needs no custom GraphQL field —
  `MenuItem.target` is built in. `apps/web`'s `Footer` renders
  `target="_blank"` + `rel="noopener noreferrer"` when it is `_blank`.
- **Use icon** is a custom flag, so `menu-use-icon.php` registers both the meta
  and the `useIcon` Boolean on `MenuItem`. The `Footer` renders those items as
  sprite icons (with the label as the `aria-label`) instead of text.

Both clear only when the Menus editor posts the form, so programmatic/REST
updates don't silently reset them.

## Increasing the upload size limit

Two separate caps throttle media uploads — raise **both**:

1. **PHP limits.** `php/uploads.ini` (mounted into the container's
   `conf.d` from `docker-compose.yml`) lifts the image defaults
   (`upload_max_filesize` 2M / `post_max_size` 8M) to 64M. Edit the values and
   `docker compose up -d` to recreate the container. Keep
   `post_max_size` >= `upload_max_filesize` or uploads fail silently.
2. **Multisite network cap.** The network enforces its own limit
   (`fileupload_maxk`, default **1500 KB**) that overrides PHP. Set it in
   Network Admin → **Settings → Upload Settings → "Max upload file size"** (KB),
   or via wp-cli (keep it <= the PHP limit above):

   ```bash
   docker compose run --rm wp-cli wp eval 'update_site_option("fileupload_maxk", 65536);'
   ```

   `65536` KB = 64 MB. Allowed file types live in the same **Upload Settings**
   screen if a format (e.g. SVG) is being rejected rather than the size.

## Notes

- `mu-plugins/admin-menu-hide.php` hides **Posts**, **Comments** and **Tools**
  from the wp-admin sidebar — content is authored as pages, movies, TV series
  and TV seasons, and the headless frontend has no comments.
- Data lives in the `db_data` and `wp_data` Docker volumes. `clean` deletes them.
- Credentials in `.env.example` are for local development only — change them for
  any shared or public deployment.
- To add or rename tenants, edit the `TENANTS` list in `scripts/setup.sh` and the
  matching `TENANTS` array in `apps/web/lib/wordpress.ts`.
- The `mosaic` theme is bind-mounted into the container (like `mu-plugins`). Its
  `functions.php` registers the Header/Footer nav-menu locations that WPGraphQL
  exposes by location — if the theme files are missing from the container the
  `MenuLocationEnum` loses `HEADER`/`FOOTER` and menu queries fail, so the
  frontend header/footer menus come back empty.
