# cms — Headless, multi-tenant WordPress

A headless WordPress **Multisite** network for the monorepo, run entirely in
Docker. One install serves **four tenants** (sites); each serves content over its
REST API and a GraphQL endpoint (via [WPGraphQL](https://www.wpgraphql.com/)).
The Next.js app in `apps/web` consumes them as a decoupled, multi-tenant frontend.

## Services

| Service     | Image                        | Purpose                                                    |
| ----------- | ---------------------------- | ---------------------------------------------------------- |
| `db`        | `mariadb:11.4`               | MySQL-compatible database (persisted volume)               |
| `wordpress` | `wordpress:7.1-php8.3-apache`| WordPress backend, exposed on `WORDPRESS_PORT`             |
| `wp-cli`    | `wordpress:cli-php8.3`       | One-shot init: core, multisite, 4 tenants, WPGraphQL, exits |

## Tenants

Subdirectory Multisite — all four sites share one origin:

| Tenant        | URL                             | GraphQL                              |
| ------------- | ------------------------------- | ------------------------------------ |
| AMC+ (main)   | http://localhost/               | http://localhost/graphql             |
| Shudder       | http://localhost/shudder/       | http://localhost/shudder/graphql     |
| Acorn         | http://localhost/acorn/         | http://localhost/acorn/graphql       |
| Sundance Now  | http://localhost/sundancenow/   | http://localhost/sundancenow/graphql |

REST is likewise per-tenant, e.g. `http://localhost/shudder/wp-json/wp/v2`.

## Quick start

```bash
cp .env.example .env          # optional; compose has sensible defaults
docker compose up -d          # or: pnpm --filter cms up
docker compose logs -f wp-cli # watch first-run setup finish
```

On first launch the `wp-cli` service installs WordPress core, converts it to a
subdirectory Multisite network, creates the three additional tenant sites,
network-activates WPGraphQL, writes the multisite `.htaccess`, and flushes
rewrites. It is idempotent — safe to leave in place across restarts.

- **Admin:** http://localhost/wp-admin (default `admin` / `admin`) — the Network
  Admin manages all four sites.

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
page demonstrates switching between all four tenants.

## Notes

- Data lives in the `db_data` and `wp_data` Docker volumes. `clean` deletes them.
- Credentials in `.env.example` are for local development only — change them for
  any shared or public deployment.
- To add or rename tenants, edit the `TENANTS` list in `scripts/setup.sh` and the
  matching `TENANTS` array in `apps/web/lib/wordpress.ts`.
