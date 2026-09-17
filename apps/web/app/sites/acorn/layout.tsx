export default function amcplusLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div data-brand="acorn">
      <aside>
        <div className="grid grid-cols-4 grid-rows-3 gap-3 my-3 mx-auto text-black-100 font-bold uppercase text-sm aspect-video w-3xl">
          <div className="col-start-1 row-start-1 row-span-3 flex justify-center items-center bg-primary-enabled rounded-sm border border-black-100 text-white-100">
            Primary
          </div>
          <div className="col-start-2 row-start-1 flex justify-center items-center bg-primary-hover rounded-sm border border-black-100 text-white-100">
            Hover
          </div>
          <div className="col-start-2 row-start-2 flex justify-center items-center bg-primary-active rounded-sm border border-black-100 text-white-100">
            Active
          </div>
          <div className="col-start-2 row-start-3 flex justify-center items-center bg-primary-disabled rounded-sm border border-black-100 text-white-100">
            Disabled
          </div>
          <div className="col-start-3 row-start-1 row-span-3 flex justify-center items-center bg-secondary-enabled rounded-sm border border-black-100">
            Secondary
          </div>
          <div className="col-start-4 row-start-1 flex justify-center items-center bg-secondary-hover rounded-sm border border-black-100">
            Hover
          </div>
          <div className="col-start-4 row-start-2 flex justify-center items-center bg-secondary-active rounded-sm border border-black-100">
            Active
          </div>
          <div className="col-start-4 row-start-3 flex justify-center items-center bg-secondary-disabled rounded-sm border border-black-100">
            Disabled
          </div>
        </div>
      </aside>
      <main>{children}</main>
    </div>
  );
}
