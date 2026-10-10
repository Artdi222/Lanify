import { describe, expect, test } from "bun:test";
import { COUNTRIES, countryName, flagEmoji } from "./country";

describe("country", () => {
  test("flag emoji and name", () => {
    expect(flagEmoji("id")).toBe("🇮🇩");
    expect(countryName("id")).toBe("Indonesia");
  });
  test("every listed code resolves to a real name", () => {
    expect(COUNTRIES.length).toBeGreaterThan(200);
    expect(COUNTRIES.every((c) => c.name !== c.code)).toBe(true);
  });
});
