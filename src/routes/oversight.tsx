import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { AuthGate } from "@/components/auth-gate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { redirectToLoginIfRequired } from "@/lib/app-data";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { CONNECTOR_CATALOG } from "@/lib/helix/catalog";
import { useHelixActions, useWorkspace } from "@/lib/helix/use-workspace";
import { toast } from "sonner";

export const Route = createFileRoute("/oversight")({ component: OversightRoute });

const AGENT_ROLES: { slug: string; role: string; blurb: string }[] = [
  { slug: "agent-secure-memory", role: "Archivist", blurb: "Write and recall compacted notes." },
  { slug: "agent-governance", role: "Governor", blurb: "Allow, deny, or defer gated actions." },
  { slug: "skill-creator", role: "Smith", blurb: "Draft skills and Linux from a brief." },
  { slug: "workflow-optimizer", role: "Tutor", blurb: "Flag loops and write the daily briefing." },
  { slug: "agent-loop-improver", role: "Improver", blurb: "Observer. One skill edit per cycle. You merge it." },
  { slug: "android-hardening-protocol", role: "Hardener", blurb: "Device and host snapshots." },
  { slug: "multi-agent-systems", role: "Swarm lead", blurb: "Handoffs, never full-thread copies." },
  { slug: "precision-token-engineering", role: "Token smith", blurb: "Budgets and compact." },
  { slug: "dashboard-builder", role: "Builder", blurb: "Keep Command honest." },
];

function OversightRoute() {
  return (
    <AuthGate>
      <AppShell>
        <OversightPage />
      </AppShell>
    </AuthGate>
  );
}

function OversightPage() {
  const { user } = useCurrentUserState();
  const { data, isPending } = useWorkspace(Boolean(user));
  const actions = useHelixActions();

  if (isPending || !data) return <div className="h-64 animate-pulse rounded-2xl bg-surface" />;

  const installed = new Set(data.skills.filter((s) => s.installed).map((s) => s.slug));

  return (
    <div className="space-y-10">
      <header>
        <p className="text-xs tracking-[0.18em] text-muted uppercase">Admin</p>
        <h1 className="mt-1 font-serif text-4xl">Oversight</h1>
        <p className="mt-2 max-w-xl text-sm text-muted">
          You are {data.profile.role}. Policies gate agents. Connectors stay read-only until a human confirms a write.
        </p>
      </header>

      <section>
        <h2 className="font-serif text-2xl">Governance</h2>
        <ul className="mt-4 space-y-3">
          {data.policies.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-4 rounded-2xl bg-surface p-4 shadow-[0_0_0_1px_rgb(255_255_255/0.08)]"
            >
              <div className="min-w-0">
                <p className="font-medium">{p.name}</p>
                <p className="text-sm text-muted">{p.rule}</p>
                <p className="mt-1 text-xs tracking-wide text-subtle uppercase">{p.domain}</p>
              </div>
              <Switch
                checked={p.enabled}
                onCheckedChange={(enabled) => {
                  void actions.policy.mutateAsync({ slug: p.slug, enabled });
                }}
                aria-label={p.name}
              />
            </li>
          ))}
          {data.policies.length === 0 && (
            <p className="text-sm text-muted">Run /init to seed default policies.</p>
          )}
        </ul>
      </section>

      <section>
        <h2 className="font-serif text-2xl">Agents</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {AGENT_ROLES.map((a) => {
            const on = installed.has(a.slug);
            return (
              <article
                key={a.slug}
                className="rounded-2xl bg-surface p-4 shadow-[0_0_0_1px_rgb(255_255_255/0.08)]"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-medium">{a.role}</h3>
                  <Badge variant={on ? "signal" : "default"}>{on ? "Armed" : "Idle"}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted">{a.blurb}</p>
                <p className="mt-2 font-mono text-xs text-subtle">{a.slug}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="font-serif text-2xl">Connectors</h2>
        <p className="mt-1 text-sm text-muted">
          Cross-platform via Grok. Probe is read-only. Writes stay gated.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {CONNECTOR_CATALOG.map((c) => {
            const row = data.connectors.find((x) => x.provider === c.provider);
            const status = row?.status ?? "idle";
            return (
              <article
                key={c.provider}
                className="rounded-2xl bg-surface p-4 shadow-[0_0_0_1px_rgb(255_255_255/0.08)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-medium">{c.label}</h3>
                    <p className="mt-1 text-sm text-muted">{row?.detail || c.blurb}</p>
                  </div>
                  <Badge
                    variant={
                      status === "connected" ? "signal" : status === "error" ? "danger" : "default"
                    }
                  >
                    {status}
                  </Badge>
                </div>
                <Button
                  className="mt-4"
                  size="sm"
                  variant="secondary"
                  disabled={actions.probe.isPending}
                  onClick={async () => {
                    const res = await actions.probe.mutateAsync(c.provider);
                    if (res.loginRequired && res.loginUrl) {
                      redirectToLoginIfRequired({
                        ok: false,
                        data: null,
                        loginRequired: true,
                        loginUrl: res.loginUrl,
                      });
                    } else if (res.loginRequired) {
                      toast.message("Open Helix through Grok to attach this connector.");
                    } else {
                      toast.success("Probe finished.");
                    }
                  }}
                >
                  Probe
                </Button>
              </article>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="font-serif text-2xl">Playbooks</h2>
        {data.combos.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Combine skills in the library to land a playbook here.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {data.combos.map((c) => (
              <li
                key={c.id}
                className="rounded-2xl bg-surface p-4 shadow-[0_0_0_1px_rgb(255_255_255/0.08)]"
              >
                <p className="font-medium">{c.name}</p>
                <p className="font-mono text-xs text-subtle">{c.slugs}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
