import { Button } from "@acme/ui";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16">
      <h1 className="text-4xl font-semibold tracking-tight">Acme Studio</h1>
      <p className="mt-3 text-lg text-zinc-600">
        Short films from independent creators.
      </p>
      <div className="mt-6 flex gap-3">
        <Button>Browse films</Button>
        <Button variant="secondary">Submit a film</Button>
      </div>
    </main>
  );
}
