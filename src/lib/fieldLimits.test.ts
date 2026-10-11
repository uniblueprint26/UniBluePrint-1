import { describe, it, expect } from "vitest";
import { LIMITS, checkLengths } from "./fieldLimits";

describe("checkLengths", () => {
  it("returns empty string when all fields are within their limits", () => {
    expect(
      checkLengths([
        ["Name", "Jane Doe", LIMITS.SHORT],
        ["Bio", "A short bio.", LIMITS.LONG],
      ])
    ).toBe("");
  });

  it("flags the first field that exceeds its limit, naming it and the counts", () => {
    const value = "a".repeat(LIMITS.SHORT + 1);
    const message = checkLengths([["Name", value, LIMITS.SHORT]]);
    expect(message).toContain("Name");
    expect(message).toContain("too long");
    expect(message).toContain(LIMITS.SHORT.toLocaleString());
  });

  it("ignores non-string values instead of throwing", () => {
    expect(checkLengths([["Count", 42, LIMITS.SHORT]])).toBe("");
    expect(checkLengths([["Missing", undefined, LIMITS.SHORT]])).toBe("");
  });
});
