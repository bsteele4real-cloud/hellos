import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { interpretCommand } from "./commands.ts";

describe("interpretCommand", () => {
  it("recognizes the built-in commands", () => {
    assert.equal(interpretCommand("  /init ").type, "init");
    assert.equal(interpretCommand("/compact").type, "compact");
    assert.equal(interpretCommand("/report").type, "report");
    assert.equal(interpretCommand("/skill android").type, "skills");
    assert.deepEqual(interpretCommand("/log reviewed the rule"), {
      type: "log",
      kind: "action",
      label: "reviewed the rule",
    });
    assert.deepEqual(interpretCommand("/log mistake skipped compact"), {
      type: "log",
      kind: "mistake",
      label: "skipped compact",
    });
  });

  it("does not treat unknown text as a saved action", () => {
    const prose = interpretCommand("hello there");
    assert.equal(prose.type, "unknown");
    if (prose.type === "unknown") assert.match(prose.message, /not saved/);
    const slash = interpretCommand("/frobnicate");
    assert.equal(slash.type, "unknown");
    if (slash.type === "unknown") assert.match(slash.message, /Unknown command/);
    assert.equal(interpretCommand("/log").type, "unknown");
    assert.equal(interpretCommand("   ").type, "empty");
  });
});
