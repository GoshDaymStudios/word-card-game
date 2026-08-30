import { describe, expect, it } from "vitest";
import { createRun } from "./gameEngine";
import { migrateRun } from "./persistence";

describe("migrateRun", () => {
  it("accepts a current-version run (JSON roundtrip)", () => {
    const run = createRun("SEED", 1);
    const back = migrateRun(JSON.parse(JSON.stringify(run)));
    expect(back).toEqual(run);
  });

  it("discards junk and unknown versions", () => {
    expect(migrateRun(null)).toBeNull();
    expect(migrateRun("garbage")).toBeNull();
    expect(migrateRun({})).toBeNull();
    expect(migrateRun({ version: 1, seed: 42 })).toBeNull();
    expect(migrateRun({ version: 99 })).toBeNull();
  });
});
