export default function HomePage() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="space-y-4">
          <h1 className="text-5xl font-bold tracking-tight text-foreground-primary">
            Welcome to Hyvve
          </h1>
          <p className="text-xl text-foreground-secondary">
            Your AI team, ready to help.
          </p>
        </header>

        <section className="p-6 bg-background-white rounded-lg border border-border-subtle shadow-sm">
          <h2 className="text-2xl font-semibold mb-4">Setup Complete</h2>
          <ul className="space-y-2 text-foreground-secondary">
            <li>✅ Next.js 15 with App Router</li>
            <li>✅ Tailwind CSS 4 with Hyvve brand tokens</li>
            <li>✅ shadcn/ui configured</li>
            <li>✅ Theme support (dark/light mode)</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
