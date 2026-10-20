# reimagined-memory

A TypeScript + Tailwind monorepo managed with [pnpm workspaces](https://pnpm.io/workspaces) and [Turborepo](https://turbo.build/).

> **Install pnpm 12.11.2 globally:** `npm install -g pnpm@12.11.2`
>
> This repo pins `packageManager` to pnpm 12.11.2. pnpm 12 ships as a native
> binary, and both of the usual ways of picking up a pinned version currently
> mishandle it:
>
> - Corepack (0.33.0) fails with `Cannot find module
>   .../pnpm/<version>/bin/pnpm.cjs` — the JS entry point pnpm 12 no longer ships.
> - pnpm's own version switching fails with `ENOEXEC` — it downloads the package
>   but skips the postinstall that puts the native binary in place, leaving a
>   placeholder text file at `bin/pnpm`.
>
> Installing globally means the running version already matches the pin, so
> neither path is taken. `npm` runs the postinstall correctly.

## Getting started

**Prerequisites:** [Node](https://nodejs.org) ≥ 20 and [pnpm](https://pnpm.io)
12.11.2 (see the note above). Docker is only needed for the optional
[headless CMS](#headless-cms-multi-tenant).

```bash
pnpm install   # install all workspace dependencies
pnpm dev       # start web (:3000), the brand proxy (:3001) and Storybook (:61000)
```

> **One-time, on macOS behind a TLS-inspecting proxy:** `apps/web`'s `dev` and
> `build` scripts pass `NODE_EXTRA_CA_CERTS=.certs/ca-bundle.pem`, so Node trusts
> the system (and any corporate) CAs when fetching from the CMS. The bundle is
> gitignored — generate it once:
>
> ```bash
> mkdir -p apps/web/.certs
> security find-certificate -a -p \
>   /System/Library/Keychains/SystemRootCertificates.keychain > apps/web/.certs/ca-bundle.pem
> security find-certificate -a -p /Library/Keychains/System.keychain \
>   >> apps/web/.certs/ca-bundle.pem
> ```
>
> Without it Node just warns and falls back to its bundled roots, which is fine
> for plain-HTTP local development; point `NODE_EXTRA_CA_CERTS` elsewhere to use
> your own bundle.

Then open the app **through the proxy** so brand theming resolves from the
subdomain:

- App — http://amcplus.localhost:3001 (swap the subdomain for any brand:
  `shudder`, `acorn`, `sundancenow`, `wetv` — see
  [Local dev proxy](#local-dev-proxy-brand-subdomains))
- Component workbench — http://amcplus.localhost:3001/styleguide

Opening http://localhost:3000 directly also works, but with no brand subdomain
to resolve it renders the **unbranded default** site (base design tokens, no
logo) — brand resolution relies on the `*.localhost` subdomains the proxy
provides. The CMS is **not** started by `pnpm dev` — run it separately when you
need WordPress-backed content (see [Headless CMS](#headless-cms-multi-tenant)).

## Structure

```
.
├── apps/
│   ├── web/          # Next.js 15 app (App Router, Tailwind v4)
│   ├── cms/          # Headless WordPress (Docker: WordPress + MariaDB + WPGraphQL)
│   ├── proxy/        # Local dev proxy — brand *.localhost subdomains → web / Storybook
│   └── styleguide/   # Storybook component workbench (served at /styleguide)
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
| `pnpm clean`        | Remove build output and `node_modules`       |

To work on a single package, use pnpm filters, e.g. `pnpm --filter web dev`.

## Packages

- **`@repo/ui`** — React components (`Icon`, `Button`, `Card`, `Header`, `Hero`)
  styled with Tailwind. See [packages/ui/AGENTS.md](packages/ui/AGENTS.md) for the
  conventions every component follows.
- **`@repo/utils`** — helpers like `cn`, `formatCurrency`, `formatDate`, `truncate`.

## Local dev proxy (brand subdomains)

The app is multi-tenant and resolves the active brand from the hostname. To
exercise that locally, `apps/proxy` is a small HTTP proxy that maps brand
`*.localhost` subdomains onto the Next.js app (and the Storybook workbench).

`pnpm dev` at the repo root starts everything together (Next on `:3000`, this
proxy on `:3001`, Storybook on `:61000`). Then browse the app through the proxy:

| URL                                      | Serves                                  |
| ---------------------------------------- | --------------------------------------- |
| http://localhost:3001                    | Next.js, unbranded default              |
| http://amcplus.localhost:3001            | Next.js, themed as AMC+                 |
| http://shudder.localhost:3001            | Next.js, themed as Shudder              |
| http://acorn.localhost:3001              | Next.js, themed as Acorn                |
| http://sundancenow.localhost:3001        | Next.js, themed as Sundance Now         |
| http://wetv.localhost:3001               | Next.js, themed as We TV                |
| http://&lt;brand&gt;.localhost:3001/styleguide | Storybook component workbench, themed to the brand |

How it works ([apps/proxy/index.mjs](apps/proxy/index.mjs)):

- Each `<brand>.localhost` is rewritten to the real brand hostname (e.g.
  `amcplus.com`) via the `Host` header, which the Next.js middleware uses to pick
  the brand — so visiting the subdomain renders that tenant. A host that isn't
  mapped (including a bare `localhost`) forwards the `default` sentinel, which
  resolves to the unbranded default site.
- Requests to `/styleguide*` are routed to the Storybook app (`:61000`) instead
  of Next, with the `/styleguide` prefix stripped — Storybook's dev server has
  no `base` option and only serves from the root. The root-absolute URLs its
  preview iframe requests (`/@vite/client`, `/sb-manager/*`, …) are matched back
  to the workbench by their `Referer`. Storybook reads the brand from the
  subdomain and themes accordingly. See
  [apps/styleguide/README.md](apps/styleguide/README.md).

Ports are overridable with the `NEXT_PORT`, `PROXY_PORT`, and `STORYBOOK_PORT`
env vars. Run the proxy alone with `pnpm --filter proxy dev`.

> **Note:** the proxy forwards HTTP only (no WebSocket upgrade), so Vite HMR for
> Storybook doesn't fire through it — develop components directly at
> http://localhost:61000/ for live reload.

## Headless CMS (multi-tenant)

`apps/cms` runs a headless WordPress **Multisite** network in Docker (WordPress +
MariaDB, WPGraphQL auto-installed) serving **five brand tenants plus an
unbranded default site**. Requires Docker and port 80.

```bash
pnpm --filter cms up      # start the network at http://localhost
pnpm --filter cms down    # stop it
```

Tenants (subdirectory multisite): `/` (the unbranded default), `/amcplus`,
`/shudder`, `/acorn`, `/sundancenow`, `/wetv` — each with its own `…/graphql`
and `…/wp-json/wp/v2` endpoints.

The unbranded primary site doubles as a **shared library**: its pages, posts,
media, and menus are readable from every brand tenant, so brand-neutral content
is authored once instead of duplicated per microsite. A brand's own content
shadows the library's — except in the footer, where the two are additive: every
subsite renders its own footer columns above the copyright and the library's
network-wide links below it. See
[Sharing data across microsites](apps/cms/README.md#sharing-data-across-microsites).

The web app talks to it via [apps/web/lib/wordpress.ts](apps/web/lib/wordpress.ts)
(set `WORDPRESS_BASE_URL`); the [/posts](apps/web/app/posts/page.tsx) page
switches between every tenant. See [apps/cms/README.md](apps/cms/README.md)
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

