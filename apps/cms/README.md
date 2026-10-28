# cms — Headless, multi-tenant WordPress

A headless WordPress **Multisite** network for the monorepo, run entirely in
Docker. One install serves **five brand tenants plus an unbranded default site**;
each serves content over its REST API and a GraphQL endpoint (via
[WPGraphQL](https://www.wpgraphql.com/)).
The Next.js app in `apps/web` consumes them as a decoupled, multi-tenant frontend.

## Services

| Service     | Image                         | Purpose                                                     |
| ----------- | ----------------------------- | ----------------------------------------------------------- |
| `db`        | `mariadb:11.4`                | MySQL-compatible database (persisted volume)                |
| `wordpress` | `wordpress:7.1.3-php8.3-apache` | WordPress backend, exposed on `WORDPRESS_PORT`              |
| `wp-cli`    | `wordpress:cli-php8.3`        | One-shot init: core, multisite, 5 brand tenants, WPGraphQL, exits |

## Tenants

Subdirectory Multisite — all six sites share one origin. Every brand lives in
its own subdirectory; the network's **primary site at `/` belongs to no brand**
and backs the unbranded default (see
[The unbranded default site](#the-unbranded-default-site)):

| Tenant             | URL                           | GraphQL                              |
| ------------------ | ----------------------------- | ------------------------------------ |
| Default (no brand) | http://localhost/             | http://localhost/graphql             |
| AMC+               | http://localhost/amcplus/     | http://localhost/amcplus/graphql     |
| Shudder            | http://localhost/shudder/     | http://localhost/shudder/graphql     |
| Acorn              | http://localhost/acorn/       | http://localhost/acorn/graphql       |
| Sundance Now       | http://localhost/sundancenow/ | http://localhost/sundancenow/graphql |
| We TV              | http://localhost/wetv/        | http://localhost/wetv/graphql        |

REST is likewise per-tenant, e.g. `http://localhost/shudder/wp-json/wp/v2`.

### The unbranded default site

The network's primary site (`blog_id` 1, path `/`) is deliberately **not** a
brand. It is the fallback tenant: `apps/web` serves it for any host that isn't
in its domain map — a bare `http://localhost:3001`, or an unrecognised
subdomain — and renders it with **no `[data-brand]` attribute**, so it picks up
the base design tokens in `apps/web/app/globals.css` instead of a brand's
overrides. It ships no logo, so the header falls back to the site name as text.

It is also the network's **shared library** — see
[Sharing data across microsites](#sharing-data-across-microsites).

The brand key for it is `default`, which is what the three mirrored mappings
use:

| Mapping | File |
| --- | --- |
| site path → brand (`'/' => 'default'`) | `mu-plugins/headless-permalinks.php` |
| networkPath → tenant (`default: 'main'`) | `apps/web/lib/wordpress.ts` |
| brand → site config (`default: defaultConfig`) | `apps/web/lib/siteConfigDomainMap.ts` |

Adding or moving a tenant means updating all three in the same change.

## Sharing data across microsites

Brand tenants are separate WordPress sites with separate tables, so by default
nothing crosses between them — a page, an image, or a menu made for one brand is
invisible to the rest. The **shared library** fixes that for content that should
exist once for the whole network.

**The model is one canonical copy, not duplication.** The library is the
unbranded primary site (`blog_id` 1, path `/`). Everything published there is
shared; there is no per-item opt-in, because that site exists for nothing else.
Brand tenants never hold a copy, so an edit in the library is live on every
microsite at once.

What is shared: **pages and posts**, the **media library**, and **menus**. The
catalog post types (`movie`, `tv_series`, `tv_season`) are deliberately *not*
shared — those stay per-brand.

### Resolution: the brand always wins

Reads fall back rather than merge. A brand's own content takes precedence, and
the library only answers when the brand has nothing:

```
request /about on shudder
  ├─ shudder has a page "about"?  ──yes──►  render shudder's
  └─ no ──►  library has a page "about"?  ──yes──►  render the library's
                                           └─ no ──►  404
```

That ordering is what makes the library safe to fill: a page maintained once
appears on every brand, and any brand can shadow it by publishing its own page
at the same slug. The `HEADER` menu location works the same way.

**The footer is the exception: its two layers are additive, not competing.**
Every subsite renders the network-wide footer *and* its own, so a brand adds to
the global footer instead of replacing it:

```
┌─ local  — this subsite's own FOOTER menu      (top)
├─ copyright                                    (middle)
└─ global — the shared library's FOOTER menu    (bottom)
```

Both layers come from the same `FOOTER` location, so the theme needs no second
registration: on the library that menu *is* the global footer, and on a brand it
is that brand's local footer. `components/Footer.tsx` fetches both itself — it
reads the `x-network-path` header and calls `getMenu` twice — so the layout
passes it no props. The library site itself gets an empty `local` layer, since
its own menu is already the global one and would otherwise render above and
below the copyright.

Both menus must be **assigned to the Footer location** in Appearance → Menus on
their own site. Menus are only readable by location, so an unassigned menu reads
as empty however many items it holds.

The frontend helpers live in `apps/web/lib/wordpress.ts`:

| Helper | Does | Used by |
| --- | --- | --- |
| `LIBRARY_TENANT` | The tenant that holds the library (`main`) | `Footer.tsx` |
| `isLibraryTenant(key)` | Is this tenant the library? | `Footer.tsx` |
| `resolvePageBySlug(tenant, slug)` | Brand content, else the library's | `app/page.tsx` |
| `resolveMenu(tenant, location)` | Brand menu, else the library's (fallback) | — available |
| `resolveFooterMenus(tenant)` | Both footer layers at once | — available |
| `getLibraryMedia({ search })` | Search the shared media library | — available |
| `getLibraryContent({ search })` | Search the library's pages/posts | — available |

`resolvePageBySlug` returns a `Resolved<T>` — the value plus the `source` tenant
and a `shared` flag — so a render can tell where its content came from.

The helpers marked *available* have no caller today. `resolveMenu` is the
fallback behaviour the `HEADER` location would want; `resolveFooterMenus`
duplicates what `Footer.tsx` now does inline; and the editor's media picker
calls the REST route below directly rather than going through
`getLibraryMedia`.

### Authoring a footer menu

The two layers are authored differently, because they render in different
places. Both are edited in Appearance → Menus on their own site.

**A local menu is nested two levels: group → links.** Each top-level item is a
column — the item itself is the column heading and its children are that
column's links. Headings are not linked, so `#` is the conventional URL for
them.

```
Follow AMC+        ← top-level item = column heading
  ├─ Facebook      ← children = that column's links
  ├─ Instagram
  └─ X
Need Help          ← next column
  ├─ Browse Help Topics
  └─ Contact Us
```

**A global menu is flat.** Every item is a link in the bottom bar; nesting it
achieves nothing.

Two rules worth knowing before authoring:

- **Four columns maximum.** The grid depends on there being exactly six items,
  so a local menu with more than four top-level groups is truncated rather than
  allowed to add cells and push the spanning rows out of place (`COLUMN_COUNT`
  in `components/Footer.tsx`). Fewer than four is fine — the remaining tracks
  are simply empty.
- **An all-icon group lays out as a row.** When *every* link in a column has
  the "Use icon" box ticked, that column renders as a wrapping row of icons
  instead of a stack — which is what makes a social column read correctly.
  A mixed group stacks like any other.

### How the footer renders

Six grid items, mobile-first. The base grid is one column and each breakpoint
only widens the track count; the last two items always span the full width,
which is what collapses the row count:

| Breakpoint | Grid | Rows | Layout |
| --- | --- | --- | --- |
| base | 1 column | 6 | every item on its own row |
| `md` | 2 columns | 4 | columns 1-4 fill rows 1-2; items 5 and 6 span both |
| `lg` | 4 columns | 3 | columns 1-4 fill row 1; items 5 and 6 span all four |

Items 1-4 are the local menu's columns, item 5 is the copyright, and item 6 is
the global menu — a list that stacks on mobile and becomes a wrapping horizontal
row from `md` up.

The "Use icon" option renders the sprite icon named after the **lowercased menu
item label** (`Facebook` → `facebook`), with the label kept as the accessible
name. A label with no matching symbol in `packages/ui/src/Icon/sprite.svg`
renders as a blank space, so the label has to match a sprite id exactly.

### The REST routes (`mosaic/v1`)

`mu-plugins/shared-library.php` registers these on **every** tenant, so a brand
site can reach the library without knowing where it lives. Each one reads the
library via `switch_to_blog()` and returns only published items:

| Route | Returns |
| --- | --- |
| `GET /wp-json/mosaic/v1/library` | Which site is the library (`blogId`, `url`, `isLibrary`) |
| `GET /wp-json/mosaic/v1/library/media` | `?search=` `?per_page=` `?page=` `?mime=image` |
| `GET /wp-json/mosaic/v1/library/content` | `?search=` `?type=page,post` `?per_page=` |
| `GET /wp-json/mosaic/v1/library/menus` | Menus grouped by theme location |

Move the library to a different site with the `MOSAIC_LIBRARY_BLOG_ID` env var
on the `wordpress` service; `LIBRARY_TENANT` in `apps/web/lib/wordpress.ts` has
to change to match.

### Shared media in the block editor

WordPress's own media modal only ever shows the *current* site's uploads, so
`blocks/library-media.js` adds a **Shared library** button beside it wherever a
block takes an image (the Card and Hero blocks today). It browses the library
over `mosaic/v1/library/media` and writes the chosen absolute URL into the
attribute — uploads are served from one origin, so a library URL resolves from
every tenant with no copying.

It is registered once as the `mosaic-library-media` script and listed as a
dependency of every block editor script in `blocks.php`, so any new block can
use `window.mosaicLibrary.SharedMediaButton` without further wiring.

## Quick start

```bash
cp .env.example .env          # optional; compose has sensible defaults
docker compose up -d          # or: pnpm --filter cms up
docker compose logs -f wp-cli # watch first-run setup finish
```

On first launch the `wp-cli` service installs WordPress core, converts it to a
subdirectory Multisite network, creates the five brand tenant sites,
network-activates WPGraphQL, writes the multisite `.htaccess`, and flushes
rewrites. It is idempotent — safe to leave in place across restarts.

- **Admin:** http://localhost/wp-admin (default `admin` / `admin`) — the Network
  Admin manages all six sites.

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

| Tenant             | "View Page" target                             |
| ------------------ | ---------------------------------------------- |
| Default (no brand) | http://localhost:3001/&lt;slug&gt;             |
| AMC+               | http://amcplus.localhost:3001/&lt;slug&gt;     |
| Shudder            | http://shudder.localhost:3001/&lt;slug&gt;     |
| Acorn              | http://acorn.localhost:3001/&lt;slug&gt;       |
| Sundance Now       | http://sundancenow.localhost:3001/&lt;slug&gt; |
| We TV              | http://wetv.localhost:3001/&lt;slug&gt;        |

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
| `mosaic/brand-cards` | `BrandCards` | `title` (string), `ctaLabel`, `ctaHref` (strings), and `cards` — an array of card objects, each the same shape as a `mosaic/card` (`contentType`, `contentId`, `label`, `imageSrc`, `imageAlt`, `backgroundSrc`, `href`)        |

**Attaching a title to a card.** The `mosaic/card` editor has a per-card search
field (`blocks/card-editor.js`), which queries the REST search
endpoint scoped to the `movie` and `tv_series` subtypes
(`/wp/v2/search?subtype=movie,tv_series`). Selecting a result stores the
reference (`contentType`/`contentId`) and seeds the card's `label`/`href` from
the entry, plus `backgroundSrc` from the title's artwork meta
(`_movie_image`/`_tvseries_image` `contentUrl`) when present. The `apps/web`
frontend renders the card from those stored fields.

**The `mosaic/brand-cards` section.** The `brand-cards` editor
(`blocks/brand-cards-editor.js`) wraps a headline and CTA around a repeatable
list of cards: use **Add card** to append a card and the per-card panel to
attach a title (the same catalog search as `mosaic/card`), reorder, or remove
it. Each card stores the same reference + display fields as the standalone card
block; the `apps/web` frontend maps the stored `cards` array to the
`BrandCards` component's `cards` prop.

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
