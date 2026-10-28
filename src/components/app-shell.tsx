import { Link, useRouterState } from "@tanstack/react-router";
import {
  BookOpen,
  Brain,
  LayoutDashboard,
  Shield,
  Wand2,
} from "lucide-react";
import type { ReactNode } from "react";
import { HelixMark } from "@/components/helix-mark";
import { UserButton } from "@/lib/auth/gates";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/command", label: "Command", icon: LayoutDashboard },
  { to: "/skills", label: "Skills", icon: BookOpen },
  { to: "/memory", label: "Memory", icon: Brain },
  { to: "/studio", label: "Studio", icon: Wand2 },
  { to: "/oversight", label: "Oversight", icon: Shield },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <aside className="fixed inset-y-0 left-0 hidden w-56 flex-col border-r border-border bg-surface/80 px-3 py-5 md:flex">
        <Link to="/" className="mb-8 flex items-center gap-2 px-2">
          <HelixMark className="size-7" />
          <span className="font-serif text-xl tracking-tight">Helix</span>
        </Link>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((item) => {
            const active = pathname === item.to || pathname.startsWith(item.to + "/");
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex h-11 items-center gap-2 rounded-lg px-3 text-sm transition-colors duration-150",
                  active
                    ? "bg-elevated text-fg"
                    : "text-muted hover:bg-elevated/60 hover:text-fg",
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border px-1 pt-3">
          <UserButton />
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-bg/90 px-4 py-3 backdrop-blur-sm md:hidden">
        <Link to="/" className="flex items-center gap-2">
          <HelixMark className="size-6" />
          <span className="font-serif text-lg">Helix</span>
        </Link>
        <UserButton />
      </header>

      <div className="md:pl-56">
        <main className="mx-auto w-full max-w-6xl px-4 pt-6 pb-24 md:px-8 md:pt-8 md:pb-12">
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] md:hidden">
        {NAV.map((item) => {
          const active = pathname === item.to || pathname.startsWith(item.to + "/");
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-1 text-[11px]",
                active ? "text-fg" : "text-muted",
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
