# reimagined-memory

A TypeScript + Tailwind monorepo managed with [pnpm workspaces](https://pnpm.io/workspaces) and [Turborepo](https://turbo.build/).

## Getting started

**Prerequisites:** [Node](https://nodejs.org) ≥ 20 and [pnpm](https://pnpm.io)
10.8 (`corepack enable` provides the pinned version). Docker is only needed for
the optional [headless CMS](#headless-cms-multi-tenant).

```bash
pnpm install   # install all workspace dependencies
pnpm dev       # start web (:3000), the brand proxy (:3001) and Ladle (:61000)
```

Then open the app **through the proxy** so brand theming resolves from the
subdomain:

- App — http://amcplus.localhost:3001 (swap the subdomain for any brand:
  `shudder`, `acorn`, `sundancenow`, `wetv` — see
  [Local dev proxy](#local-dev-proxy-brand-subdomains))
- Component workbench — http://amcplus.localhost:3001/styleguide

Opening http://localhost:3000 directly also works but defaults to the AMC+
brand, since brand resolution relies on the `*.localhost` subdomains the proxy
provides. The CMS is **not** started by `pnpm dev` — run it separately when you
need WordPress-backed content (see [Headless CMS](#headless-cms-multi-tenant)).

## Structure

```
.
├── apps/
│   ├── web/          # Next.js 15 app (App Router, Tailwind v4)
│   ├── cms/          # Headless WordPress (Docker: WordPress + MariaDB + WPGraphQL)
│   ├── proxy/        # Local dev proxy — brand *.localhost subdomains → web / Ladle
│   └── ladle/        # Ladle component workbench (served at /styleguide)
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

- **`@repo/ui`** — React components (`Icon`, …) styled with Tailwind.
- **`@repo/utils`** — helpers like `cn`, `formatCurrency`, `formatDate`, `truncate`.

## Local dev proxy (brand subdomains)

The app is multi-tenant and resolves the active brand from the hostname. To
exercise that locally, `apps/proxy` is a small HTTP proxy that maps brand
`*.localhost` subdomains onto the Next.js app (and the Ladle workbench).

`pnpm dev` at the repo root starts everything together (Next on `:3000`, this
proxy on `:3001`, Ladle on `:61000`). Then browse the app through the proxy:

| URL                                      | Serves                                  |
| ---------------------------------------- | --------------------------------------- |
| http://amcplus.localhost:3001            | Next.js, themed as AMC+                  |
| http://shudder.localhost:3001            | Next.js, themed as Shudder              |
| http://acorn.localhost:3001              | Next.js, themed as Acorn                |
| http://sundancenow.localhost:3001        | Next.js, themed as Sundance Now         |
| http://wetv.localhost:3001               | Next.js, themed as We TV                |
| http://&lt;brand&gt;.localhost:3001/styleguide | Ladle component workbench, themed to the brand |

How it works ([apps/proxy/index.mjs](apps/proxy/index.mjs)):

- Each `<brand>.localhost` is rewritten to the real brand hostname (e.g.
  `amcplus.com`) via the `Host` header, which the Next.js middleware uses to pick
  the brand — so visiting the subdomain renders that tenant.
- Requests to `/styleguide*` are routed to the Ladle app (`:61000`) instead of
  Next; Ladle reads the brand from the subdomain and themes accordingly. See
  [apps/ladle/README.md](apps/ladle/README.md).

Ports are overridable with the `NEXT_PORT`, `PROXY_PORT`, and `LADLE_PORT` env
vars. Run the proxy alone with `pnpm --filter proxy dev`.

> **Note:** the proxy forwards HTTP only (no WebSocket upgrade), so Vite HMR for
> Ladle doesn't fire through it — develop components directly at
> http://localhost:61000/styleguide/ for live reload.

## Headless CMS (multi-tenant)

`apps/cms` runs a headless WordPress **Multisite** network in Docker (WordPress +
MariaDB, WPGraphQL auto-installed) serving **five tenants**. Requires Docker and
port 80.

```bash
pnpm --filter cms up      # start the network at http://localhost
pnpm --filter cms down    # stop it
```

Tenants (subdirectory multisite): `/` (AMC+), `/shudder`, `/acorn`,
`/sundancenow`, `/wetv` — each with its own `…/graphql` and `…/wp-json/wp/v2`
endpoints.

The web app talks to it via [apps/web/lib/wordpress.ts](apps/web/lib/wordpress.ts)
(set `WORDPRESS_BASE_URL`); the [/posts](apps/web/app/posts/page.tsx) page
switches between all five tenants. See [apps/cms/README.md](apps/cms/README.md)
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

