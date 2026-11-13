import { Button } from "@/components/ui/button";
import { mutationErrorMessage } from "@/lib/helix/mutation-error";
import { toast } from "sonner";

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  return (
    <Button
      type="button"
      size="sm"
      variant="secondary"
      onClick={() => {
        void navigator.clipboard.writeText(text).then(
          () => toast.success("Copied."),
          (error: unknown) => toast.error(mutationErrorMessage(error)),
        );
      }}
    >
      {label}
    </Button>
  );
}
