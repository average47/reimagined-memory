export default function amcplusLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div data-brand="amcplus">
      <aside>
        <div className="grid grid-cols-4 gap-3 m-3 h-6 text-white-100 font-bold uppercase text-sm">
          <div className="col-start-1 row-start-1 flex justify-center items-center bg-primary-enabled rounded-sm">
            Enabled
          </div>
          <div className="col-start-2 row-start-1 flex justify-center items-center bg-primary-hover rounded-sm">
            Hover
          </div>
          <div className="col-start-3 row-start-1 flex justify-center items-center bg-primary-active rounded-sm">
            Active
          </div>
          <div className="col-start-4 row-start-1 flex justify-center items-center bg-primary-disabled rounded-sm">
            Disabled
          </div>
        </div>
      </aside>
      <main>{children}</main>
    </div>
  );
}
