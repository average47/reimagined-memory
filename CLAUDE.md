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
