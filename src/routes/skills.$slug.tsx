import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { HelixMark } from "@/components/helix-mark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { CATEGORY_LABEL, skillBySlug } from "@/lib/helix/catalog";
import { formatTokens } from "@/lib/helix/token";
import { useHelixActions, useWorkspace } from "@/lib/helix/use-workspace";
import { toast } from "sonner";

export const Route = createFileRoute("/skills/$slug")({ component: SkillDetail });

function SkillDetail() {
  const { slug } = Route.useParams();
  const { user, isPending } = useCurrentUserState();
  const ws = useWorkspace(Boolean(user) && !isPending);
  const actions = useHelixActions();
  const catalog = skillBySlug(slug);
  const row = ws.data?.skills.find((s) => s.slug === slug);
  const name = row?.name ?? catalog?.name ?? slug;
  const summary = row?.summary ?? catalog?.summary ?? "";
  const protocol = row?.protocol ?? catalog?.protocol ?? "Skill not found.";
  const category = row?.category ?? catalog?.category ?? "codegen";
  const tokens = row?.token_cost ?? catalog?.tokenCost ?? 0;
  const installed = row?.installed ?? false;
  const script = row?.linux_script;

  const inner = (
    <article className="space-y-6">
      <Link to="/skills" className="text-sm text-muted hover:text-fg">
        Library
      </Link>
      <header>
        <p className="text-xs tracking-wide text-subtle uppercase">
          {CATEGORY_LABEL[category as keyof typeof CATEGORY_LABEL] ?? category}
        </p>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <h1 className="font-serif text-4xl">{name}</h1>
          {user && row && (
            <Button
              variant={installed ? "secondary" : "default"}
              onClick={async () => {
                await actions.skill.mutateAsync({ slug, installed: !installed });
                toast.success(installed ? "Removed from workspace" : "Installed");
              }}
            >
              {installed ? "Remove" : "Install"}
            </Button>
          )}
        </div>
        <p className="mt-3 max-w-2xl text-sm text-muted">{summary}</p>
        <div className="mt-3 flex gap-2">
          <Badge>{formatTokens(tokens)}</Badge>
          {installed && <Badge variant="signal">Installed</Badge>}
        </div>
      </header>
      <section className="rounded-2xl bg-surface p-5 shadow-[0_0_0_1px_rgb(255_255_255/0.08)]">
        <pre className="font-sans text-sm leading-relaxed whitespace-pre-wrap text-fg">
          {protocol}
        </pre>
      </section>
      {script && (
        <section className="rounded-2xl bg-elevated p-5 shadow-[0_0_0_1px_rgb(255_255_255/0.08)]">
          <h2 className="font-serif text-xl">Linux</h2>
          <pre className="mt-3 overflow-x-auto font-mono text-xs leading-relaxed text-muted">
            {script}
          </pre>
        </section>
      )}
    </article>
  );

  if (isPending) return <div className="min-h-dvh bg-bg" />;
  if (user) return <AppShell>{inner}</AppShell>;
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
      <div className="mx-auto w-full max-w-6xl px-4 pb-16 md:px-8">{inner}</div>
    </div>
  );
}
