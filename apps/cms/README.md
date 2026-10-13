# cms — Headless, multi-tenant WordPress

A headless WordPress **Multisite** network for the monorepo, run entirely in
Docker. One install serves **five tenants** (sites); each serves content over its
REST API and a GraphQL endpoint (via [WPGraphQL](https://www.wpgraphql.com/)).
The Next.js app in `apps/web` consumes them as a decoupled, multi-tenant frontend.

## Services

| Service     | Image                        | Purpose                                                    |
| ----------- | ---------------------------- | ---------------------------------------------------------- |
| `db`        | `mariadb:11.4`               | MySQL-compatible database (persisted volume)               |
| `wordpress` | `wordpress:7.1-php8.3-apache`| WordPress backend, exposed on `WORDPRESS_PORT`             |
| `wp-cli`    | `wordpress:cli-php8.3`       | One-shot init: core, multisite, 4 tenants, WPGraphQL, exits |

## Tenants

Subdirectory Multisite — all five sites share one origin:

| Tenant        | URL                             | GraphQL                              |
| ------------- | ------------------------------- | ------------------------------------ |
| AMC+ (main)   | http://localhost/               | http://localhost/graphql             |
| Shudder       | http://localhost/shudder/       | http://localhost/shudder/graphql     |
| Acorn         | http://localhost/acorn/         | http://localhost/acorn/graphql       |
| Sundance Now  | http://localhost/sundancenow/   | http://localhost/sundancenow/graphql |
| We TV         | http://localhost/wetv/          | http://localhost/wetv/graphql        |

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

| Command                   | Description                               |
| ------------------------- | ----------------------------------------- |
| `pnpm --filter cms up`    | Start all services in the background      |
| `pnpm --filter cms logs`  | Tail logs for all services                |
| `pnpm --filter cms setup` | Tail the first-run initializer logs       |
| `pnpm --filter cms down`  | Stop services (keeps data)                |
| `pnpm --filter cms clean` | Stop services and delete volumes (resets) |

## Connecting the Next.js app

`apps/web` reads a single origin and appends each tenant's path. Add to
`apps/web/.env.local` (see `apps/web/.env.local.example`):

```
WORDPRESS_BASE_URL=http://localhost
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

| Tenant | "View Page" target |
| --- | --- |
| AMC+ (main) | http://amcplus.localhost:3001/&lt;slug&gt; |
| Shudder | http://shudder.localhost:3001/&lt;slug&gt; |
| Acorn | http://acorn.localhost:3001/&lt;slug&gt; |
| Sundance Now | http://sundancenow.localhost:3001/&lt;slug&gt; |
| We TV | http://wetv.localhost:3001/&lt;slug&gt; |

Point it at deployed frontends with the `MOSAIC_FRONTEND_ORIGINS` env var — a
comma-separated list of `brand=origin` pairs. Unlisted brands keep their
default:

```yaml
# docker-compose.yml, under the `wordpress` service
environment:
  MOSAIC_FRONTEND_ORIGINS: amcplus=https://amcplus.com,shudder=https://shudder.com,acorn=https://acorn.tv
```

Three things it deliberately leaves alone:

- **The content API.** The filters only run for admin and REST requests, so
  WPGraphQL's `uri`/`link` fields — what `apps/web` actually reads — stay as
  WordPress generates them.
- **Preview.** The **Preview** button still opens WordPress. `apps/web` resolves
  pages over the public GraphQL endpoint and has no draft-preview route, so a
  frontend preview link would render "no content found" for exactly the
  unpublished posts preview exists to show.
- **"Visit Site"** and `home_url()`, which is what builds the REST and GraphQL
  endpoint URLs — rewriting those would break the content API.

Media keeps WordPress URLs too, since the frontend has no attachment route.

## Content types

### Movie (`movie`)

`mu-plugins/movie-cpt.php` registers a `movie` custom post type (schema.org/Movie),
a `genre` taxonomy, and its custom fields. It lives in `wp-content/mu-plugins`
(bind-mounted by compose), so it auto-activates network-wide for every tenant —
no per-site activation. Edits to the file are live on the next request; a `down`
+ `up` re-flushes rewrites so the `/movies` routes resolve.

Field mapping from the schema.org/Movie JSON-LD:

| JSON-LD             | WordPress                                                              |
| ------------------- | --------------------------------------------------------------------- |
| `name`              | post title                                                            |
| `description`       | post content                                                          |
| `genre[]`           | `genre` taxonomy terms                                                 |
| `url`               | `movieUrl`                                                             |
| `contentRating[]`   | `contentRating`                                                        |
| `duration`          | `duration` (ISO-8601, e.g. `PT1H53M25S`)                              |
| `releasedEvent`     | `datePublished`, `releaseRegions`                                      |
| `actor[].name`      | `actors` (order preserved)                                            |
| `image`             | `image` (`contentUrl`, `dateModified`, `regionsAllowed`)              |
| `potentialAction`   | `watchTargets` (EntryPoints), `accessSpecifications` (subscriptions)  |

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
      genres { nodes { name } }
      image { contentUrl regionsAllowed }
      watchTargets { urlTemplate actionPlatform }
      accessSpecifications { subscriptionName availabilityStarts availabilityEnds eligibleRegions }
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

| JSON-LD             | WordPress                                                              |
| ------------------- | --------------------------------------------------------------------- |
| `name`              | post title                                                            |
| `description`       | post content                                                          |
| `genre[]`           | `genre` taxonomy terms                                                 |
| `url`               | `seriesUrl`                                                            |
| `contentRating[]`   | `contentRating`                                                        |
| `seasonNumber`      | `seasonNumber` (Int)                                                   |
| `partOfSeries`      | `partOfSeries` (`id`, `name`)                                          |
| `releasedEvent`     | `datePublished`, `releaseRegions`                                      |
| `actor[].name`      | `actors` (order preserved)                                            |
| `image`             | `image` (`contentUrl`, `dateModified`, `regionsAllowed`)              |
| `potentialAction`   | `watchTargets` (EntryPoints), `accessSpecifications` (subscriptions)  |

GraphQL:

```graphql
query {
  tvSeriesCollection(first: 10) {
    nodes {
      title
      seasonNumber
      seriesUrl
      contentRating
      partOfSeries { id name }
      actors
      genres { nodes { name } }
      image { contentUrl regionsAllowed }
      watchTargets { urlTemplate actionPlatform }
      accessSpecifications { subscriptionName availabilityStarts availabilityEnds eligibleRegions }
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
      partOfSeries { id name }
      actors
      genres { nodes { name } }
      image { contentUrl regionsAllowed }
      watchTargets { urlTemplate actionPlatform }
      accessSpecifications { subscriptionName availabilityStarts availabilityEnds eligibleRegions }
    }
  }
}
```

REST equivalents live at `<tenant>/wp-json/wp/v2/tv-seasons` (custom fields under `meta`).

### Importing a schema.org feed

`mu-plugins/schema-import.php` adds a `wp schema import` WP-CLI command that
loads a schema.org JSON feed and routes each record by its `@type`:

| `@type`    | Post type    |
| ---------- | ------------ |
| `Movie`    | `movie`      |
| `TVSeries` | `tv_series`  |
| `TVSeason` | `tv_season`  |

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

| Block | Component | Attributes |
| --- | --- | --- |
| `mosaic/button` | `Button` | `label` (string), `variant` (`primary` \| `secondary` \| `tertiary`, default `primary`), `icon` (sprite name, e.g. `play`), `href` (renders a link when set) |

## Notes

- Data lives in the `db_data` and `wp_data` Docker volumes. `clean` deletes them.
- Credentials in `.env.example` are for local development only — change them for
  any shared or public deployment.
- To add or rename tenants, edit the `TENANTS` list in `scripts/setup.sh` and the
  matching `TENANTS` array in `apps/web/lib/wordpress.ts`.
