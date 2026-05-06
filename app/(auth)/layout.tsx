import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[480px] opacity-60"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 0%, hsl(var(--primary) / 0.18) 0%, transparent 70%)",
        }}
      />

      <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 18h6M4 12h10M4 6h16" />
            </svg>
          </div>
          <span className="tracking-tight">ClientHub</span>
        </Link>
        <span className="text-xs text-muted-foreground">
          Need help?{" "}
          <a
            href="mailto:hello@letsbuildmyapp.com?subject=ClientHub%20support"
            className="text-foreground underline-offset-4 hover:underline"
          >
            Contact support
          </a>
        </span>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-6 py-10">
        {children}
      </main>

      <footer className="relative z-10 px-6 pb-8 text-center text-xs text-muted-foreground sm:px-10">
        <a
          href="https://letsbuildmyapp.com"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Let&apos;s Build My App
        </a>
      </footer>
    </div>
  );
}
