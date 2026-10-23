import { describe, expect, it } from "vitest";
import { getCharacter } from "@/domain/characters";
import type { Character } from "@/domain/schema";
import {
  carryingCapacity,
  carriedItems,
  equipItem,
  itemsForSlot,
  stowItem,
  totalWeightLb,
} from "@/domain/rules/equipment";

function mira(): Character {
  const character = getCharacter("mira-thorn");
  if (!character) {
    throw new Error("Sample character is missing.");
  }
  return character;
}

describe("equipment changes", () => {
  it("weighs the sample kit at 110.2 pounds against a 180 pound capacity", () => {
    const sheet = mira();
    expect(totalWeightLb(sheet)).toBe(110.2);
    expect(carryingCapacity(sheet)).toBe(180);
  });

  it("moves a worn weapon and stows whatever was in the destination", () => {
    const moved = equipItem(mira(), "shortsword", "offHand");
    expect(moved.ok).toBe(true);
    if (!moved.ok) {
      return;
    }
    expect(moved.character.equipped.mainHand).toBeUndefined();
    expect(moved.character.equipped.offHand).toBe("shortsword");

    const swapped = equipItem(moved.character, "dagger", "offHand");
    expect(swapped.ok).toBe(true);
    if (!swapped.ok) {
      return;
    }
    expect(swapped.displacedItemId).toBe("shortsword");
    expect(swapped.character.equipped.offHand).toBe("dagger");
    expect(carriedItems(swapped.character).some((item) => item.id === "shortsword")).toBe(
      true,
    );
  });

  it("rejects a slot the item cannot use", () => {
    const result = equipItem(mira(), "longbow", "mainHand");
    expect(result).toEqual({
      ok: false,
      reason: "Longbow does not fit the main hand slot.",
    });
  });

  it("stows a worn item and refuses an empty slot", () => {
    const stowed = stowItem(mira(), "ranged");
    expect(stowed.ok).toBe(true);
    if (!stowed.ok) {
      return;
    }
    expect(stowed.character.equipped.ranged).toBeUndefined();
    expect(carriedItems(stowed.character).some((item) => item.id === "longbow")).toBe(
      true,
    );
    expect(stowItem(stowed.character, "head")).toEqual({
      ok: false,
      reason: "The head slot is already empty.",
    });
  });

  it("offers the shield for an empty off hand", () => {
    const choices = itemsForSlot(mira(), "offHand").map((item) => item.id);
    expect(choices).toContain("shield");
    expect(choices).toContain("dagger");
    expect(choices).not.toContain("longbow");
  });
});
