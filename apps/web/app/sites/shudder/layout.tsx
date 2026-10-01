export default function shudderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <main data-brand="shudder">{children}</main>;
}
