import { cn } from "@repo/utils";
import type {
  CardDescriptionProps,
  CardProps,
  CardTitleProps,
} from "./Card.types";

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900",
        className,
      )}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: CardTitleProps) {
  return (
    <h3
      className={cn(
        "text-lg font-semibold text-gray-900 dark:text-gray-50",
        className,
      )}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: CardDescriptionProps) {
  return (
    <p
      className={cn("mt-1 text-sm text-gray-500 dark:text-gray-400", className)}
      {...props}
    />
  );
}
