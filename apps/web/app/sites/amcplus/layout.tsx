export default function amcplusLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div data-brand="amcplus">
      <main>{children}</main>
    </div>
  );
}
