import { describe, expect, it } from "vitest";
import { getCharacter } from "@/domain/characters";
import type { SkillId } from "@/domain/schema";
import { SKILL_IDS } from "@/domain/schema";
import { abilityModifier, proficiencyBonus } from "@/domain/rules/abilities";
import { averageHitPoints } from "@/domain/rules/hit-points";
import {
  passiveScore,
  savingThrowModifier,
  skillModifier,
} from "@/domain/rules/skills";

describe("ability modifiers", () => {
  it("follows the 2014 floor formula", () => {
    expect(abilityModifier(1)).toBe(-5);
    expect(abilityModifier(9)).toBe(-1);
    expect(abilityModifier(10)).toBe(0);
    expect(abilityModifier(11)).toBe(0);
    expect(abilityModifier(12)).toBe(1);
    expect(abilityModifier(19)).toBe(4);
    expect(abilityModifier(30)).toBe(10);
  });

  it("rejects scores outside 1–30", () => {
    expect(() => abilityModifier(0)).toThrow(/outside 1–30/);
    expect(() => abilityModifier(31)).toThrow(/outside 1–30/);
    expect(() => abilityModifier(10.5)).toThrow(/outside 1–30/);
  });
});

describe("proficiency bonus", () => {
  it("steps up every four levels", () => {
    expect(proficiencyBonus(1)).toBe(2);
    expect(proficiencyBonus(4)).toBe(2);
    expect(proficiencyBonus(5)).toBe(3);
    expect(proficiencyBonus(8)).toBe(3);
    expect(proficiencyBonus(9)).toBe(4);
    expect(proficiencyBonus(12)).toBe(4);
    expect(proficiencyBonus(13)).toBe(5);
    expect(proficiencyBonus(16)).toBe(5);
    expect(proficiencyBonus(17)).toBe(6);
    expect(proficiencyBonus(20)).toBe(6);
  });

  it("rejects levels outside 1–20", () => {
    expect(() => proficiencyBonus(0)).toThrow(/outside 1–20/);
    expect(() => proficiencyBonus(21)).toThrow(/outside 1–20/);
  });
});

describe("average hit points", () => {
  it("uses a d10 average of 6 after 1st level", () => {
    expect(averageHitPoints(5, 10, 1)).toBe(39);
  });

  it("grants at least 1 hit point per level", () => {
    expect(averageHitPoints(1, 10, -5)).toBe(5);
    expect(averageHitPoints(2, 10, -5)).toBe(6);
  });
});

describe("Mira Thorn's skills and saves", () => {
  const mira = getCharacter("mira-thorn");
  if (!mira) {
    throw new Error("Sample character is missing.");
  }

  const expectedSkills: Record<SkillId, number> = {
    acrobatics: 4,
    "animal-handling": 5,
    arcana: 0,
    athletics: 4,
    deception: -1,
    history: 0,
    insight: 2,
    intimidation: -1,
    investigation: 0,
    medicine: 2,
    nature: 3,
    perception: 5,
    performance: -1,
    persuasion: -1,
    religion: 0,
    "sleight-of-hand": 4,
    stealth: 7,
    survival: 5,
  };

  it("matches the trained and untrained modifiers", () => {
    for (const skill of SKILL_IDS) {
      expect(skillModifier(mira, skill), skill).toBe(expectedSkills[skill]);
    }
  });

  it("uses Strength and Dexterity for proficient saves", () => {
    expect(savingThrowModifier(mira, "strength")).toBe(4);
    expect(savingThrowModifier(mira, "dexterity")).toBe(7);
    expect(savingThrowModifier(mira, "wisdom")).toBe(2);
    expect(passiveScore(mira, "perception")).toBe(15);
  });
});
