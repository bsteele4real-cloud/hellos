import { cn } from "@/lib/utils";

export function HelixMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("text-accent", className)}
      aria-hidden="true"
    >
      <path
        d="M10 4c6 4 6 20 12 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M22 4c-6 4-6 20-12 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.55"
      />
      <circle cx="16" cy="10" r="1.4" fill="currentColor" />
      <circle cx="16" cy="16" r="1.4" fill="currentColor" opacity="0.7" />
      <circle cx="16" cy="22" r="1.4" fill="currentColor" opacity="0.45" />
    </svg>
  );
}
