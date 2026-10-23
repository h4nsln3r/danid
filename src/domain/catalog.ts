import type {
  Ability,
  Character,
  EquipmentSlotId,
  SkillId,
  WeaponProperty,
} from "@/domain/schema";

export const RULESET_LABELS = {
  "2014-phb": "D&D 5th Edition, 2014 Player's Handbook",
} as const satisfies Record<Character["ruleset"], string>;

export const ABILITY_LABELS = {
  strength: "Strength",
  dexterity: "Dexterity",
  constitution: "Constitution",
  intelligence: "Intelligence",
  wisdom: "Wisdom",
  charisma: "Charisma",
} as const satisfies Record<Ability, string>;

export const ABILITY_SHORT = {
  strength: "STR",
  dexterity: "DEX",
  constitution: "CON",
  intelligence: "INT",
  wisdom: "WIS",
  charisma: "CHA",
} as const satisfies Record<Ability, string>;

export const SKILL_CATALOG = {
  acrobatics: { label: "Acrobatics", ability: "dexterity" },
  "animal-handling": { label: "Animal Handling", ability: "wisdom" },
  arcana: { label: "Arcana", ability: "intelligence" },
  athletics: { label: "Athletics", ability: "strength" },
  deception: { label: "Deception", ability: "charisma" },
  history: { label: "History", ability: "intelligence" },
  insight: { label: "Insight", ability: "wisdom" },
  intimidation: { label: "Intimidation", ability: "charisma" },
  investigation: { label: "Investigation", ability: "intelligence" },
  medicine: { label: "Medicine", ability: "wisdom" },
  nature: { label: "Nature", ability: "intelligence" },
  perception: { label: "Perception", ability: "wisdom" },
  performance: { label: "Performance", ability: "charisma" },
  persuasion: { label: "Persuasion", ability: "charisma" },
  religion: { label: "Religion", ability: "intelligence" },
  "sleight-of-hand": { label: "Sleight of Hand", ability: "dexterity" },
  stealth: { label: "Stealth", ability: "dexterity" },
  survival: { label: "Survival", ability: "wisdom" },
} as const satisfies Record<SkillId, { label: string; ability: Ability }>;

export const SLOT_LABELS = {
  head: "Head",
  cloak: "Cloak",
  amulet: "Amulet",
  armor: "Armor",
  gloves: "Gloves",
  bracers: "Bracers",
  belt: "Belt",
  boots: "Boots",
  ring1: "Ring 1",
  ring2: "Ring 2",
  mainHand: "Main hand",
  offHand: "Off hand",
  ranged: "Ranged",
} as const satisfies Record<EquipmentSlotId, string>;

export const PROPERTY_LABELS = {
  ammunition: "Ammunition",
  finesse: "Finesse",
  heavy: "Heavy",
  light: "Light",
  loading: "Loading",
  reach: "Reach",
  thrown: "Thrown",
  "two-handed": "Two-handed",
  versatile: "Versatile",
} as const satisfies Record<WeaponProperty, string>;

export const SOURCE_LABELS = {
  "PHB 2014": "Player's Handbook (2014)",
  mundane: "Mundane gear",
} as const;

export const FIGHTING_STYLE_LABELS = {
  archery: "Archery",
  defense: "Defense",
  dueling: "Dueling",
  "two-weapon-fighting": "Two-weapon fighting",
} as const;
