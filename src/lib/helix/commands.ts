export type CommandIntent =
  | { type: "empty" }
  | { type: "init" }
  | { type: "compact" }
  | { type: "report" }
  | { type: "skills" }
  | { type: "log"; kind: "action" | "mistake"; label: string }
  | { type: "unknown"; message: string };

const UNKNOWN = "Unknown command. Use /init, /compact, /log, /log mistake, /report, or /skill.";

export function interpretCommand(raw: string): CommandIntent {
  const text = raw.trim();
  if (!text) return { type: "empty" };
  const lower = text.toLowerCase();

  if (lower === "/init" || lower === "init") return { type: "init" };
  if (lower === "/compact" || lower === "compact") return { type: "compact" };
  if (lower === "/report" || lower === "report") return { type: "report" };
  if (
    lower === "/skill" ||
    lower.startsWith("/skill ") ||
    lower === "/skills" ||
    lower.startsWith("/skills ")
  ) {
    return { type: "skills" };
  }
  if (lower.startsWith("/log mistake")) {
    const label = text.replace(/^\/log mistake\s*/i, "").trim();
    if (!label) {
      return {
        type: "unknown",
        message: "Add what went wrong. Example: /log mistake skipped shortening notes",
      };
    }
    return { type: "log", kind: "mistake", label };
  }
  if (lower.startsWith("/log")) {
    const label = text.replace(/^\/log\s*/i, "").trim();
    if (!label) {
      return { type: "unknown", message: "Add what you did. Example: /log reviewed the udev rule" };
    }
    return { type: "log", kind: "action", label };
  }
  if (text.startsWith("/")) return { type: "unknown", message: UNKNOWN };
  return {
    type: "unknown",
    message: "That was not saved. To record it, start with /log and then what you did.",
  };
}
