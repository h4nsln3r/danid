import { SKILL_CATALOG } from "@/domain/catalog";
import type { Ability, Character, SkillId } from "@/domain/schema";
import { abilityModifier, proficiencyBonus } from "@/domain/rules/abilities";

export function skillModifier(character: Character, skill: SkillId): number {
  const ability = SKILL_CATALOG[skill].ability;
  const base = abilityModifier(character.abilityScores[ability]);
  const trained = character.skillProficiencies.includes(skill);
  return base + (trained ? proficiencyBonus(character.level) : 0);
}

export function savingThrowModifier(
  character: Character,
  ability: Ability,
): number {
  const base = abilityModifier(character.abilityScores[ability]);
  const trained = character.savingThrowProficiencies.includes(ability);
  return base + (trained ? proficiencyBonus(character.level) : 0);
}

export function passiveScore(character: Character, skill: SkillId): number {
  return 10 + skillModifier(character, skill);
}
