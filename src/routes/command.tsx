import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { AuthGate } from "@/components/auth-gate";
import { CommandBar } from "@/components/command-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WeekChart } from "@/components/week-chart";
import { useHelixActions, useWorkspace } from "@/lib/helix/use-workspace";
import { formatTokens } from "@/lib/helix/token";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/command")({ component: CommandRoute });

function CommandRoute() {
  return (
    <AuthGate>
      <AppShell>
        <CommandPage />
      </AppShell>
    </AuthGate>
  );
}

function CommandPage() {
  const { user } = useCurrentUserState();
  const { data, isPending } = useWorkspace(Boolean(user));
  const actions = useHelixActions();
  const initialized = Boolean(data?.profile.initialized_at);

  if (isPending || !data) {
    return <div className="h-64 animate-pulse rounded-2xl bg-surface" />;
  }

  const today = data.reports[data.reports.length - 1];
  const flags = data.mistakes.filter((m) => m.flagged);
  const installed = data.skills.filter((s) => s.installed).length;
  const memTokens = data.memories.reduce((a, m) => a + m.token_estimate, 0);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs tracking-[0.18em] text-muted uppercase">Command</p>
          <h1 className="mt-1 font-serif text-4xl">
            {initialized ? "Daily picture" : "Initialize Helix"}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted">
            {initialized
              ? "Workflow is recording. Compact before you generate. Flagged loops sit with the tutor."
              : "Run /init to bind this account, seed the skill library, and start analytics. Until then the brain is dark."}
          </p>
        </div>
        {!initialized && (
          <Button
            onClick={() => actions.init.mutate()}
            disabled={actions.init.isPending}
          >
            {actions.init.isPending ? "Initializing…" : "Run /init"}
          </Button>
        )}
      </header>

      <CommandBar />

      {initialized && (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Productivity" value={`${today?.productivity ?? 0}`} hint="7-day index" />
            <Stat
              label="Tokens saved"
              value={formatTokens(data.reports.reduce((a, r) => a + r.tokens_saved, 0))}
              hint="compact + pre-plan"
            />
            <Stat label="Flagged loops" value={String(flags.length)} hint="tutor, ≥3 repeats" />
            <Stat
              label="Installed skills"
              value={`${installed}/${data.skills.length}`}
              hint={`${formatTokens(memTokens)} in memory`}
            />
          </section>

          <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <article className="rounded-2xl bg-surface p-5 shadow-[0_0_0_1px_rgb(255_255_255/0.08)]">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-2xl">Tokens</h2>
                <span className="text-xs text-subtle">saved vs spent</span>
              </div>
              <div className="mt-4">
                <WeekChart reports={data.reports} />
              </div>
            </article>
            <article className="rounded-2xl bg-surface p-5 shadow-[0_0_0_1px_rgb(255_255_255/0.08)]">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-serif text-2xl">Briefing</h2>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => actions.report.mutate()}
                  disabled={actions.report.isPending}
                >
                  Refresh
                </Button>
              </div>
              <p className="mt-4 text-sm text-muted">{today?.summary ?? "Write a report with /report."}</p>
              {flags[0] && (
                <p className="mt-4 text-sm text-warn">{flags[0].tutor_note}</p>
              )}
            </article>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <article className="rounded-2xl bg-surface p-5 shadow-[0_0_0_1px_rgb(255_255_255/0.08)]">
              <h2 className="font-serif text-2xl">Tutor flags</h2>
              <ul className="mt-4 space-y-3">
                {data.mistakes.slice(0, 5).map((m) => (
                  <li key={m.id} className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm">{m.pattern}</p>
                      <p className="text-xs text-muted">{m.tutor_note}</p>
                    </div>
                    <Badge variant={m.flagged ? "danger" : "warn"}>{m.count}×</Badge>
                  </li>
                ))}
                {data.mistakes.length === 0 && (
                  <p className="text-sm text-muted">No loops yet. /log mistake when one appears.</p>
                )}
              </ul>
            </article>
            <article className="rounded-2xl bg-surface p-5 shadow-[0_0_0_1px_rgb(255_255_255/0.08)]">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-2xl">Ledger</h2>
                <Link to="/oversight" className="text-xs text-muted hover:text-fg">
                  Oversight
                </Link>
              </div>
              <ul className="mt-4 space-y-3">
                {data.events.slice(0, 8).map((e) => (
                  <li key={e.id} className="flex gap-3 text-sm">
                    <span className="w-16 shrink-0 font-mono text-xs text-subtle">
                      {e.kind}
                    </span>
                    <span>{e.label}</span>
                  </li>
                ))}
              </ul>
            </article>
          </section>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <article className="rounded-2xl bg-surface p-4 shadow-[0_0_0_1px_rgb(255_255_255/0.08)]">
      <p className="text-xs tracking-wide text-subtle uppercase">{label}</p>
      <p className="mt-2 font-serif text-3xl tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </article>
  );
}
