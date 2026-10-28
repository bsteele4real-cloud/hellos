import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { AuthGate } from "@/components/auth-gate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { compactBudget, formatTokens } from "@/lib/helix/token";
import { useHelixActions, useWorkspace } from "@/lib/helix/use-workspace";
import { toast } from "sonner";

export const Route = createFileRoute("/memory")({ component: MemoryRoute });

function MemoryRoute() {
  return (
    <AuthGate>
      <AppShell>
        <MemoryPage />
      </AppShell>
    </AuthGate>
  );
}

function MemoryPage() {
  const { user } = useCurrentUserState();
  const { data, isPending } = useWorkspace(Boolean(user));
  const actions = useHelixActions();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");

  if (isPending || !data) return <div className="h-64 animate-pulse rounded-2xl bg-surface" />;

  const raw = data.memories.filter((m) => !m.compacted);
  const total = data.memories.reduce((a, m) => a + m.token_estimate, 0);
  const potential = raw.reduce((a, m) => a + compactBudget(m.token_estimate).saved, 0);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs tracking-[0.18em] text-muted uppercase">Second brain</p>
          <h1 className="mt-1 font-serif text-4xl">Shared memory</h1>
          <p className="mt-2 max-w-xl text-sm text-muted">
            Agents recall compacted notes, not transcripts. /compact runs redaction first when governance is on.
          </p>
        </div>
        <Button
          onClick={async () => {
            const res = await actions.compact.mutateAsync();
            toast.success(`Saved ${res.saved} tokens across ${res.notes} notes.`);
          }}
          disabled={actions.compact.isPending || raw.length === 0}
        >
          {actions.compact.isPending ? "Compacting…" : `Compact (${raw.length})`}
        </Button>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <Stat label="Notes" value={String(data.memories.length)} />
        <Stat label="Tokens now" value={formatTokens(total)} />
        <Stat label="If compacted" value={formatTokens(potential) + " saved"} />
      </section>

      <form
        className="rounded-2xl bg-surface p-5 shadow-[0_0_0_1px_rgb(255_255_255/0.08)]"
        onSubmit={async (e) => {
          e.preventDefault();
          await actions.memory.mutateAsync({ title, body, tags });
          setTitle("");
          setBody("");
          setTags("");
          toast.success("Memory written.");
        }}
      >
        <h2 className="font-serif text-2xl">Write</h2>
        <div className="mt-4 grid gap-3">
          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <Input placeholder="tags, comma-separated" value={tags} onChange={(e) => setTags(e.target.value)} />
          <Textarea
            placeholder="Decision, path, or handoff. Not a transcript."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
          />
          <Button type="submit" disabled={actions.memory.isPending}>
            Save note
          </Button>
        </div>
      </form>

      <section className="space-y-3">
        {data.memories.map((m) => (
          <article
            key={m.id}
            className="rounded-2xl bg-surface p-5 shadow-[0_0_0_1px_rgb(255_255_255/0.08)]"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-medium">{m.title}</h3>
              <div className="flex gap-2">
                {m.compacted && <Badge variant="signal">Compact</Badge>}
                <Badge>{formatTokens(m.token_estimate)}</Badge>
              </div>
            </div>
            {m.tags && <p className="mt-1 text-xs text-subtle">{m.tags}</p>}
            <p className="mt-3 whitespace-pre-wrap text-sm text-muted">{m.body}</p>
          </article>
        ))}
        {data.memories.length === 0 && (
          <p className="text-sm text-muted">Empty brain. Write a note or run /init.</p>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-2xl bg-surface p-4 shadow-[0_0_0_1px_rgb(255_255_255/0.08)]">
      <p className="text-xs tracking-wide text-subtle uppercase">{label}</p>
      <p className="mt-2 font-serif text-2xl tabular-nums">{value}</p>
    </article>
  );
}
