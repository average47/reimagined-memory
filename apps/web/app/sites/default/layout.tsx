/**
 * The unbranded default site. Unlike the brand layouts, this deliberately sets
 * no `data-brand`, so the base design tokens in `app/colors.css` apply as-is.
 */
export default function defaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <main>{children}</main>;
}
