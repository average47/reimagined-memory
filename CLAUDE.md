# Project conventions

Instructions for agents working in this repo.

## Building components

When creating or modifying UI components — including anything generated from
Figma — follow **[`packages/ui/AGENTS.md`](packages/ui/AGENTS.md)**. It is the
source of truth for the folder shape, design-token usage, the Figma→code
workflow, and the verification steps, and it must be followed exactly.

Essentials (see that file for the full rules and the hard-won gotchas):

- **One PascalCase folder per component** with `<Name>.tsx`, `<Name>.types.ts`
  (no inline public prop types), an `index.ts` barrel, and a re-export from
  `src/index.ts`. Tailwind first; CSS Modules only when Tailwind can't express it.
- **Tokens, not raw values.** Everything resolves through the semantic tokens in
  `apps/web/app/globals.css` so brands restyle via `[data-brand]`. Never hardcode
  a hex/px/font a token exists for.
- **Mobile first, responsive.** Build the mobile layout as the base, then adjust
  for larger screens with Tailwind's `md:` (tablet) and `lg:` (desktop) prefixes.
  No desktop-only layouts, no hardcoded frame widths.
- **Matching WordPress block.** Every component has a companion PHP dynamic block
  (mu-plugin) in `apps/cms` whose attributes mirror its props. Creating a
  component includes creating its block; changing props includes updating it.
- **Ladle story.** Every component has a story at
  `apps/ladle/src/<Name>.stories.tsx` covering its meaningful variants.
  Creating a component includes writing its story; changing props or variants
  includes updating it.
- **Figma work:** load `/figma-design-to-code` before `get_design_context` (and
  `/figma-use` before `use_figma`); reuse existing components and the icon sprite
  before generating markup; keep prop/data imagery dynamic.
- **Verify:** typecheck `@repo/ui`, `web`, and `ladle`, render the component's
  stories in Ladle (`pnpm --filter ladle dev`), and visually check against the
  design before finishing.
