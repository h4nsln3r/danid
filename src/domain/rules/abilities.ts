import type { Ability } from "@/domain/schema";

export function abilityModifier(score: number): number {
  if (!Number.isInteger(score) || score < 1 || score > 30) {
    throw new Error(`Ability score ${score} is outside 1–30.`);
  }
  return Math.floor((score - 10) / 2);
}

export function proficiencyBonus(level: number): number {
  if (!Number.isInteger(level) || level < 1 || level > 20) {
    throw new Error(`Level ${level} is outside 1–20.`);
  }
  return Math.floor((level - 1) / 4) + 2;
}

export function abilityLabelOrder(): readonly Ability[] {
  return [
    "strength",
    "dexterity",
    "constitution",
    "intelligence",
    "wisdom",
    "charisma",
  ];
}
