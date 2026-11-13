import type { ReactNode } from "react";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export function AuthGate({ children }: { children: ReactNode }) {
  const { user, isPending } = useCurrentUserState();
  if (isPending) {
    return (
      <div
        className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-bg text-fg"
        role="status"
        aria-live="polite"
      >
        <div className="h-24 w-48 animate-pulse rounded-2xl bg-surface" />
        <p className="text-sm text-muted">Checking your session…</p>
      </div>
    );
  }
  if (!user) return <RedirectToSignIn />;
  return <>{children}</>;
}
