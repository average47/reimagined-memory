# reimagined-memory

A TypeScript + Tailwind monorepo managed with [pnpm workspaces](https://pnpm.io/workspaces) and [Turborepo](https://turbo.build/).

## Structure

```
.
├── apps/
│   ├── web/          # Next.js 15 app (App Router, Tailwind v4)
│   └── cms/          # Headless WordPress (Docker: WordPress + MariaDB + WPGraphQL)
├── packages/
│   ├── ui/           # @repo/ui — shared React component library
│   └── utils/        # @repo/utils — framework-agnostic TypeScript helpers
├── turbo.json        # Turborepo task pipeline
├── tsconfig.base.json
└── pnpm-workspace.yaml
```

Internal packages are consumed directly as TypeScript source and transpiled by
the app via `transpilePackages` in [apps/web/next.config.mjs](apps/web/next.config.mjs).
Tailwind scans the UI package through an `@source` directive in
[apps/web/app/globals.css](apps/web/app/globals.css).

## Commands

Run from the repo root:

| Command             | Description                                  |
| ------------------- | -------------------------------------------- |
| `pnpm install`      | Install all workspace dependencies           |
| `pnpm dev`          | Run every package's `dev` task (Next.js dev) |
| `pnpm build`        | Build all packages                           |
| `pnpm typecheck`    | Type-check all packages                      |
| `pnpm lint`         | Lint all packages                            |

To work on a single package, use pnpm filters, e.g. `pnpm --filter web dev`.

## Packages

- **`@repo/ui`** — React components (`Button`, `Card`, …) styled with Tailwind.
- **`@repo/utils`** — helpers like `cn`, `formatCurrency`, `formatDate`, `truncate`.

## Headless CMS (multi-tenant)

`apps/cms` runs a headless WordPress **Multisite** network in Docker (WordPress +
MariaDB, WPGraphQL auto-installed) serving **four tenants**. Requires Docker and
port 80.

```bash
pnpm --filter cms up      # start the network at http://localhost
pnpm --filter cms down    # stop it
```

Tenants (subdirectory multisite): `/` (AMC+), `/shudder`, `/acorn`,
`/sundancenow` — each with its own `…/graphql` and `…/wp-json/wp/v2` endpoints.

The web app talks to it via [apps/web/lib/wordpress.ts](apps/web/lib/wordpress.ts)
(set `WORDPRESS_BASE_URL`); the [/posts](apps/web/app/posts/page.tsx) page
switches between all four tenants. See [apps/cms/README.md](apps/cms/README.md)
for full details.

## MCP servers

Project-scoped MCP servers are defined in [.mcp.json](.mcp.json) and shared with
everyone who clones the repo. Currently configured:

- **`figma`** — the Figma MCP server (`https://mcp.figma.com/mcp`).

### First-time setup

1. **Approve the server.** On first use, Claude Code prompts you to approve the
   project's MCP servers. Approval is intentionally manual per developer.
2. **Authenticate.** Figma's server uses OAuth. Authorize it once by running
   `/mcp` in an interactive Claude Code session and completing the login flow.
   Until then its tools are unavailable.

