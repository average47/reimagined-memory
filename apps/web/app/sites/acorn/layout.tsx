export default function acornLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <main data-brand="acorn">{children}</main>;
}
