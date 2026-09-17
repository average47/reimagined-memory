# Button — Figma design data

Source: [Marketing Platform | Design System](https://www.figma.com/design/hlLRfkLeJxrQznYajwIVOz/Marketing-Platform-%7C-Design-System?node-id=2-138&m=dev)
Node: `2:138` (Button component set)

> Reference only — this is the raw design context pulled from Figma via the
> Figma MCP `get_design_context` tool. Implement per the repo's component
> authoring rules; map every value to the theme tokens in
> `apps/web/app/globals.css` rather than hardcoding.

## Component: `Button`

Variant axes:

| Prop         | Values                              |
| ------------ | ----------------------------------- |
| `breakpoint` | `Desktop` \| `Mobile`               |
| `state`      | `Default` \| `Hover`                |
| `type`       | `Primary` \| `Secondary` \| `Tertiary` |

## Variants

| Node      | Variant                       | Label               | Key styles                                                                                     |
| --------- | ----------------------------- | ------------------- | ---------------------------------------------------------------------------------------------- |
| `2:139`   | Desktop / Default / Primary   | Start Free Trial    | bg `action/primary` (#fdb517), h 54px, px 64 / py 16, radius 12                                |
| `2:141`   | Desktop / Hover / Primary     | Start Free Trial    | bg `hover/primary` (#fff), h 54px, px 64 / py 16                                                |
| `2:143`   | Desktop / Default / Secondary | ▶ Watch Free Episode | bg `action/secondary` (#000), border `border/default` (#3b3b3b), gap 12, h 54px, px 28 / py 16 |
| `2:147`   | Desktop / Hover / Secondary   | ▶ Watch Free Episode | bg `hover/secondary` (#3b3b3b), matching border, gap 12, h 54px, px 28 / py 16                 |
| `2:155`   | Desktop / Default / Tertiary  | Sign In             | bg `action/tertiary` (#000), border `border/default`, px 16 / py 8                             |
| `13:103`  | Desktop / Hover / Tertiary    | Sign In             | bg `hover/tertiary` (#3b3b3b), border `border/default`, px 16 / py 8                            |
| `2:161`   | Mobile / Default / Primary    | Start Free Trial    | bg `action/primary`, px 40 / py 12, radius 12 (no fixed height)                                |

Common: `rounded-[12px]`, flex, content centered.

## Typography (CTA text roles)

- **cta/large** — 18px / 25px line-height / weight 700 → Primary (Desktop)
- **cta/medium** — 16px / 22px / weight 700 → Secondary + Mobile Primary
- **cta/small** — 14px / 20px / weight 700 → Tertiary

Text colors:

- Primary → `text/primary` (#000)
- Secondary → `text/secondary` (#fff)
- Tertiary → `text/tertiary` (#e6e6e6)

## Assets

> Figma asset URLs expire ~7 days after generation. Download-and-commit the
> bytes (or wire to a real icon source) before relying on them.

- **Play icon** (Secondary button, 16×16):
  `https://www.figma.com/api/mcp/asset/273fb8c3-e502-449c-b49d-fab3f1593744/93024.svg`

## Token mapping notes

All referenced tokens already exist in `apps/web/app/globals.css`, so this maps
onto existing utilities:

- Colors: `bg-action-primary`, `bg-hover-primary`, `bg-action-secondary`,
  `bg-hover-secondary`, `bg-action-tertiary`, `bg-hover-tertiary`,
  `border-border-default`, `text-text-primary`, `text-text-secondary`,
  `text-text-tertiary`
- Spacing: `px-10` (64), `px-8` (40), `px-4` (16), `py-4` (16), `py-3` (12),
  `py-2` (8), `gap-3` (12)
- Type: `font-cta`, sizes `text-5`/`text-4`/`text-3`, leading
  `leading-7`/`leading-5`/`leading-4`, `font-bold`
