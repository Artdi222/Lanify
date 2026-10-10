import { describe, expect, test } from "bun:test";
import { COUNTRIES, countryName } from "./country";

describe("country", () => {
  test("name", () => {
    expect(countryName("id")).toBe("Indonesia");
  });
  test("every listed code resolves to a real name", () => {
    expect(COUNTRIES.length).toBeGreaterThan(200);
    expect(COUNTRIES.every((c) => c.name !== c.code)).toBe(true);
  });
});
