import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

export function CompactConfirm({
  open,
  notes,
  preview,
  pending,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  notes: number;
  preview: string;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const label = notes === 1 ? "1 note" : `${notes} notes`;
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent>
        <DialogTitle>Shorten {label}?</DialogTitle>
        <DialogDescription>
          This replaces the note text with a shorter version. The current text is kept, and you can
          undo each note. Secrets are removed first when that policy is on.
        </DialogDescription>
        {preview ? (
          <div className="mt-4">
            <p className="text-xs text-muted">Preview of the first note</p>
            <pre className="mt-2 max-h-40 overflow-auto font-sans text-sm whitespace-pre-wrap text-fg">
              {preview}
            </pre>
          </div>
        ) : null}
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={onConfirm} disabled={pending}>
            {pending ? "Shortening…" : "Shorten notes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
