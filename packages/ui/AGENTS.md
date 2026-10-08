# Building components (agent guide)

Authoritative rules for creating or modifying UI components in this repo. This
file is the source of truth; the root `CLAUDE.md` points here. Follow it exactly
when acting autonomously — the checks at the end are how you know you're done.

Components live in `packages/ui/src/` and are consumed by the Next.js app in
`apps/web`. The app owns the Tailwind theme (design tokens); the package owns the
components. Tokens are defined in `apps/web/app/globals.css` (`@theme inline`,
the semantic layer) and `apps/web/app/colors.css` (brand primitives).

---

## 1. Folder shape (non-negotiable)

One folder per component, named in **PascalCase**, under `src/`:

```
src/
└── StandardCard/
    ├── index.ts              # barrel: re-exports component + public types
    ├── StandardCard.tsx      # the component
    ├── StandardCard.types.ts # props + related types
    └── StandardCard.module.css  # ONLY if Tailwind truly can't express it
```

Rules:

1. **PascalCase folder and file** — the file matches the folder (`StandardCard/StandardCard.tsx`).
2. **Types in `<Name>.types.ts`.** Define props/related types there and import
   them. **Never** declare public prop types inline in the `.tsx`.
3. **Barrel `index.ts`** re-exports the component and its public types so it can
   be imported by folder name.
4. **Re-export from `src/index.ts`** (`export * from './StandardCard';`) or the
   component won't be reachable via `@repo/ui`.
5. **Tailwind first.** Reach for a CSS Module only for things Tailwind genuinely
   can't do (complex keyframes, dynamic selectors) — not for convenience.
6. **Ship a matching WordPress block.** Every component has a companion block in
   `apps/cms` — see [WordPress block](#4-wordpress-block-appscms). A component is
   not complete without it: creating a component includes creating its block,
   and changing a component's props includes updating the block in the same change.
7. **Ship a Ladle story.** Every component has a story at
   `apps/ladle/src/<Name>.stories.tsx` — see [Ladle story](#5-ladle-story-appsladle).
   Creating a component includes writing its story, and changing its props or
   variants includes updating the story in the same change.

### Component conventions

- **Mobile first, always.** Build the `Breakpoint=mobile` version first with
  unprefixed utilities, then layer on only the adjustments the larger
  breakpoints need. Components must be responsive — never ship a desktop-only
  layout or a separate desktop component. Map breakpoints to Tailwind's
  responsive prefixes:
  - **mobile** → base (no prefix) — the default styles.
  - **tablet** → `md:` — only the properties that change at tablet.
  - **desktop** → `lg:` — only the properties that change at desktop.

  So a value that differs across all three reads mobile → tablet → desktop:
  `flex-col md:flex-row`, `text-6 lg:text-11`, `px-4 md:px-8 lg:px-14`. Don't
  hardcode design frame widths (e.g. `w-[393px]`/`w-[1440px]`) or branch layout
  on a `breakpoint`/`layoutGrid` prop for what is really responsive CSS.
- Extend the right DOM attributes (`extends HTMLAttributes<HTMLDivElement>`,
  `ButtonHTMLAttributes<...>`, etc.) and spread `...props` onto the root.
- **Tag the root with the component name.** Put `data-component="<Name>"` (the
  PascalCase component name) on the root element so the component is identifiable
  when inspecting the DOM — e.g. `<div data-component="StandardCard" …>`,
  `<section data-component="Hero" …>`. Spread `{...props}` *after* it so a caller
  can still override if they really need to.
- Destructure `className` and merge it **last** with `cn` from `@repo/utils`
  (`cn` = clsx + tailwind-merge), so a caller's class wins:
  `className={cn("base classes", className)}`.
- Destructure any custom props (e.g. `onPlay`, `title`) out of the rest so they
  don't leak onto the DOM element via `...props`.
- Keep it accessible: real `<button>`s for actions with `aria-label`s,
  `focus-visible` outlines, semantic elements. Preserve roles/labels from designs.
- Follow the existing components for idiom: `Icon/`.

---

## 2. Design tokens — use them, don't hardcode

Everything (color, spacing, type, radius) must resolve through the semantic
tokens so each brand restyles via `[data-brand]` instead of forking component
code. Never hardcode a hex / px / font value that a token exists for. If a design
needs a value with no matching token, **flag it** rather than inventing one.

**Colors** (Tailwind utilities → meaning). ⚠️ Read the inversion note below.

| Utility | Resolves to |
| --- | --- |
| `bg-background-default` | black |
| `bg-background-surface` | brand-secondary (`#303030`; `#0b1624` on amcplus) |
| `bg-background-inverse` | white |
| `text-text-primary` | **black** |
| `text-text-secondary` | **white** |
| `text-text-tertiary` | off-white `#e6e6e6` |
| `*-action-primary` | brand-primary (`#fdb517`; `#00eee6` on amcplus) |
| `*-action-secondary` / `-tertiary` | black |
| `*-hover-primary` | white · `-secondary`/`-tertiary` → gray |
| `*-border-default` | gray · `*-border-hover` → white |
| `*-status-error/-warning/-success` | `#df0000` / `#ff9f0a` / `#30d158` |

**Type ramp:** `text-1` … `text-11` (10px → 48px) each carry a paired
line-height. Override line-height with `leading-*` only when the design demands
it. Font families: `font-headline`, `font-body`, `font-cta`, `font-badge` (all
resolve to the brand font). Weights: `font-regular` (400), `font-bold` (700);
`font-light` / `font-medium` are Tailwind defaults.

**Spacing scale** feeds `p-/m-/gap-/w-/h-/size-` utilities and is **custom**:
`0,1,2,3,4,5,6,7,8,9,10,11,12,13,14` = `0,4,8,12,16,20,24,32,40,48,64,80,96,128,160`px.
So `size-7` = 32px, `gap-3` = 12px, `p-2` = 8px — **not** the stock Tailwind
values. Verify against `globals.css` before assuming a number.

**Brand model:** the app is multi-tenant (AMC+, Shudder, Acorn, Sundance Now,
WeTV). Brand differences belong in themed token values (`colors.css`
`[data-brand]` blocks), never in divergent component code. `action-primary` and
`background-surface` are brand-aware — never hardcode `#fdb517` / `#303030`.

---

## 3. Figma → code

The official Figma MCP server is available. Anything generated from Figma must
land as idiomatic code for _this_ repo, not a foreign dump — i.e. it must obey
sections 1 and 2 above. There are no exceptions for Figma-sourced code.

### Before touching the tools

- **Load the matching skill first.** `/figma-design-to-code` is **mandatory
  before `get_design_context`**; `/figma-use` is mandatory before `use_figma`;
  `/figma-generate-library` for code→Figma library work.
- **Structured context over screenshots.** Use `get_design_context` /
  `get_metadata` / `get_variable_defs` for real values; use `get_screenshot`
  only as the visual target, never as the source of values.
- **A `figma.com` URL is a signal, not a spec.** Resolve the node, pull its real
  values.

### Translating the response

1. **Decompose into the folder shape** — don't paste a monolithic `.tsx`.
2. **Map Figma variables to the app tokens** (`get_variable_defs` → the table in
   section 2). Mind the inversions and the custom spacing scale.
3. **Reuse before generating.** Check `get_code_connect_map` for a mapped
   component and compose existing ones. For glyphs, map to the shared **icon
   sprite** (`Icon` component, `packages/ui/src/Icon/sprite.svg`) — e.g.
   `playArrow`, `moreVertical` — instead of downloading the exported SVGs.
4. **Keep prop/data imagery dynamic.** Posters/thumbnails become props
   (`imageSrc`), not baked-in assets. Only download genuinely static assets, and
   only when there's no sprite/codebase equivalent.
5. **Model the API around meaning, not the Figma variant matrix.** Collapse
   variants that are really the same prop; drop variants that are a responsive
   concern (see breakpoints below).

### Known gotchas (learned the hard way)

- **`text/primary` is inverted.** Figma's `text/primary` resolves to **white**,
  but the app's `text-primary` token is **black**. For white text/borders on
  dark surfaces use `text-text-secondary` / `border-text-secondary`, and a
  translucent white track is `bg-text-secondary/40`.
- **Figma "breakpoint" = discrete variant frames, not thresholds.** A node may
  ship `Mobile` (e.g. `w-[393px]`), `Tablet`, and `Desktop` (e.g. `w-[1440px]`)
  frames with no media-query value. Build the mobile frame as the base, then
  express the tablet/desktop frames as `md:`/`lg:` overrides per the mobile-first
  rule in [Component conventions](#component-conventions) — do **not** hardcode
  the frame widths or expose a `breakpoint`/`layoutGrid` prop for responsive
  layout.
- **Replace Figma's aspect-ratio hack.** Exports use rotated auto-layout +
  `container-query` ("Aspect ratio keeper") divs to lock ratios. Throw that away
  and use native CSS `aspect-ratio` (e.g. `aspect-[16/9]`, `aspect-[2/3]`).
- **Icon component quirks:** default export re-exported as `Icon`; `size` is
  `sm|md|lg|xl` = `12|16|24|36`px; it paints with `fill="currentColor"`, so set
  color via a `text-*` class on the icon or its parent.

---

## 4. WordPress block (apps/cms)

The repo's content is authored in a **headless WordPress Multisite** (`apps/cms`)
and rendered by `apps/web`. Every component in this package has a companion
**WordPress block** so editors can place it in content and the frontend renders
the real component from the block's saved attributes. This is a required
deliverable, not an optional follow-up.

**Mechanism — PHP dynamic blocks, as an mu-plugin.** Follow the existing CPT
pattern (`apps/cms/mu-plugins/*-cpt.php`): plain PHP dropped in
`apps/cms/mu-plugins/`, which auto-activates network-wide for every tenant, is
bind-mounted (edits are live on the next request), and needs **no JS/build step**.

- **Location & naming.** Register blocks from `apps/cms/mu-plugins/blocks.php`
  (one `register_block_type` call per component; split into
  `mu-plugins/blocks/<name>.php` includes if the file grows). Namespace block
  names `mosaic/<kebab-name>` — e.g. `StandardCard` → `mosaic/standard-card`,
  `Hero` → `mosaic/hero`.
- **Attributes mirror the props.** The block's `attributes` are the component's
  **serializable** public props from `<Name>.types.ts` — same names (camelCase),
  types, defaults, and enum values. Map `ReactNode` text props (e.g. `title`,
  `legal`) to `string`/rich-text attributes; **skip** non-serializable props —
  event handlers (`onPlay`, `onCtaClick`) and render functions have no block
  equivalent. Image props stay as URL/media-id attributes.
- **Headless exposure.** Register with a `render_callback` and
  `supports.renderCallback`/`show_in_rest`-equivalent wiring so saved instances
  are readable over REST + WPGraphQL (same as the CPT plugins expose meta) — the
  frontend reads the attributes and renders the `@repo/ui` component; the PHP
  render output itself can stay minimal.
- **Editor registration (so it appears in wp-admin).** PHP `register_block_type`
  alone does **not** put a block in the Gutenberg inserter — the editor only
  lists blocks registered in JavaScript. Add a plain-JS file per block under
  `mu-plugins/blocks/<name>-editor.js` that calls `wp.blocks.registerBlockType`
  via the bundled `wp.*` globals (no JSX/npm — **still no build step**), declares
  the same attributes, provides an `edit` (Inspector fields + a placeholder; the
  real React UI lives in `apps/web`, so don't try to render it here) and
  `save: () => null` (dynamic block). Enqueue it from `blocks.php` on
  `enqueue_block_editor_assets` with the right `wp-*` script dependencies.
- **Document it** in `apps/cms/README.md` alongside the content types.

**When updating a component:** editing `<Name>.types.ts` props means editing the
block in the same change — add/remove/rename attributes, update defaults, and
keep enum values in sync. A prop change without the matching block update is an
incomplete change.

## 5. Ladle story (apps/ladle)

The style guide is the [Ladle](https://ladle.dev/) workbench in `apps/ladle`
(served at `/styleguide`). Every component gets a story file there so it can be
developed, reviewed, and visually checked in isolation, under every brand.

- **Location & naming.** `apps/ladle/src/<Name>.stories.tsx` (PascalCase,
  matching the component folder). Ladle picks up `src/**/*.stories.tsx`
  automatically — no registration step.
- **Shape.** Follow `apps/ladle/src/Icon.stories.tsx`: a default export with
  `title: '<Name>'`, then one named `Story` export (typed with
  `import type { Story } from '@ladle/react'`) per meaningful variant or state,
  each with a short `/** … */` comment saying what it demonstrates.
- **Import from `@repo/ui`**, not a relative path into `packages/ui`, so the
  story exercises the public barrel.
- **Cover the API, not the Figma matrix.** At minimum a `Default` story, plus
  stories for each meaningful prop variant/state (sizes, tones, disabled,
  loading, empty/long content). Responsiveness is checked by resizing the
  viewport, not by separate "Mobile"/"Desktop" stories.
- **Tokens only.** Any wrapper/layout markup in the story uses the same
  design-token utilities as components — no hardcoded hex/px.
- **Dynamic imagery via args.** Pass realistic placeholder values for image/text
  props; don't add assets to `packages/ui` just for a story.

**When updating a component:** adding, removing, or renaming a prop or variant
means updating its story in the same change.

## 6. Verify before you call it done

1. **Typecheck all three** — the package, the app, and the workbench:
   `pnpm --filter @repo/ui typecheck && pnpm --filter web typecheck && pnpm --filter ladle typecheck`.
2. **Render it in Ladle.** Run `pnpm --filter ladle dev`, open
   http://localhost:61000/styleguide/, and confirm every story for the
   component renders without console errors. Spot-check under another brand by
   appending `?brand=amcplus`.
3. **Visually check against the design.** A headless screenshot works without a
   browser dependency (Ladle story URLs are `?story=<title>--<story-name>` in
   kebab-case, e.g. `?story=icon--sizes`; add `&mode=preview` to hide the
   Ladle chrome):
   ```
   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
     --headless --disable-gpu --hide-scrollbars --window-size=760,2750 \
     --screenshot=/tmp/sg.png "http://localhost:61000/styleguide/?story=<name>--default&mode=preview"
   ```
   Compare every static asset's slot, proportions, and the overall layout to the
   Figma render. Note (don't silently fix) any pre-existing out-of-scope issues.
   - **macOS headless caveat:** Chrome enforces a ~500px minimum window width,
     so `--window-size=393,...` lays out at ~500px and crops to 393 — making a
     correct mobile layout look shifted/clipped on the right. To check a mobile
     layout, screenshot at `--window-size=500,...` (or wider) and confirm the
     content is centered/un-clipped; don't "fix" phantom clipping at <500px.
4. **Check the WordPress block is in sync** (see [section 4](#4-wordpress-block-appscms)):
   its attributes match the component's current props, and the PHP has no syntax
   errors (`php -l apps/cms/mu-plugins/blocks.php`). Running the full `apps/cms`
   stack needs Docker; if it isn't available, lint the PHP and verify the
   attribute↔prop mapping by hand.
5. Stop any dev server you started.
