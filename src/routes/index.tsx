import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { HelixMark } from "@/components/helix-mark";
import { Button } from "@/components/ui/button";
import { SignedIn, SignedOut, UserButton } from "@/lib/auth/gates";
import { CATEGORY_LABEL, SKILL_CATALOG } from "@/lib/helix/catalog";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const { isPending } = useCurrentUserState();

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 md:px-8">
        <Link to="/" className="flex items-center gap-2">
          <HelixMark className="size-7" />
          <span className="font-serif text-xl tracking-tight">Helix</span>
        </Link>
        <div className="flex items-center gap-3">
          {isPending ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-elevated" />
          ) : (
            <>
              <SignedOut>
                <Link
                  to="/login"
                  className="inline-flex h-11 items-center rounded-md px-4 text-sm text-muted hover:text-fg"
                >
                  Sign in
                </Link>
              </SignedOut>
              <SignedIn>
                <UserButton />
              </SignedIn>
            </>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-24 md:px-8">
        <section className="grid gap-10 pt-10 pb-16 md:grid-cols-[1.2fr_0.8fr] md:pt-16">
          <div>
            <p className="text-xs tracking-[0.2em] text-muted uppercase">
              Skills, notes, and rules
            </p>
            <h1 className="mt-4 font-serif text-5xl font-medium tracking-tight md:text-6xl">
              Record the work.
              <br />
              Shorten the noise.
            </h1>
            <p className="mt-5 max-w-xl text-base text-muted">
              Helix keeps the skills you use, the notes you want to remember, and
              the rules that limit what an agent can do. Set up a workspace, shorten
              notes before generating a skill, and log a mistake when it happens
              again. The third time, it gets flagged.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {isPending ? (
                <Button asChild>
                  <Link to="/login">
                    Sign in to set up <ArrowRight className="size-4" />
                  </Link>
                </Button>
              ) : (
                <>
                  <SignedIn>
                    <Button asChild>
                      <Link to="/command">
                        Open command <ArrowRight className="size-4" />
                      </Link>
                    </Button>
                  </SignedIn>
                  <SignedOut>
                    <Button asChild>
                      <Link to="/login">
                        Sign in to set up <ArrowRight className="size-4" />
                      </Link>
                    </Button>
                  </SignedOut>
                </>
              )}
              <Button asChild variant="secondary">
                <Link to="/skills">Browse skills</Link>
              </Button>
            </div>
          </div>
          <aside className="rounded-2xl bg-surface p-5 shadow-[0_0_0_1px_rgb(255_255_255/0.08)]">
            <p className="font-mono text-xs text-subtle">helix › command</p>
            <ul className="mt-4 space-y-3 text-sm">
              {[
                ["/init", "Set up this workspace. History starts empty."],
                ["/compact", "Shorten notes. You can undo each one."],
                ["/log mistake", "Record a mistake."],
                ["/report", "Write today's summary."],
              ].map(([cmd, copy]) => (
                <li key={cmd} className="flex gap-3">
                  <code className="w-28 shrink-0 font-mono text-accent">{cmd}</code>
                  <span className="text-muted">{copy}</span>
                </li>
              ))}
            </ul>
          </aside>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            {
              k: "01",
              t: "Skill library",
              d: "Memory, security, and Linux skills you can combine into a playbook.",
            },
            {
              k: "02",
              t: "Plan, then generate",
              d: "See the token estimate before a script is written. Three skills at a time, unless you turn that rule off.",
            },
            {
              k: "03",
              t: "Oversight",
              d: "Turn rules on or off, check connectors, and see mistakes that keep repeating.",
            },
          ].map((item) => (
            <article
              key={item.k}
              className="rounded-2xl bg-surface p-5 shadow-[0_0_0_1px_rgb(255_255_255/0.08)]"
            >
              <p className="font-mono text-xs text-subtle">{item.k}</p>
              <h2 className="mt-3 font-serif text-2xl">{item.t}</h2>
              <p className="mt-2 text-sm text-muted">{item.d}</p>
            </article>
          ))}
        </section>

        <section className="mt-16">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-serif text-3xl">Library</h2>
            <Link to="/skills" className="text-sm text-muted hover:text-fg">
              View all
            </Link>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {SKILL_CATALOG.map((s) => (
              <Link
                key={s.slug}
                to="/skills/$slug"
                params={{ slug: s.slug }}
                className="rounded-xl bg-surface p-4 shadow-[0_0_0_1px_rgb(255_255_255/0.08)] transition-colors hover:bg-elevated"
              >
                <p className="text-xs tracking-wide text-subtle uppercase">
                  {CATEGORY_LABEL[s.category]}
                </p>
                <h3 className="mt-2 font-medium">{s.name}</h3>
                <p className="mt-1 line-clamp-3 text-sm text-muted">{s.summary}</p>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
