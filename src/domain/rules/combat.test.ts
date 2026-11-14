import { describe, expect, it } from "vitest";
import { getCharacter } from "@/domain/characters";
import type { Character, InventoryItem } from "@/domain/schema";
import {
  armorClass,
  attackLines,
  initiativeBonus,
  speed,
  spellAttackBonus,
  spellSaveDc,
  TWO_HANDED_SHIELD_REASON,
} from "@/domain/rules/combat";
import { equipItem, stowItem } from "@/domain/rules/equipment";

function mira(): Character {
  const character = getCharacter("mira-thorn");
  if (!character) {
    throw new Error("Sample character is missing.");
  }
  return character;
}

describe("Mira Thorn's combat stats", () => {
  it("uses 2014 light armor with the full Dexterity bonus", () => {
    const sheet = mira();
    const ac = armorClass(sheet);
    expect(ac.total).toBe(16);
    expect(ac.parts.join(" + ")).toBe("Studded leather 12 + Dexterity +4");
    expect(ac.warnings).toEqual([]);
    expect(initiativeBonus(sheet)).toBe(4);
    expect(speed(sheet)).toEqual({ feet: 35 });
    expect(spellSaveDc(sheet)).toBe(13);
    expect(spellAttackBonus(sheet)).toBe(5);
  });

  it("adds Archery only to the longbow", () => {
    const lines = attackLines(mira());
    const longbow = lines.find((line) => line.itemId === "longbow");
    const shortsword = lines.find((line) => line.itemId === "shortsword");
    expect(longbow).toMatchObject({
      attackBonus: 9,
      damage: "1d8+4 piercing",
      available: true,
      kind: "ranged",
    });
    expect(longbow?.notes).toContain("Archery +2.");
    expect(shortsword).toMatchObject({
      attackBonus: 7,
      damage: "1d6+4 piercing",
      available: true,
      kind: "melee",
    });
    expect(shortsword?.notes.some((note) => note.includes("Archery"))).toBe(false);
  });
});

describe("shields and armor categories", () => {
  it("adds 2 armor class and blocks a two-handed bow", () => {
    const equipped = equipItem(mira(), "shield", "offHand");
    expect(equipped.ok).toBe(true);
    if (!equipped.ok) {
      return;
    }
    expect(armorClass(equipped.character).total).toBe(18);
    const longbow = attackLines(equipped.character).find(
      (line) => line.itemId === "longbow",
    );
    const shortsword = attackLines(equipped.character).find(
      (line) => line.itemId === "shortsword",
    );
    expect(longbow?.available).toBe(false);
    expect(longbow?.unavailableReason).toBe(TWO_HANDED_SHIELD_REASON);
    expect(shortsword?.available).toBe(true);
    expect(shortsword?.attackBonus).toBe(7);
  });

  it("falls back to 10 + Dexterity when body armor is stowed", () => {
    const stowed = stowItem(mira(), "armor");
    expect(stowed.ok).toBe(true);
    if (!stowed.ok) {
      return;
    }
    expect(armorClass(stowed.character).total).toBe(14);
  });

  it("caps Dexterity at +2 for 2014 medium armor", () => {
    const hide: InventoryItem = {
      id: "hide",
      name: "Hide armor",
      kind: "armor",
      slots: ["armor"],
      quantity: 1,
      weightLbEach: 12,
      description: "A medium armor fixture.",
      source: "PHB 2014",
      armor: {
        category: "medium",
        baseAc: 12,
        maxDexBonus: 2,
        stealthDisadvantage: true,
      },
    };
    const sheet = withItem(mira(), hide, "armor");
    const ac = armorClass(sheet);
    expect(ac.total).toBe(14);
    expect(ac.warnings).toContain(
      "You have disadvantage on Dexterity (Stealth) checks.",
    );
  });

  it("applies the 2014 heavy armor strength penalty and proficiency warning", () => {
    const chain: InventoryItem = {
      id: "chain-mail",
      name: "Chain mail",
      kind: "armor",
      slots: ["armor"],
      quantity: 1,
      weightLbEach: 55,
      description: "A heavy armor fixture.",
      source: "PHB 2014",
      armor: {
        category: "heavy",
        baseAc: 16,
        strengthRequirement: 13,
        stealthDisadvantage: true,
      },
    };
    const sheet = withItem(mira(), chain, "armor");
    expect(armorClass(sheet).total).toBe(16);
    expect(speed(sheet)).toEqual({
      feet: 25,
      note: "Your Strength is below 13, so this armor reduces your speed by 10 feet.",
    });
    expect(armorClass(sheet).warnings[0]).toMatch(/lack proficiency with heavy armor/);
  });
});

describe("fighting styles", () => {
  it("adds Defense only while body armor is worn", () => {
    const armored: Character = { ...mira(), fightingStyles: ["defense"] };
    expect(armorClass(armored).total).toBe(17);
    const stowed = stowItem(armored, "armor");
    expect(stowed.ok).toBe(true);
    if (!stowed.ok) {
      return;
    }
    expect(armorClass(stowed.character).total).toBe(14);
  });

  it("adds Dueling damage only with one melee weapon in hand", () => {
    const duelist: Character = { ...mira(), fightingStyles: ["dueling"] };
    const sword = attackLines(duelist).find((line) => line.itemId === "shortsword");
    expect(sword?.damage).toBe("1d6+6 piercing");
    const bow = attackLines(duelist).find((line) => line.itemId === "longbow");
    expect(bow?.attackBonus).toBe(7);

    const withDagger = equipItem(duelist, "dagger", "offHand");
    expect(withDagger.ok).toBe(true);
    if (!withDagger.ok) {
      return;
    }
    const paired = attackLines(withDagger.character).find(
      (line) => line.itemId === "shortsword",
    );
    expect(paired?.damage).toBe("1d6+4 piercing");
  });
});

function withItem(
  character: Character,
  item: InventoryItem,
  slot: "armor",
): Character {
  return {
    ...character,
    items: [...character.items, item],
    equipped: { ...character.equipped, [slot]: item.id },
  };
}
