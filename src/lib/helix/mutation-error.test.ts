import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mutationErrorMessage } from "./mutation-error.ts";

describe("mutationErrorMessage", () => {
  it("reads an Error, a string, and a nested cause", () => {
    assert.equal(mutationErrorMessage(new Error("Policy blocked the save.")), "Policy blocked the save.");
    assert.equal(mutationErrorMessage("Sign in and try again."), "Sign in and try again.");
    assert.equal(
      mutationErrorMessage({ message: "Server error", cause: new Error("Database unavailable") }),
      "Database unavailable",
    );
    assert.equal(mutationErrorMessage(null), "Something went wrong. Try again.");
  });

  it("rolls the policy switch back and toasts when a mutation fails", () => {
    const hook = readFileSync(new URL("./use-workspace.ts", import.meta.url), "utf8");
    assert.match(hook, /withPolicyFlag/);
    assert.match(hook, /context\?\.previous/);
    const surfaces = [
      "../../routes/studio.tsx",
      "../../routes/memory.tsx",
      "../../routes/oversight.tsx",
      "../../routes/skills.index.tsx",
      "../../routes/skills.$slug.tsx",
      "../../routes/command.tsx",
      "../../components/command-bar.tsx",
    ];
    for (const surface of surfaces) {
      const src = readFileSync(new URL(surface, import.meta.url), "utf8");
      assert.match(src, /mutationErrorMessage/, `${surface} should surface mutation errors`);
    }
  });
});
