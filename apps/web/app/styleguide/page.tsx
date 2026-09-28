export default async function StyleguidePage() {
  return (
    <main>
      <aside className="grid grid-flow-row gap-3 grid-cols-[2.5fr_0.5fr_10px_2.5fr_0.5fr_10px_2.5fr_0.5fr] grid-rows-[repeat(4,min-content)_10px_repeat(4,min-content)] text-1 font-bold uppercase  border-amber-50 border p-2 bg-[#6b5875] w-2xl">
        <div className="col-start-1 col-span-2 row-start-1 text-3">
          Background
        </div>
        <div className="col-start-4 col-span-2 row-start-1 text-3">Text</div>
        <div className="col-start-7 col-span-2 row-start-1 text-3">Action</div>
        <div className="col-start-1 row-start-2">Default</div>
        <div className="col-start-2 row-start-2">
          <div className="bg-background-default w-full aspect-square rounded-full"></div>
        </div>
        <div className="col-start-1 row-start-3">Surface</div>
        <div className="col-start-2 row-start-3">
          <div className="bg-background-surface w-full aspect-square rounded-full"></div>
        </div>
        <div className="col-start-1 row-start-4">Inverse</div>
        <div className="col-start-2 row-start-4">
          <div className="bg-background-inverse w-full aspect-square rounded-full"></div>
        </div>
        <div className="col-start-4 row-start-2">Primary</div>
        <div className="col-start-5 row-start-2">
          <div className="bg-text-primary w-full aspect-square rounded-full"></div>
        </div>
        <div className="col-start-4 row-start-3">Secondary</div>
        <div className="col-start-5 row-start-3">
          <div className="bg-text-secondary w-full aspect-square rounded-full"></div>
        </div>
        <div className="col-start-4 row-start-4">Tertiary</div>
        <div className="col-start-5 row-start-4">
          <div className="bg-text-tertiary w-full aspect-square rounded-full"></div>
        </div>
        <div className="col-start-7 row-start-2">Primary</div>
        <div className="col-start-8 row-start-2">
          <div className="bg-action-primary w-full aspect-square rounded-full"></div>
        </div>
        <div className="col-start-7 row-start-3">Secondary</div>
        <div className="col-start-8 row-start-3">
          <div className="bg-action-secondary w-full aspect-square rounded-full"></div>
        </div>
        <div className="col-start-7 row-start-4">Tertiary</div>
        <div className="col-start-8 row-start-4">
          <div className="bg-action-tertiary w-full aspect-square rounded-full"></div>
        </div>
        <div className="col-start-3 row-start-1 row-span-4"></div>
        <div className="col-start-6 row-start-1 row-span-4"></div>
        <div className="col-start-1 col-span-8 row-start-5"></div>

        <div className="col-start-1 col-span-2 row-start-6 text-3">Hover</div>
        <div className="col-start-4 col-span-2 row-start-6 text-3">Border</div>
        <div className="col-start-7 col-span-2 row-start-6 text-3">Status</div>
        <div className="col-start-1 row-start-7">Primary</div>
        <div className="col-start-2 row-start-7">
          <div className="bg-hover-primary w-full aspect-square rounded-full"></div>
        </div>
        <div className="col-start-1 row-start-8">Secondary</div>
        <div className="col-start-2 row-start-8">
          <div className="bg-hover-secondary w-full aspect-square rounded-full"></div>
        </div>
        <div className="col-start-1 row-start-9">Tertiary</div>
        <div className="col-start-2 row-start-9">
          <div className="bg-hover-tertiary w-full aspect-square rounded-full"></div>
        </div>
        <div className="col-start-4 row-start-7">Default</div>
        <div className="col-start-5 row-start-7">
          <div className="bg-border-default w-full aspect-square rounded-full"></div>
        </div>
        <div className="col-start-4 row-start-8">Hover</div>
        <div className="col-start-5 row-start-8">
          <div className="bg-border-hover w-full aspect-square rounded-full"></div>
        </div>
        <div className="col-start-4 row-start-9"></div>
        <div className="col-start-5 row-start-9"></div>
        <div className="col-start-7 row-start-7">Error</div>
        <div className="col-start-8 row-start-7">
          <div className="bg-status-error w-full aspect-square rounded-full"></div>
        </div>
        <div className="col-start-7 row-start-8">Warning</div>
        <div className="col-start-8 row-start-8">
          <div className="bg-status-warning w-full aspect-square rounded-full"></div>
        </div>
        <div className="col-start-7 row-start-9">Success</div>
        <div className="col-start-8 row-start-9">
          <div className="bg-status-success w-full aspect-square rounded-full"></div>
        </div>
        <div className="col-start-3 row-start-6 row-span-4"></div>
        <div className="col-start-6 row-start-6 row-span-4"></div>
      </aside>
    </main>
  );
}
