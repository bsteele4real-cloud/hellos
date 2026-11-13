import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { INIT_EVENT, initialHistory } from "./seed.ts";

describe("initial workspace history", () => {
  it("starts with no notes, mistakes, reports, or backdated events", () => {
    const history = initialHistory();
    assert.deepEqual(history.memories, []);
    assert.deepEqual(history.mistakes, []);
    assert.deepEqual(history.reports, []);
    assert.deepEqual(history.backdatedEvents, []);
    assert.equal(history.event, INIT_EVENT);
    assert.doesNotMatch(history.event.detail, /flagged loops/i);
    assert.doesNotMatch(history.event.detail, /analytics live/i);
  });

  it("does not ship fabricated user history in the init path", () => {
    const seed = readFileSync(new URL("./seed.ts", import.meta.url), "utf8");
    const init = readFileSync(new URL("../fns/workspace.ts", import.meta.url), "utf8");
    const forbidden = [
      "Three flagged loops",
      "Skipped compact",
      "Saved 1.2k tokens",
      "Handoff: Archivist",
      "seedMemories",
      "seedMistakes",
      "isoDaysAgo",
    ];
    for (const phrase of forbidden) {
      assert.equal(seed.includes(phrase), false, `seed.ts still contains ${phrase}`);
      assert.equal(init.includes(phrase), false, `workspace.ts still contains ${phrase}`);
    }
    assert.match(init, /initialHistory/);
  });
});
