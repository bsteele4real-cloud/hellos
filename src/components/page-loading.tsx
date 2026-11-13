export function PageLoading({ label = "Loading Helix…" }: { label?: string }) {
  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-bg text-fg"
      role="status"
      aria-live="polite"
    >
      <div className="h-24 w-48 animate-pulse rounded-2xl bg-surface" />
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}
