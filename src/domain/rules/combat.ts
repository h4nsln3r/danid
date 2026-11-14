import { ABILITY_SHORT } from "@/domain/catalog";
import { formatDamage, formatModifier } from "@/domain/format";
import type {
  Ability,
  Character,
  EquipmentSlotId,
  WeaponProfile,
} from "@/domain/schema";
import { abilityModifier, proficiencyBonus } from "@/domain/rules/abilities";
import { equippedItem } from "@/domain/rules/equipment";

export const TWO_HANDED_SHIELD_REASON =
  "This weapon needs both hands, and a shield is worn.";

const ATTACK_SLOTS = ["mainHand", "offHand", "ranged"] as const satisfies readonly EquipmentSlotId[];

export interface AttackLine {
  itemId: string;
  name: string;
  slot: EquipmentSlotId;
  kind: "melee" | "ranged";
  attackBonus: number;
  damage: string;
  available: boolean;
  unavailableReason?: string;
  notes: string[];
}

export interface ArmorClassResult {
  total: number;
  parts: string[];
  warnings: string[];
}

export interface SpeedResult {
  feet: number;
  note?: string;
}

export function armorClass(character: Character): ArmorClassResult {
  const dex = abilityModifier(character.abilityScores.dexterity);
  const body = equippedItem(character, "armor");
  const offHand = equippedItem(character, "offHand");
  const warnings: string[] = [];
  let total = 10 + dex;
  let parts = ["10", `Dexterity ${formatModifier(dex)}`];
  let wearingBodyArmor = false;

  if (body?.armor && body.armor.category !== "shield") {
    wearingBodyArmor = true;
    const profile = body.armor;
    if (profile.category === "light") {
      total = profile.baseAc + dex;
      parts = [`${body.name} ${profile.baseAc}`, `Dexterity ${formatModifier(dex)}`];
    } else if (profile.category === "medium") {
      const cap = profile.maxDexBonus ?? 2;
      const bonus = Math.min(dex, cap);
      total = profile.baseAc + bonus;
      parts = [
        `${body.name} ${profile.baseAc}`,
        `Dexterity ${formatModifier(bonus)} (maximum ${formatModifier(cap)})`,
      ];
    } else {
      total = profile.baseAc;
      parts = [`${body.name} ${profile.baseAc}`];
    }

    if (!character.armorProficiencies.includes(profile.category)) {
      warnings.push(untrainedArmorWarning(`${profile.category} armor`));
    }
    if (profile.stealthDisadvantage) {
      warnings.push("You have disadvantage on Dexterity (Stealth) checks.");
    }
  }

  if (offHand?.armor?.category === "shield") {
    total += offHand.armor.baseAc;
    parts.push(`Shield +${offHand.armor.baseAc}`);
    if (!character.armorProficiencies.includes("shield")) {
      warnings.push(untrainedArmorWarning("shields"));
    }
  }

  if (character.fightingStyles.includes("defense") && wearingBodyArmor) {
    total += 1;
    parts.push("Defense +1");
  }

  return { total, parts, warnings };
}

export function speed(character: Character): SpeedResult {
  const armor = equippedItem(character, "armor")?.armor;
  const requirement = armor?.strengthRequirement;
  if (
    armor?.category === "heavy" &&
    requirement !== undefined &&
    character.abilityScores.strength < requirement
  ) {
    return {
      feet: character.speed - 10,
      note: `Your Strength is below ${requirement}, so this armor reduces your speed by 10 feet.`,
    };
  }
  return { feet: character.speed };
}

export function initiativeBonus(character: Character): number {
  return abilityModifier(character.abilityScores.dexterity);
}

export function spellSaveDc(character: Character): number | null {
  if (!character.spellcasting) {
    return null;
  }
  const modifier = abilityModifier(
    character.abilityScores[character.spellcasting.ability],
  );
  return 8 + proficiencyBonus(character.level) + modifier;
}

export function spellAttackBonus(character: Character): number | null {
  if (!character.spellcasting) {
    return null;
  }
  const modifier = abilityModifier(
    character.abilityScores[character.spellcasting.ability],
  );
  return proficiencyBonus(character.level) + modifier;
}

export function attackLines(character: Character): AttackLine[] {
  const shieldEquipped =
    equippedItem(character, "offHand")?.armor?.category === "shield";
  const proficiency = proficiencyBonus(character.level);
  const lines: AttackLine[] = [];

  for (const slot of ATTACK_SLOTS) {
    const item = equippedItem(character, slot);
    if (!item?.weapon) {
      continue;
    }
    lines.push(
      attackLine(character, item.id, item.name, slot, item.weapon, {
        shieldEquipped,
        proficiency,
      }),
    );
  }

  return lines;
}

export function combatNotes(character: Character): string[] {
  const notes: string[] = [];
  if (character.features.some((feature) => feature.id === "extra-attack")) {
    notes.push("Extra Attack: the Attack action includes two weapon attacks.");
  }
  if (character.features.some((feature) => feature.id === "colossus-slayer")) {
    notes.push(
      "Colossus Slayer: once each turn, a hit against an already injured creature deals an extra 1d8.",
    );
  }
  return notes;
}

function attackLine(
  character: Character,
  itemId: string,
  name: string,
  slot: EquipmentSlotId,
  weapon: WeaponProfile,
  context: { shieldEquipped: boolean; proficiency: number },
): AttackLine {
  const kind = weapon.properties.includes("ammunition") ? "ranged" : "melee";
  const ability = attackAbility(character, weapon, kind);
  const abilityMod = abilityModifier(character.abilityScores[ability]);
  const notes = [`${ABILITY_SHORT[ability]} ${formatModifier(abilityMod)}.`];
  let attack = abilityMod;

  if (character.weaponProficiencies.includes(weapon.category)) {
    attack += context.proficiency;
  } else {
    notes.push("Not proficient with this weapon.");
  }

  if (
    kind === "ranged" &&
    weapon.properties.includes("ammunition") &&
    character.fightingStyles.includes("archery")
  ) {
    attack += 2;
    notes.push("Archery +2.");
  }

  if (weapon.properties.includes("ammunition") && weapon.range) {
    notes.push(`Range ${weapon.range.normal}/${weapon.range.long} ft.`);
  }
  if (weapon.properties.includes("thrown") && weapon.range) {
    notes.push(`Thrown ${weapon.range.normal}/${weapon.range.long} ft.`);
  }

  let damageBonus = abilityMod;
  if (duelingApplies(character, slot, weapon, kind)) {
    damageBonus += 2;
    notes.push("Dueling +2 damage.");
  }

  const blocked = context.shieldEquipped && weapon.properties.includes("two-handed");
  return {
    itemId,
    name,
    slot,
    kind,
    attackBonus: attack,
    damage: formatDamage(weapon.damageDice, damageBonus, weapon.damageType),
    available: !blocked,
    unavailableReason: blocked ? TWO_HANDED_SHIELD_REASON : undefined,
    notes,
  };
}

function attackAbility(
  character: Character,
  weapon: WeaponProfile,
  kind: "melee" | "ranged",
): Ability {
  if (kind === "ranged") {
    return "dexterity";
  }
  if (weapon.properties.includes("finesse")) {
    const strength = abilityModifier(character.abilityScores.strength);
    const dexterity = abilityModifier(character.abilityScores.dexterity);
    return dexterity >= strength ? "dexterity" : "strength";
  }
  return "strength";
}

function duelingApplies(
  character: Character,
  slot: EquipmentSlotId,
  weapon: WeaponProfile,
  kind: "melee" | "ranged",
): boolean {
  if (!character.fightingStyles.includes("dueling") || kind !== "melee") {
    return false;
  }
  if (weapon.properties.includes("two-handed")) {
    return false;
  }
  const otherSlot = slot === "mainHand" ? "offHand" : "mainHand";
  return !equippedItem(character, otherSlot)?.weapon;
}

function untrainedArmorWarning(label: string): string {
  return `You lack proficiency with ${label}. You have disadvantage on any ability check, saving throw, or attack roll that involves Strength or Dexterity, and you can't cast spells.`;
}
