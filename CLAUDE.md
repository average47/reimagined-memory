# Project conventions

Instructions for agents working in this repo. Follow these exactly when creating
or modifying components.

## Component authoring rules

When building a React component:

1. **One folder per component.** Each component lives in its own directory named
   in **PascalCase** (e.g. `Button/`, `UserCard/`), under `src/` of the relevant
   package or app.
2. **PascalCase file names.** The component file matches the folder name:
   `Button/Button.tsx`.
3. **Types in a separate file.** Define props and related types in
   `<Name>.types.ts` and import them into the component. Do not declare the
   public prop types inline in the `.tsx`.
4. **Styling: Tailwind first.** Style with Tailwind utility classes. Only reach
   for a **CSS Module** (`<Name>.module.css`) when a style genuinely can't be
   expressed with Tailwind (complex keyframes, dynamic selectors, etc.).
5. **Barrel export.** Add an `index.ts` in the component folder that re-exports
   the component and its public types, so it can be imported by folder name.
6. **Re-export from the package root.** Add the component to the package's
   top-level `src/index.ts`.

### Required folder shape

```
src/
└── Button/
    ├── index.ts          # re-exports Button and its public types
    ├── Button.tsx        # the component
    ├── Button.types.ts   # ButtonProps and related types
    └── Button.module.css # ONLY if Tailwind is insufficient
```

### Example

`src/Button/Button.types.ts`

```ts
import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}
```

`src/Button/Button.tsx`

```tsx
import { cn } from "@repo/utils";
import type { ButtonProps } from "./Button.types";

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  return <button className={cn("...", className)} {...props} />;
}
```

`src/Button/index.ts`

```ts
export { Button } from "./Button";
export type { ButtonProps, ButtonVariant } from "./Button.types";
```

Then add `export * from "./Button";` to `src/index.ts`.

## Figma MCP rules

The official Figma MCP server is available in this repo. These rules cover
**pulling designs into code (design-to-code)** and **working with the design
system / tokens**. They exist so anything generated from Figma lands as
idiomatic code for _this_ repo, not as a foreign dump.

### Before you touch the tools

- **Read the relevant skill first.** For any Figma work, load the matching skill
  before acting — e.g. `/figma-design-to-code` for implementing a design,
  `/figma-generate-library` for building/extending the design system. Reading
  `/figma-use` is **mandatory before ever calling `use_figma`**.
- **Prefer structured context over screenshots.** Use `get_design_context` and
  `get_metadata` to understand a node; use `get_screenshot` only as a visual
  reference, never as the source of truth for values.
- **A `figma.com` URL is a signal, not a spec.** Resolve the specific node, then
  pull its real values with the tools below rather than eyeballing the image.

### Design-to-code output

Code generated from a Figma node is a normal component in this repo and **must
follow the [Component authoring rules](#component-authoring-rules) above** —
there are no exceptions for Figma-sourced code:

1. **Land it in the required folder shape.** PascalCase folder + file, props in
   `<Name>.types.ts`, `index.ts` barrel, and a re-export from the package
   `src/index.ts`. Do not paste a single monolithic `.tsx`.
2. **Tailwind first.** Translate Figma styles into Tailwind utility classes.
   Reach for a CSS Module only when Tailwind genuinely can't express it (complex
   keyframes, dynamic selectors) — same bar as the authoring rules.
3. **Tokens, not raw values.** Resolve Figma variables with `get_variable_defs`
   and map them to the app's Tailwind theme tokens (colors, spacing, radii,
   typography). Never hardcode a hex, px, or font value that a token exists for.
   If a design uses a value with no matching token, flag it rather than
   inventing an ad-hoc one.
4. **Reuse before generating.** Before emitting new markup, check whether the
   node maps to an existing component (see Code Connect via
   `get_code_connect_map`) and use it. Prefer composing existing components over
   regenerating their internals.
5. **Keep it typed and accessible.** No inline public prop types; preserve
   semantic elements, roles, and labels from the design.

### Design system & tokens

- **Discover before you create.** Use `get_libraries` and
  `search_design_system` to find existing components and tokens. Extending or
  reusing the design system is always preferred over adding a one-off.
- **Tokens are the single source of truth.** Pull them with `get_variable_defs`
  and mirror Figma's token structure in the Tailwind theme. When Figma tokens
  change, update the theme mapping rather than patching individual components.
- **Building/extending the library** (code → Figma) goes through
  `/figma-generate-library`; follow that skill's structure so the generated
  library stays consistent with our component conventions.
- **Don't fork tokens per brand ad hoc.** This app is multi-tenant (AMC+,
  Shudder, Acorn, Sundance Now, WeTV); brand differences belong in themed token
  values, not divergent component code.
