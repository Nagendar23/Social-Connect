export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen px-4 py-10 sm:px-6">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-5xl items-center gap-8 md:grid-cols-[1.1fr_1fr]">
        <section className="hidden space-y-6 md:block">
          <div className="inline-flex items-center rounded-xl bg-primary/12 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
            SocialConnect
          </div>
          <h1 className="font-heading text-4xl font-semibold tracking-tight text-foreground lg:text-5xl">
            Share ideas,
            <br />
            build your network.
          </h1>
          <p className="max-w-md text-base leading-relaxed text-muted-foreground">
            A calm, focused social space for your projects, learning updates, and meaningful conversations.
          </p>
        </section>
        <div>{children}</div>
      </div>
    </div>
  )
}