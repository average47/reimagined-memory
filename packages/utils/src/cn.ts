import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge only knows Tailwind's default theme. Teach it the custom
 * tokens from apps/web/app/globals.css so it doesn't misclassify them — e.g.
 * without this, `text-4` (type ramp) is read as a text *color* and silently
 * drops `text-text-secondary`, and `font-regular` is read as a font family.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        { text: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"] },
      ],
      "font-weight": [{ font: ["regular"] }],
    },
  },
});

/**
 * Merge class names with clsx and de-duplicate conflicting Tailwind classes.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
