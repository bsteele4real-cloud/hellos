import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { CopyButton } from "@/components/copy-button";
import { ProtocolView } from "@/components/protocol-view";
import { AuthGate } from "@/components/auth-gate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { SKILL_CATALOG } from "@/lib/helix/catalog";
import {
  MAX_SKILLS_HARD,
  MAX_SKILLS_IN_PROMPT,
  TOKEN_BUDGET,
  studioSkillSelection,
} from "@/lib/helix/governance";
import { estimatePromptTokens, formatTokenLabel, formatTokens } from "@/lib/helix/token";
import { mutationErrorMessage } from "@/lib/helix/mutation-error";
import { useHelixActions, useWorkspace } from "@/lib/helix/use-workspace";
import { toast } from "sonner";

export const Route = createFileRoute("/studio")({ component: StudioRoute });

const TARGETS = [
  { id: "bash", label: "Bash job" },
  { id: "hardening", label: "Android / host hardening" },
  { id: "systemd", label: "systemd user timer" },
  { id: "audit", label: "Audit log line" },
  { id: "loop", label: "Loop improver" },
] as const;

function StudioRoute() {
  return (
    <AuthGate>
      <AppShell>
        <StudioPage />
      </AppShell>
    </AuthGate>
  );
}

function StudioPage() {
  const { user } = useCurrentUserState();
  const { data, isPending } = useWorkspace(Boolean(user));
  const actions = useHelixActions();
  const [name, setName] = useState("udev adb lock");
  const [brief, setBrief] = useState(
    "Linux companion for the Android hardening protocol: udev rule so only plugdev can talk to this phone, plus a read-only ADB snapshot.",
  );
  const [target, setTarget] = useState<string>("hardening");
  const [slugs, setSlugs] = useState<string[]>([]);
  const [slugsTouched, setSlugsTouched] = useState(false);
  const [result, setResult] = useState<{
    protocol: string;
    script: string;
    estimate: number;
  } | null>(null);
  const [pendingScript, setPendingScript] = useState<{
    protocol: string;
    script: string;
  } | null>(null);

  const catalog = (data?.skills.length ? data.skills : SKILL_CATALOG).map((s) => ({
    slug: s.slug,
    name: s.name,
    token_cost: "token_cost" in s ? s.token_cost : s.tokenCost,
  }));

  const budgetOn = data?.policies.some((p) => p.slug === "token-budget-2k" && p.enabled) ?? true;
  const skillCapOn =
    data?.policies.some((p) => p.slug === "no-full-library-prompts" && p.enabled) ?? true;
  const allowlistOn =
    data?.policies.some((p) => p.slug === "agent-allowlist" && p.enabled) ?? true;
  const maxSkills = skillCapOn ? MAX_SKILLS_IN_PROMPT : MAX_SKILLS_HARD;
  const installedKey =
    data?.skills
      .filter((skill) => skill.installed)
      .map((skill) => skill.slug)
      .join("|") ?? "";

  useEffect(() => {
    if (slugsTouched || !data?.skills.length) return;
    setSlugs(studioSkillSelection(data.skills, allowlistOn));
  }, [allowlistOn, data?.skills, installedKey, slugsTouched]);

  const plan = useMemo(() => {
    const selected = catalog.filter((s) => slugs.includes(s.slug));
    const total = estimatePromptTokens({
      skillTokenCosts: selected.map((s) => s.token_cost),
      name,
      brief,
    });
    return { total, over: budgetOn && total > TOKEN_BUDGET, selected: selected.length };
  }, [brief, budgetOn, catalog, name, slugs]);

  if (isPending) return <div className="h-64 animate-pulse rounded-2xl bg-surface" />;

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs tracking-[0.18em] text-muted uppercase">Skill creator</p>
        <h1 className="mt-1 font-serif text-4xl">Studio</h1>
        <p className="mt-2 max-w-xl text-sm text-muted">
          Pre-plan tokens, then generate a Helix skill and Linux script. Governance caps you at
          three protocols.
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <form
          className="rounded-2xl bg-surface p-5 shadow-[0_0_0_1px_rgb(255_255_255/0.08)]"
          onSubmit={async (e) => {
            e.preventDefault();
            if (plan.over) {
              toast.error("Over 2,000 tokens. Drop a skill or shorten the brief.");
              return;
            }
            let res: Awaited<ReturnType<typeof actions.generate.mutateAsync>>;
            try {
              res = await actions.generate.mutateAsync({
                name,
                brief,
                target,
                slugs,
              });
            } catch (error) {
              toast.error(mutationErrorMessage(error));
              return;
            }
            if (res.error) {
              toast.error(res.error);
              return;
            }
            if (res.needsConfirm) {
              setPendingScript({ protocol: res.protocol, script: res.script });
              return;
            }
            setResult({
              protocol: res.protocol,
              script: res.script,
              estimate: res.estimate,
            });
            toast.success("Draft saved to the library (not installed).");
          }}
        >
          <label className="text-xs text-muted">Name</label>
          <Input className="mt-1" value={name} onChange={(e) => setName(e.target.value)} required />
          <label className="mt-4 block text-xs text-muted">Brief</label>
          <Textarea
            className="mt-1"
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            required
          />
          <label className="mt-4 block text-xs text-muted">Linux target</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {TARGETS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTarget(t.id)}
                className={
                  target === t.id
                    ? "h-11 rounded-full bg-accent px-3 text-sm text-accent-fg"
                    : "h-11 rounded-full bg-elevated px-3 text-sm text-muted"
                }
              >
                {t.label}
              </button>
            ))}
          </div>
          <label className="mt-4 block text-xs text-muted">
            Skills to include{skillCapOn ? " (max 3)" : ""}
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {catalog.map((s) => {
              const on = slugs.includes(s.slug);
              return (
                <button
                  key={s.slug}
                  type="button"
                  onClick={() => {
                    setSlugsTouched(true);
                    if (on) {
                      setSlugs((prev) => prev.filter((x) => x !== s.slug));
                      return;
                    }
                    if (slugs.length >= maxSkills) {
                      toast.error(
                        skillCapOn
                          ? "Three skills is the limit while no-full-library prompts is on."
                          : "You can include up to 12 skills.",
                      );
                      return;
                    }
                    setSlugs((prev) => [...prev, s.slug]);
                  }}
                  className={
                    on
                      ? "h-11 rounded-full bg-elevated px-3 text-xs text-fg shadow-[0_0_0_1px_rgb(255_255_255/0.14)]"
                      : "h-11 rounded-full px-3 text-xs text-muted shadow-[0_0_0_1px_rgb(255_255_255/0.08)]"
                  }
                >
                  {s.name}
                </button>
              );
            })}
          </div>
          <Button className="mt-6 w-full" type="submit" disabled={actions.generate.isPending}>
            {actions.generate.isPending ? "Generating…" : "Generate skill"}
          </Button>
        </form>

        <aside className="rounded-2xl bg-surface p-5 shadow-[0_0_0_1px_rgb(255_255_255/0.08)]">
          <h2 className="font-serif text-2xl">Pre-plan</h2>
          <p className="mt-3 font-serif text-4xl tabular-nums">{formatTokens(plan.total)}</p>
          <p className="text-sm text-muted">estimated prompt tokens</p>
          <div className="mt-4 flex gap-2">
            <Badge variant={plan.over ? "danger" : "signal"}>
              {budgetOn ? (plan.over ? "Over 2,000 tokens" : "Within 2,000 tokens") : "Budget off"}
            </Badge>
            <Badge>{plan.selected} skills</Badge>
          </div>
          <p className="mt-4 text-sm text-muted">
            Precision Token Engineering: drop a protocol or compact memory before you spend.
          </p>
        </aside>
      </section>

      <Dialog
        open={pendingScript !== null}
        onOpenChange={(open) => !open && setPendingScript(null)}
      >
        <DialogContent>
          <DialogTitle>Save this script?</DialogTitle>
          <DialogDescription>
            It uses a package install, firewall change, user change, or recursive delete. Those stay
            blocked until you confirm. The script is not run from here.
          </DialogDescription>
          <pre className="mt-4 max-h-48 overflow-auto font-mono text-xs text-muted">
            {pendingScript?.script}
          </pre>
          <Button
            className="mt-4 w-full"
            disabled={actions.generate.isPending}
            onClick={async () => {
              if (!pendingScript) return;
              let res: Awaited<ReturnType<typeof actions.generate.mutateAsync>>;
              try {
                res = await actions.generate.mutateAsync({
                  name,
                  brief,
                  target,
                  slugs,
                  confirmDestructive: true,
                  draftProtocol: pendingScript.protocol,
                  draftScript: pendingScript.script,
                });
              } catch (error) {
                toast.error(mutationErrorMessage(error));
                return;
              }
              if (res.error) {
                toast.error(res.error);
                return;
              }
              if (res.needsConfirm) {
                toast.error("Confirm the destructive commands before saving.");
                return;
              }
              setResult({
                protocol: res.protocol,
                script: res.script,
                estimate: res.estimate,
              });
              setPendingScript(null);
              toast.success("Draft saved to the library (not installed).");
            }}
          >
            Save draft
          </Button>
        </DialogContent>
      </Dialog>

      {result && (
        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl bg-surface p-5 shadow-[0_0_0_1px_rgb(255_255_255/0.08)]">
            <h2 className="font-serif text-2xl">Protocol</h2>
            <div className="mt-3">
              <ProtocolView source={result.protocol} />
            </div>
          </article>
          <article className="rounded-2xl bg-elevated p-5 shadow-[0_0_0_1px_rgb(255_255_255/0.08)]">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-serif text-2xl">Linux</h2>
              <div className="flex items-center gap-2">
                <Badge>{formatTokenLabel(result.estimate)}</Badge>
                <CopyButton text={result.script} label="Copy script" />
              </div>
            </div>
            <pre className="mt-3 overflow-x-auto font-mono text-xs leading-relaxed text-muted">
              {result.script}
            </pre>
          </article>
        </section>
      )}
    </div>
  );
}
