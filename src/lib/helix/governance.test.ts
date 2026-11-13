import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { estimatePromptTokens } from "./token.ts";
import {
  MAX_SKILLS_IN_PROMPT,
  TOKEN_BUDGET,
  buildCompactPrompt,
  connectorToolAllowed,
  destructiveGate,
  isPolicyEnabled,
  redactSecrets,
  resolveGeneratedSkill,
  reviewCombo,
  reviewGeneration,
  scriptIsDestructive,
  textForCompact,
  withPolicyFlag,
} from "./governance.ts";

const ON = [
  { slug: "redact-before-compact", enabled: true },
  { slug: "token-budget-2k", enabled: true },
  { slug: "no-full-library-prompts", enabled: true },
  { slug: "human-gate-destructive", enabled: true },
  { slug: "agent-allowlist", enabled: true },
  { slug: "connector-least-privilege", enabled: true },
  { slug: "improver-proposes-only", enabled: true },
];

const off = (slug: string) => ON.map((p) => (p.slug === slug ? { ...p, enabled: false } : p));

describe("redact before compact", () => {
  it("strips keys, passwords, connection strings, and bearer tokens", () => {
    const raw = [
      "Keep the decision.",
      "api_key=abcd1234efgh",
      "password: hunter2hunter",
      "postgres://user:secretpass@localhost:5432/helix",
      "Authorization: Bearer aaa.bbb.ccc-token",
      "sk-abc123def456ghi789",
    ].join("\n");
    const { text, hits } = redactSecrets(raw);
    assert.ok(hits >= 5);
    assert.match(text, /Keep the decision/);
    assert.doesNotMatch(text, /abcd1234efgh/);
    assert.doesNotMatch(text, /hunter2hunter/);
    assert.doesNotMatch(text, /secretpass/);
    assert.doesNotMatch(text, /aaa\.bbb\.ccc/);
    assert.doesNotMatch(text, /sk-abc123def456ghi789/);
  });

  it("leaves ordinary notes alone", () => {
    const note = "Hard cap 2 000 prompt tokens per generation. Daily compact at 08:00.";
    const { text, hits } = redactSecrets(note);
    assert.equal(hits, 0);
    assert.equal(text, note);
  });

  it("omits secrets from the model prompt only when the policy is on", () => {
    const body = "Rotate api_key=supersecretvalue before Friday.";
    const hidden = buildCompactPrompt("Keys", body, ON);
    assert.doesNotMatch(hidden.prompt, /supersecretvalue/);
    assert.ok(hidden.hits >= 1);
    const shown = buildCompactPrompt("Keys", body, off("redact-before-compact"));
    assert.match(shown.prompt, /supersecretvalue/);
    assert.equal(shown.hits, 0);
    assert.equal(textForCompact(body, []).text.includes("supersecretvalue"), false);
  });
});

describe("server-side generation gates", () => {
  it("blocks prompts over 2k tokens and more than three skills when those policies are on", () => {
    const tokens = estimatePromptTokens({
      skillTokenCosts: [900, 900, 400],
      name: "big",
      brief: "x".repeat(80),
    });
    assert.ok(tokens > TOKEN_BUDGET);
    const budget = reviewGeneration({
      skillCount: 2,
      promptTokens: tokens,
      uninstalledSlugs: [],
      policies: ON,
    });
    assert.match(budget ?? "", /2000/);
    const skills = reviewGeneration({
      skillCount: MAX_SKILLS_IN_PROMPT + 1,
      promptTokens: 100,
      uninstalledSlugs: [],
      policies: ON,
    });
    assert.match(skills ?? "", /at most 3/);
    assert.equal(
      reviewGeneration({
        skillCount: 4,
        promptTokens: tokens,
        uninstalledSlugs: [],
        policies: off("token-budget-2k").map((p) =>
          p.slug === "no-full-library-prompts" ? { ...p, enabled: false } : p,
        ),
      }),
      null,
    );
  });

  it("denies skills that are not installed while the allowlist is on", () => {
    const message = reviewGeneration({
      skillCount: 1,
      promptTokens: 100,
      uninstalledSlugs: ["android-hardening-protocol"],
      policies: ON,
    });
    assert.match(message ?? "", /android-hardening-protocol/);
    assert.equal(
      reviewGeneration({
        skillCount: 1,
        promptTokens: 100,
        uninstalledSlugs: ["android-hardening-protocol"],
        policies: off("agent-allowlist"),
      }),
      null,
    );
  });

  it("requires a confirm before a destructive script is kept", () => {
    const script = "#!/usr/bin/env bash\nsudo apt-get install wireguard\n";
    assert.equal(scriptIsDestructive(script), true);
    assert.equal(destructiveGate(script, ON, false), "confirm");
    assert.equal(destructiveGate(script, ON, true), "allow");
    assert.equal(destructiveGate(script, off("human-gate-destructive"), false), "allow");
    assert.equal(
      scriptIsDestructive("# do not sudo\nmkdir -p \"$HOME/.local/share/helix\"\n"),
      false,
    );
  });

  it("keeps loop proposals uninstalled", () => {
    assert.deepEqual(resolveGeneratedSkill({ target: "loop", policies: ON }), {
      installed: false,
      origin: "proposal",
    });
    assert.equal(resolveGeneratedSkill({ target: "bash", policies: ON }).origin, "generated");
  });

  it("blocks connector tools outside the read-only probe list", () => {
    assert.equal(connectorToolAllowed("gmail_search_messages", ON), null);
    assert.match(connectorToolAllowed("gmail_send_message", ON) ?? "", /read-only/);
    assert.equal(connectorToolAllowed("gmail_send_message", off("connector-least-privilege")), null);
  });

  it("caps playbooks at three skills while the library policy is on", () => {
    assert.match(reviewCombo(4, ON) ?? "", /at most 3/);
    assert.equal(reviewCombo(3, ON), null);
    assert.equal(reviewCombo(4, off("no-full-library-prompts")), null);
    assert.match(reviewCombo(1, off("no-full-library-prompts")) ?? "", /at least two/);
  });

  it("toggles a policy immutably so a failed save can roll back", () => {
    const original = [{ slug: "token-budget-2k", enabled: true, name: "budget" }];
    const next = withPolicyFlag(original, "token-budget-2k", false);
    assert.equal(next[0]?.enabled, false);
    assert.equal(original[0]?.enabled, true);
    assert.equal(isPolicyEnabled([], "token-budget-2k"), true);
  });
});

describe("compact wiring", () => {
  it("sends the redacted prompt helper, not the raw note body", () => {
    const src = readFileSync(new URL("../fns/workspace.ts", import.meta.url), "utf8");
    assert.match(src, /buildCompactPrompt/);
    assert.match(src, /reviewGeneration/);
    assert.match(src, /destructiveGate/);
    assert.match(src, /connectorToolAllowed/);
    assert.doesNotMatch(src, /\$\{row\.body\}/);
  });
});
