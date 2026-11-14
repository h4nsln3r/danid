import { describe, expect, it } from "vitest";
import { getCharacter } from "@/domain/characters";
import { characterSchema } from "@/domain/schema";
import { arrowCount, withArrowCount, withHitPoints } from "@/domain/rules/play";

function mira() {
  const character = getCharacter("mira-thorn");
  if (!character) {
    throw new Error("Sample character is missing.");
  }
  return structuredClone(character);
}

describe("play totals", () => {
  it("keeps current hit points between zero and the maximum", () => {
    const character = mira();
    expect(withHitPoints(character, 12).currentHitPoints).toBe(12);
    expect(withHitPoints(character, -4).currentHitPoints).toBe(0);
    expect(withHitPoints(character, 80).currentHitPoints).toBe(character.maxHitPoints);
  });

  it("changes an arrow stack and removes it at zero", () => {
    const character = mira();
    expect(arrowCount(character)).toBe(20);
    const fewer = withArrowCount(character, 19);
    expect(arrowCount(fewer)).toBe(19);
    expect(characterSchema.parse(fewer).items.find((item) => item.id === "arrows")?.quantity).toBe(19);
    const none = withArrowCount(fewer, 0);
    expect(arrowCount(none)).toBe(0);
    expect(none.items.some((item) => item.id === "arrows")).toBe(false);
    expect(characterSchema.parse(none)).toBeTruthy();
  });

  it("adds a Player's Handbook arrow stack when the character has none", () => {
    const character = mira();
    const without = withArrowCount(character, 0);
    const restocked = withArrowCount(without, 8);
    const arrows = restocked.items.find((item) => item.id === "arrows");
    expect(arrows).toMatchObject({
      name: "Arrows",
      kind: "ammunition",
      quantity: 8,
      weightLbEach: 0.05,
      source: "PHB 2014",
    });
    expect(characterSchema.parse(restocked)).toBeTruthy();
  });
});
