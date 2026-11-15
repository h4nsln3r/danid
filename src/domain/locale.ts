import {
  ABILITY_LABELS,
  ABILITY_SHORT,
  PROPERTY_LABELS,
  RULESET_LABELS,
  SKILL_CATALOG,
  SLOT_LABELS,
  SOURCE_LABELS,
} from "@/domain/catalog";
import type { Ability, Character, EquipmentSlotId, SkillId, WeaponProperty } from "@/domain/schema";

export const LOCALES = ["en", "sv"] as const;
export type Locale = (typeof LOCALES)[number];

export function isLocale(value: string | undefined): value is Locale {
  return value === "en" || value === "sv";
}

const SV_ABILITIES: Record<Ability, string> = {
  strength: "Styrka",
  dexterity: "Rörlighet",
  constitution: "Fysik",
  intelligence: "Intelligens",
  wisdom: "Visdom",
  charisma: "Karisma",
};

const SV_ABILITY_SHORT: Record<Ability, string> = {
  strength: "STY",
  dexterity: "RÖR",
  constitution: "FYS",
  intelligence: "INT",
  wisdom: "VIS",
  charisma: "KAR",
};

const SV_SKILLS: Record<SkillId, string> = {
  acrobatics: "Akrobatik",
  "animal-handling": "Djurhantering",
  arcana: "Arkanakunskap",
  athletics: "Friidrott",
  deception: "Bluff",
  history: "Historia",
  insight: "Insikt",
  intimidation: "Hot",
  investigation: "Efterforskning",
  medicine: "Läkekonst",
  nature: "Naturkunskap",
  perception: "Uppfattningsförmåga",
  performance: "Uppträdande",
  persuasion: "Övertalning",
  religion: "Religion",
  "sleight-of-hand": "Fingerfärdighet",
  stealth: "Smyga",
  survival: "Överlevnad",
};

const SV_SLOTS: Record<EquipmentSlotId, string> = {
  head: "Huvud",
  cloak: "Mantel",
  amulet: "Amulett",
  armor: "Rustning",
  gloves: "Handskar",
  bracers: "Armskydd",
  belt: "Bälte",
  boots: "Stövlar",
  ring1: "Ring 1",
  ring2: "Ring 2",
  mainHand: "Primärhand",
  offHand: "Sekundärhand",
  ranged: "Avstånd",
};

const SV_PROPERTIES: Record<WeaponProperty, string> = {
  ammunition: "Ammunition",
  finesse: "Finesse",
  heavy: "Tung",
  light: "Lätt",
  loading: "Laddning",
  reach: "Räckvidd",
  thrown: "Kast",
  "two-handed": "Tvåhänt",
  versatile: "Mångsidig",
};

const SV_DAMAGE: Record<string, string> = {
  bludgeoning: "krossande",
  piercing: "stickande",
  slashing: "huggande",
};

const SV_SOURCES = {
  "PHB 2014": "Spelarens handbok (2014)",
  mundane: "Vardaglig utrustning",
} as const;

export function abilityName(locale: Locale, ability: Ability): string {
  return locale === "sv" ? SV_ABILITIES[ability] : ABILITY_LABELS[ability];
}

export function abilityShort(locale: Locale, ability: Ability): string {
  return locale === "sv" ? SV_ABILITY_SHORT[ability] : ABILITY_SHORT[ability];
}

export function skillName(locale: Locale, skill: SkillId): string {
  return locale === "sv" ? SV_SKILLS[skill] : SKILL_CATALOG[skill].label;
}

export function slotName(locale: Locale, slot: EquipmentSlotId): string {
  return locale === "sv" ? SV_SLOTS[slot] : SLOT_LABELS[slot];
}

export function propertyName(locale: Locale, property: WeaponProperty): string {
  return locale === "sv" ? SV_PROPERTIES[property] : PROPERTY_LABELS[property];
}

export function damageName(locale: Locale, damageType: string): string {
  if (locale === "sv" && SV_DAMAGE[damageType]) {
    return SV_DAMAGE[damageType];
  }
  return damageType;
}

export function sourceName(locale: Locale, source: keyof typeof SOURCE_LABELS): string {
  return locale === "sv" ? SV_SOURCES[source] : SOURCE_LABELS[source];
}

export function rulesetName(locale: Locale, ruleset: Character["ruleset"]): string {
  return locale === "sv"
    ? "D&D femte utgåvan, Spelarens handbok 2014"
    : RULESET_LABELS[ruleset];
}

export function armorTrainingName(locale: Locale, category: string): string {
  if (locale === "en") {
    return category === "shield" ? "shields" : `${category} armor`;
  }
  if (category === "light") {
    return "lätt rustning";
  }
  if (category === "medium") {
    return "medeltung rustning";
  }
  if (category === "heavy") {
    return "tung rustning";
  }
  return "sköldar";
}
