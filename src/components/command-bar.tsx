import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CompactConfirm } from "@/components/compact-confirm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { interpretCommand } from "@/lib/helix/commands";
import { localCompact } from "@/lib/helix/compact";
import { textForCompact } from "@/lib/helix/governance";
import { mutationErrorMessage } from "@/lib/helix/mutation-error";
import { useHelixActions, useWorkspace } from "@/lib/helix/use-workspace";
import { toast } from "sonner";

export function CommandBar() {
  const [value, setValue] = useState("");
  const [confirmCompact, setConfirmCompact] = useState(false);
  const nav = useNavigate();
  const actions = useHelixActions();
  const { user } = useCurrentUserState();
  const ws = useWorkspace(Boolean(user));
  const raw = (ws.data?.memories ?? []).filter((note) => !note.compacted);

  async function run(input: string) {
    const intent = interpretCommand(input);
    if (intent.type === "empty") return;
    try {
      if (intent.type === "init") {
        await actions.init.mutateAsync();
        toast.success("Workspace ready. Your history starts empty.");
      } else if (intent.type === "compact") {
        if (raw.length === 0) toast.message("Nothing to shorten.");
        else setConfirmCompact(true);
      } else if (intent.type === "report") {
        await actions.report.mutateAsync();
        toast.success("Today's summary is ready.");
      } else if (intent.type === "skills") {
        void nav({ to: "/skills" });
      } else if (intent.type === "log") {
        await actions.log.mutateAsync({ kind: intent.kind, label: intent.label });
        toast.success(
          intent.kind === "mistake" ? "Mistake recorded. The third repeat gets flagged." : "Saved.",
        );
      } else {
        toast.error(intent.message);
        return;
      }
      setValue("");
    } catch (error) {
      toast.error(mutationErrorMessage(error));
    }
  }

  return (
    <>
      <CompactConfirm
        open={confirmCompact}
        notes={raw.length}
        preview={
          raw[0] ? localCompact(textForCompact(raw[0].body, ws.data?.policies ?? []).text) : ""
        }
        pending={actions.compact.isPending}
        onCancel={() => setConfirmCompact(false)}
        onConfirm={() => {
          void (async () => {
            try {
              const res = await actions.compact.mutateAsync();
              toast.success(
                `Shortened ${res.notes} notes and saved ${res.saved} tokens. Undo is on each note.`,
              );
              setConfirmCompact(false);
            } catch (error) {
              toast.error(mutationErrorMessage(error));
            }
          })();
        }}
      />
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
          placeholder="/init, /compact, /log, /log mistake, /report"
          aria-label="Command"
          className="font-mono text-[13px]"
        />
        <Button type="submit" className="sm:w-32">
          Run
        </Button>
      </form>
    </>
  );
}
