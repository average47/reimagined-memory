import { Button, Card, CardDescription, CardTitle } from "@repo/ui";
import { formatDate } from "@repo/utils";

export default function Home() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Reimagined Memory</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Monorepo scaffolded {formatDate(Date.now())} — Next.js app,{" "}
          <code>@repo/ui</code> component library, and <code>@repo/utils</code>.
        </p>
      </header>

      <Card>
        <CardTitle>Shared components</CardTitle>
        <CardDescription>
          The Button below is imported from the <code>@repo/ui</code> package and
          styled with Tailwind classes scanned across the workspace.
        </CardDescription>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
        </div>
      </Card>
    </main>
  );
}
