import type { Ability, ArmorCategory, WeaponProfile } from "@/domain/schema";

export interface ClassProfile {
  id: string;
  hitDie: 6 | 8 | 10 | 12;
  saves: Ability[];
  armor: ArmorCategory[];
  weapons: Array<"simple" | "martial">;
  /** Shown when the simple/martial flag is wider or narrower than the class list. */
  weaponNote?: string;
}

const CLASSES: ClassProfile[] = [
  {
    id: "barbarian",
    hitDie: 12,
    saves: ["strength", "constitution"],
    armor: ["light", "medium", "shield"],
    weapons: ["simple", "martial"],
  },
  {
    id: "bard",
    hitDie: 8,
    saves: ["dexterity", "charisma"],
    armor: ["light"],
    weapons: ["simple"],
    weaponNote:
      "Barden kan också handarmborst, långsvärd, värja och kortsvärd. Det är inte samma sak som träning i alla krigsvapen.",
  },
  {
    id: "cleric",
    hitDie: 8,
    saves: ["wisdom", "charisma"],
    armor: ["light", "medium", "shield"],
    weapons: ["simple"],
  },
  {
    id: "druid",
    hitDie: 8,
    saves: ["intelligence", "wisdom"],
    armor: ["light", "medium", "shield"],
    weapons: ["simple"],
    weaponNote:
      "Druidens vapenlista är smalare än alla enkla vapen: klubba, dolk, pil, spjut, slunga, skära, lie, stav och sabel. Träffbonusen kan därför vara för hög för ett annat enkelt vapen.",
  },
  {
    id: "fighter",
    hitDie: 10,
    saves: ["strength", "constitution"],
    armor: ["light", "medium", "heavy", "shield"],
    weapons: ["simple", "martial"],
  },
  {
    id: "monk",
    hitDie: 8,
    saves: ["strength", "dexterity"],
    armor: [],
    weapons: ["simple"],
    weaponNote: "Munken kan också kortsvärd, utöver enkla vapen.",
  },
  {
    id: "paladin",
    hitDie: 10,
    saves: ["wisdom", "charisma"],
    armor: ["light", "medium", "heavy", "shield"],
    weapons: ["simple", "martial"],
  },
  {
    id: "ranger",
    hitDie: 10,
    saves: ["strength", "dexterity"],
    armor: ["light", "medium", "shield"],
    weapons: ["simple", "martial"],
  },
  {
    id: "rogue",
    hitDie: 8,
    saves: ["dexterity", "intelligence"],
    armor: ["light"],
    weapons: ["simple"],
    weaponNote:
      "Tjuven kan också handarmborst, långsvärd, värja och kortsvärd. Det är inte samma sak som träning i alla krigsvapen.",
  },
  {
    id: "sorcerer",
    hitDie: 6,
    saves: ["constitution", "charisma"],
    armor: [],
    weapons: ["simple"],
    weaponNote:
      "Trollkarlens vapen är dolk, pil, slunga, stav och lätt armborst. Markeringen för enkla vapen är bredare än den listan.",
  },
  {
    id: "warlock",
    hitDie: 8,
    saves: ["wisdom", "charisma"],
    armor: ["light"],
    weapons: ["simple"],
  },
  {
    id: "wizard",
    hitDie: 6,
    saves: ["intelligence", "wisdom"],
    armor: [],
    weapons: ["simple"],
    weaponNote:
      "Magikerns vapen är dolk, pil, slunga, stav och lätt armborst. Markeringen för enkla vapen är bredare än den listan.",
  },
];

const CLASS_ALIASES: Record<string, string> = {
  barbarian: "barbarian",
  barbar: "barbarian",
  bard: "bard",
  cleric: "cleric",
  prast: "cleric",
  druid: "druid",
  fighter: "fighter",
  krigare: "fighter",
  monk: "monk",
  munk: "monk",
  paladin: "paladin",
  ranger: "ranger",
  rogue: "rogue",
  tjuv: "rogue",
  sorcerer: "sorcerer",
  trollkarl: "sorcerer",
  warlock: "warlock",
  haxmastare: "warlock",
  wizard: "wizard",
  magiker: "wizard",
};

export interface KnownWeapon {
  aliases: string[];
  slots: Array<"mainHand" | "offHand" | "ranged">;
  weapon: WeaponProfile;
  weightLbEach?: number;
}

export interface KnownArmor {
  aliases: string[];
  kind: "armor" | "shield";
  armor: {
    category: ArmorCategory;
    baseAc: number;
    maxDexBonus?: number;
    strengthRequirement?: number;
    stealthDisadvantage?: boolean;
  };
  weightLbEach?: number;
}

const WEAPONS: KnownWeapon[] = [
  weapon(["club", "klubba"], ["mainHand", "offHand"], {
    category: "simple",
    damageDice: "1d4",
    damageType: "bludgeoning",
    properties: ["light"],
  }, 2),
  weapon(["dagger", "dolk"], ["mainHand", "offHand"], {
    category: "simple",
    damageDice: "1d4",
    damageType: "piercing",
    properties: ["finesse", "light", "thrown"],
    range: { normal: 20, long: 60 },
  }, 1),
  weapon(["handaxe", "handyxa"], ["mainHand", "offHand"], {
    category: "simple",
    damageDice: "1d6",
    damageType: "slashing",
    properties: ["light", "thrown"],
    range: { normal: 20, long: 60 },
  }, 2),
  weapon(["javelin", "kastspjut"], ["mainHand", "offHand"], {
    category: "simple",
    damageDice: "1d6",
    damageType: "piercing",
    properties: ["thrown"],
    range: { normal: 30, long: 120 },
  }, 2),
  weapon(["mace", "spikklubba"], ["mainHand", "offHand"], {
    category: "simple",
    damageDice: "1d6",
    damageType: "bludgeoning",
    properties: [],
  }, 4),
  weapon(["quarterstaff", "stav"], ["mainHand"], {
    category: "simple",
    damageDice: "1d6",
    damageType: "bludgeoning",
    properties: ["versatile"],
    versatileDice: "1d8",
  }, 4),
  weapon(["spear", "spjut"], ["mainHand", "offHand"], {
    category: "simple",
    damageDice: "1d6",
    damageType: "piercing",
    properties: ["thrown", "versatile"],
    range: { normal: 20, long: 60 },
    versatileDice: "1d8",
  }, 3),
  weapon(["light crossbow", "latt armborst"], ["ranged"], {
    category: "simple",
    damageDice: "1d8",
    damageType: "piercing",
    properties: ["ammunition", "loading", "two-handed"],
    range: { normal: 80, long: 320 },
  }, 5),
  weapon(["shortbow", "kortbage"], ["ranged"], {
    category: "simple",
    damageDice: "1d6",
    damageType: "piercing",
    properties: ["ammunition", "two-handed"],
    range: { normal: 80, long: 320 },
  }, 2),
  weapon(["sling", "slunga"], ["ranged"], {
    category: "simple",
    damageDice: "1d4",
    damageType: "bludgeoning",
    properties: ["ammunition"],
    range: { normal: 30, long: 120 },
  }),
  weapon(["battleaxe", "stridsyxa"], ["mainHand"], {
    category: "martial",
    damageDice: "1d8",
    damageType: "slashing",
    properties: ["versatile"],
    versatileDice: "1d10",
  }, 4),
  weapon(["greataxe", "stor yxa", "tveyxa"], ["mainHand"], {
    category: "martial",
    damageDice: "1d12",
    damageType: "slashing",
    properties: ["heavy", "two-handed"],
  }, 7),
  weapon(["greatsword", "storsvard"], ["mainHand"], {
    category: "martial",
    damageDice: "2d6",
    damageType: "slashing",
    properties: ["heavy", "two-handed"],
  }, 6),
  weapon(["longsword", "langsvard"], ["mainHand", "offHand"], {
    category: "martial",
    damageDice: "1d8",
    damageType: "slashing",
    properties: ["versatile"],
    versatileDice: "1d10",
  }, 3),
  weapon(["rapier", "varja"], ["mainHand", "offHand"], {
    category: "martial",
    damageDice: "1d8",
    damageType: "piercing",
    properties: ["finesse"],
  }, 2),
  weapon(["scimitar", "sabel"], ["mainHand", "offHand"], {
    category: "martial",
    damageDice: "1d6",
    damageType: "slashing",
    properties: ["finesse", "light"],
  }, 3),
  weapon(["shortsword", "kortsvard"], ["mainHand", "offHand"], {
    category: "martial",
    damageDice: "1d6",
    damageType: "piercing",
    properties: ["finesse", "light"],
  }, 2),
  weapon(["warhammer", "stridshammare"], ["mainHand"], {
    category: "martial",
    damageDice: "1d8",
    damageType: "bludgeoning",
    properties: ["versatile"],
    versatileDice: "1d10",
  }, 2),
  weapon(["hand crossbow", "handarmborst"], ["ranged"], {
    category: "martial",
    damageDice: "1d6",
    damageType: "piercing",
    properties: ["ammunition", "light", "loading"],
    range: { normal: 30, long: 120 },
  }, 3),
  weapon(["heavy crossbow", "tungt armborst"], ["ranged"], {
    category: "martial",
    damageDice: "1d10",
    damageType: "piercing",
    properties: ["ammunition", "heavy", "loading", "two-handed"],
    range: { normal: 100, long: 400 },
  }, 18),
  weapon(["longbow", "langbage"], ["ranged"], {
    category: "martial",
    damageDice: "1d8",
    damageType: "piercing",
    properties: ["ammunition", "heavy", "two-handed"],
    range: { normal: 150, long: 600 },
  }, 2),
];

const ARMOR: KnownArmor[] = [
  armor(["padded", "vadderad"], "armor", { category: "light", baseAc: 11, stealthDisadvantage: true }, 8),
  armor(["leather", "lader", "laderrustning"], "armor", { category: "light", baseAc: 11 }, 10),
  armor(["studded leather", "nitad lader", "nitad laderrustning"], "armor", { category: "light", baseAc: 12 }, 13),
  armor(["hide", "hudar"], "armor", { category: "medium", baseAc: 12, maxDexBonus: 2 }, 12),
  armor(["chain shirt", "ringbrynjeskjorta"], "armor", { category: "medium", baseAc: 13, maxDexBonus: 2 }, 20),
  armor(["scale mail", "fjallrustning"], "armor", { category: "medium", baseAc: 14, maxDexBonus: 2, stealthDisadvantage: true }, 45),
  armor(["breastplate", "brostplat"], "armor", { category: "medium", baseAc: 14, maxDexBonus: 2 }, 20),
  armor(["half plate", "halvplat"], "armor", { category: "medium", baseAc: 15, maxDexBonus: 2, stealthDisadvantage: true }, 40),
  armor(["ring mail", "ringpansar"], "armor", { category: "heavy", baseAc: 14, stealthDisadvantage: true }, 40),
  armor(["chain mail", "ringbrynja"], "armor", { category: "heavy", baseAc: 16, strengthRequirement: 13, stealthDisadvantage: true }, 55),
  armor(["splint", "skenrustning"], "armor", { category: "heavy", baseAc: 17, strengthRequirement: 15, stealthDisadvantage: true }, 60),
  armor(["plate", "plat", "platrustning"], "armor", { category: "heavy", baseAc: 18, strengthRequirement: 15, stealthDisadvantage: true }, 65),
  armor(["shield", "skold"], "shield", { category: "shield", baseAc: 2 }, 6),
];

function weapon(
  aliases: string[],
  slots: KnownWeapon["slots"],
  profile: WeaponProfile,
  weightLbEach?: number,
): KnownWeapon {
  return { aliases, slots, weapon: profile, weightLbEach };
}

function armor(
  aliases: string[],
  kind: KnownArmor["kind"],
  profile: KnownArmor["armor"],
  weightLbEach?: number,
): KnownArmor {
  return { aliases, kind, armor: profile, weightLbEach };
}

export function matchKey(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function findClass(name: string): ClassProfile | undefined {
  const id = CLASS_ALIASES[matchKey(name).replace(/ /g, "")];
  return CLASSES.find((entry) => entry.id === id);
}

export function findWeapon(name: string): KnownWeapon | undefined {
  const key = matchKey(name);
  return WEAPONS.find((entry) => entry.aliases.some((alias) => matchKey(alias) === key));
}

export function findArmor(name: string): KnownArmor | undefined {
  const key = matchKey(name);
  return ARMOR.find((entry) => entry.aliases.some((alias) => matchKey(alias) === key));
}

export function isShieldName(name: string): boolean {
  const found = findArmor(name);
  return found?.kind === "shield";
}
