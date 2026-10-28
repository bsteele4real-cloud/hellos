import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useHelixActions } from "@/lib/helix/use-workspace";
import { toast } from "sonner";

export function CommandBar() {
  const [value, setValue] = useState("");
  const nav = useNavigate();
  const actions = useHelixActions();

  async function run(raw: string) {
    const text = raw.trim();
    if (!text) return;
    const lower = text.toLowerCase();
    try {
      if (lower === "/init" || lower === "init") {
        await actions.init.mutateAsync();
        toast.success("Workspace initialized. Recording is live.");
      } else if (lower === "/compact" || lower === "compact") {
        const res = await actions.compact.mutateAsync();
        toast.success(`Compacted ${res.notes} notes, saved ${res.saved} tokens.`);
      } else if (lower === "/report" || lower === "report") {
        await actions.report.mutateAsync();
        toast.success("Daily briefing written.");
      } else if (lower.startsWith("/skill")) {
        void nav({ to: "/skills" });
      } else if (lower.startsWith("/log mistake")) {
        const label = text.replace(/^\/log mistake\s*/i, "").trim();
        if (!label) {
          toast.error("Usage: /log mistake <pattern>");
          return;
        }
        await actions.log.mutateAsync({ kind: "mistake", label });
        toast.message("Mistake recorded. Repeats will flag.");
      } else if (lower.startsWith("/log")) {
        const label = text.replace(/^\/log\s*/i, "").trim();
        if (!label) {
          toast.error("Usage: /log <action>");
          return;
        }
        await actions.log.mutateAsync({ kind: "action", label });
        toast.success("Action recorded.");
      } else {
        await actions.log.mutateAsync({ kind: "action", label: text });
        toast.success("Logged as an action. Prefix with /init, /compact, or /log mistake.");
      }
      setValue("");
    } catch {
      toast.error("Command failed. Sign in and try again.");
    }
  }

  return (
    <form
      className="flex flex-col gap-2 sm:flex-row"
      onSubmit={(e) => {
        e.preventDefault();
        void run(value);
      }}
    >
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="/init  ·  /compact  ·  /log mistake skip compact  ·  /report"
        aria-label="Helix command"
        className="font-mono text-[13px]"
      />
      <Button type="submit" className="sm:w-32">
        Run
      </Button>
    </form>
  );
}
