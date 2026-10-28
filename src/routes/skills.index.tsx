import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import { HelixMark } from "@/components/helix-mark";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { CATEGORY_LABEL, SKILL_CATALOG, type CatalogSkill } from "@/lib/helix/catalog";
import { useHelixActions, useWorkspace } from "@/lib/helix/use-workspace";
import { formatTokens } from "@/lib/helix/token";
import { toast } from "sonner";

export const Route = createFileRoute("/skills/")({ component: SkillsRoute });

function SkillsRoute() {
  const { user, isPending } = useCurrentUserState();
  const authed = Boolean(user);
  const ws = useWorkspace(authed && !isPending);

  if (isPending) {
    return <div className="min-h-dvh bg-bg" />;
  }

  if (authed) {
    return (
      <AppShell>
        <SkillsPage
          catalogFallback={!ws.data}
          loading={ws.isPending}
          rows={
            ws.data?.skills.map((s) => ({
              slug: s.slug,
              name: s.name,
              category: s.category as CatalogSkill["category"],
              summary: s.summary,
              tokenCost: s.token_cost,
              installed: s.installed,
              origin: s.origin,
            })) ?? SKILL_CATALOG.map((s) => ({ ...s, installed: s.defaultInstalled, origin: "catalog" }))
          }
        />
      </AppShell>
    );
  }

  return (
    <PublicWrap>
      <SkillsPage
        catalogFallback
        loading={false}
        rows={SKILL_CATALOG.map((s) => ({
          ...s,
          installed: false,
          origin: "catalog",
        }))}
      />
    </PublicWrap>
  );
}

function PublicWrap({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 md:px-8">
        <Link to="/" className="flex items-center gap-2">
          <HelixMark className="size-7" />
          <span className="font-serif text-xl tracking-tight">Helix</span>
        </Link>
        <Link to="/login" className="text-sm text-muted hover:text-fg">
          Sign in
        </Link>
      </header>
      <div className="mx-auto w-full max-w-6xl px-4 pb-16 md:px-8">{children}</div>
    </div>
  );
}

type Row = {
  slug: string;
  name: string;
  category: CatalogSkill["category"];
  summary: string;
  tokenCost: number;
  installed: boolean;
  origin: string;
};

function SkillsPage({
  rows,
  loading,
  catalogFallback,
}: {
  rows: Row[];
  loading: boolean;
  catalogFallback: boolean;
}) {
  const { user } = useCurrentUserState();
  const actions = useHelixActions();
  const [picked, setPicked] = useState<string[]>([]);
  const [comboName, setComboName] = useState("");
  const [open, setOpen] = useState(false);

  const installed = rows.filter((r) => r.installed);
  const grouped = useMemo(() => {
    const map = new Map<string, Row[]>();
    for (const r of rows) {
      const list = map.get(r.category) ?? [];
      list.push(r);
      map.set(r.category, list);
    }
    return [...map.entries()];
  }, [rows]);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs tracking-[0.18em] text-muted uppercase">Library</p>
          <h1 className="mt-1 font-serif text-4xl">Skills</h1>
          <p className="mt-2 max-w-xl text-sm text-muted">
            Combine protocols into a playbook. Generated Linux skills land here uninstalled until you skim them.
          </p>
        </div>
        {user && (
          <Button
            variant="secondary"
            disabled={picked.length < 2}
            onClick={() => setOpen(true)}
          >
            Combine ({picked.length})
          </Button>
        )}
      </header>

      {loading ? (
        <div className="h-48 animate-pulse rounded-2xl bg-surface" />
      ) : (
        grouped.map(([cat, list]) => (
          <section key={cat}>
            <h2 className="font-serif text-2xl">
              {CATEGORY_LABEL[cat as CatalogSkill["category"]] ?? cat}
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {list.map((s) => (
                <article
                  key={s.slug}
                  className="rounded-2xl bg-surface p-4 shadow-[0_0_0_1px_rgb(255_255_255/0.08)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      to="/skills/$slug"
                      params={{ slug: s.slug }}
                      className="min-w-0"
                    >
                      <h3 className="font-medium">{s.name}</h3>
                      <p className="mt-1 text-sm text-muted">{s.summary}</p>
                    </Link>
                    {s.installed && <Badge variant="signal">On</Badge>}
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-2">
                    <p className="font-mono text-xs text-subtle">
                      {formatTokens(s.tokenCost)} · {s.origin}
                    </p>
                    {user && !catalogFallback && (
                      <label className="flex min-h-11 items-center gap-2 text-xs text-muted">
                        <input
                          type="checkbox"
                          className="size-4 accent-accent"
                          checked={picked.includes(s.slug)}
                          onChange={(e) =>
                            setPicked((prev) =>
                              e.target.checked
                                ? [...prev, s.slug]
                                : prev.filter((x) => x !== s.slug),
                            )
                          }
                        />
                        Combine
                      </label>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))
      )}

      {user && installed.length > 0 && (
        <p className="text-xs text-subtle">{installed.length} installed in this workspace.</p>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>Combine skills</DialogTitle>
          <DialogDescription>
            A playbook inherits purpose from each child. Token cost is estimated as the sum, then compacted in Studio.
          </DialogDescription>
          <Input
            className="mt-4"
            placeholder="Playbook name"
            value={comboName}
            onChange={(e) => setComboName(e.target.value)}
          />
          <p className="mt-2 text-xs text-muted">{picked.join(" + ")}</p>
          <Button
            className="mt-4 w-full"
            disabled={actions.combo.isPending}
            onClick={async () => {
              await actions.combo.mutateAsync({ name: comboName, slugs: picked });
              toast.success("Playbook saved.");
              setOpen(false);
              setPicked([]);
              setComboName("");
            }}
          >
            Save playbook
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
