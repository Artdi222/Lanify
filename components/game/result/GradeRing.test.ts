import { describe, expect, test } from "bun:test";
import { ringFill } from "./GradeRing";

describe("ringFill", () => {
  test("only SS closes the ring", () => {
    expect(ringFill(1)).toBe(1);
    expect(ringFill(0.9982)).toBeLessThan(0.976);
    expect(ringFill(0.9982)).toBeGreaterThan(0.97);
  });
  test("linear below S, monotonic across the squeeze", () => {
    expect(ringFill(0.8)).toBe(0.8);
    expect(ringFill(0.95)).toBe(0.95);
    expect(ringFill(0.97)).toBeLessThan(ringFill(0.99));
  });
});
