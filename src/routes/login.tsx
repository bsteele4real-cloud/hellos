import { createFileRoute, Link } from "@tanstack/react-router";
import { HelixMark } from "@/components/helix-mark";
import { Button } from "@/components/ui/button";
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  return (
    <main className="relative grid min-h-dvh place-items-center px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgb(126_168_135/0.08),transparent_55%)]" />
      <div className="relative w-full max-w-sm">
        <Link to="/" className="mb-8 flex items-center gap-2">
          <HelixMark className="size-8" />
          <span className="font-serif text-2xl tracking-tight">Helix</span>
        </Link>
        <h1 className="font-serif text-4xl font-medium tracking-tight">Sign in</h1>
        <p className="mt-2 text-sm text-muted">
          Admin control, memory, and the skill library are bound to your account.
        </p>
        <div className="mt-8 space-y-3">
          {authEnabled ? (
            GROK_PROVIDERS.map((p) => (
              <Button
                key={p.providerId}
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => signIn(p.providerId, { callbackURL: "/command" })}
              >
                Continue with {p.label}
              </Button>
            ))
          ) : (
            <p className="text-sm text-muted">Sign-in is disabled.</p>
          )}
        </div>
        <p className="mt-6 text-xs text-subtle">
          Oversight, compact, and Linux generation stay behind this gate.
        </p>
      </div>
    </main>
  );
}
