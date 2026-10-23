import { z } from "zod";

export const ABILITY_IDS = [
  "strength",
  "dexterity",
  "constitution",
  "intelligence",
  "wisdom",
  "charisma",
] as const;

export const SKILL_IDS = [
  "acrobatics",
  "animal-handling",
  "arcana",
  "athletics",
  "deception",
  "history",
  "insight",
  "intimidation",
  "investigation",
  "medicine",
  "nature",
  "perception",
  "performance",
  "persuasion",
  "religion",
  "sleight-of-hand",
  "stealth",
  "survival",
] as const;

export const EQUIPMENT_SLOT_IDS = [
  "head",
  "cloak",
  "amulet",
  "armor",
  "gloves",
  "bracers",
  "belt",
  "boots",
  "ring1",
  "ring2",
  "mainHand",
  "offHand",
  "ranged",
] as const;

export const WEAPON_PROPERTIES = [
  "ammunition",
  "finesse",
  "heavy",
  "light",
  "loading",
  "reach",
  "thrown",
  "two-handed",
  "versatile",
] as const;

export const DAMAGE_TYPES = ["bludgeoning", "piercing", "slashing"] as const;

export const ARMOR_CATEGORIES = ["light", "medium", "heavy", "shield"] as const;

export const FIGHTING_STYLES = [
  "archery",
  "defense",
  "dueling",
  "two-weapon-fighting",
] as const;

export const ITEM_KINDS = [
  "armor",
  "shield",
  "weapon",
  "gear",
  "ammunition",
  "currency",
] as const;

export const ITEM_SOURCES = ["PHB 2014", "mundane"] as const;

const diceSchema = z.string().regex(/^\d+d\d+$/);

export const abilitySchema = z.enum(ABILITY_IDS);
export const skillSchema = z.enum(SKILL_IDS);
export const equipmentSlotSchema = z.enum(EQUIPMENT_SLOT_IDS);
export const weaponPropertySchema = z.enum(WEAPON_PROPERTIES);
export const damageTypeSchema = z.enum(DAMAGE_TYPES);
export const armorCategorySchema = z.enum(ARMOR_CATEGORIES);
export const fightingStyleSchema = z.enum(FIGHTING_STYLES);

export const abilityScoresSchema = z.object({
  strength: z.number().int().min(1).max(30),
  dexterity: z.number().int().min(1).max(30),
  constitution: z.number().int().min(1).max(30),
  intelligence: z.number().int().min(1).max(30),
  wisdom: z.number().int().min(1).max(30),
  charisma: z.number().int().min(1).max(30),
});

export const weaponSchema = z.object({
  category: z.enum(["simple", "martial"]),
  damageDice: diceSchema,
  damageType: damageTypeSchema,
  properties: z.array(weaponPropertySchema),
  range: z
    .object({
      normal: z.number().int().positive(),
      long: z.number().int().positive(),
    })
    .optional(),
  versatileDice: diceSchema.optional(),
});

export const armorSchema = z.object({
  category: armorCategorySchema,
  baseAc: z.number().int().min(1).max(30),
  maxDexBonus: z.number().int().min(0).optional(),
  strengthRequirement: z.number().int().min(1).max(30).optional(),
  stealthDisadvantage: z.boolean().optional(),
});

export const itemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  kind: z.enum(ITEM_KINDS),
  slots: z.array(equipmentSlotSchema),
  quantity: z.number().int().positive(),
  weightLbEach: z.number().nonnegative().optional(),
  description: z.string().min(1),
  source: z.enum(ITEM_SOURCES),
  weapon: weaponSchema.optional(),
  armor: armorSchema.optional(),
});

export const featureSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  summary: z.string().min(1),
  source: z.string().min(1),
});

export const spellSchema = z.object({
  level: z.number().int().min(0).max(9),
  name: z.string().min(1),
  summary: z.string().min(1),
});

export const spellcastingSchema = z.object({
  ability: abilitySchema,
  slots: z.array(
    z.object({
      level: z.number().int().min(1).max(9),
      total: z.number().int().min(0),
    }),
  ),
  known: z.array(spellSchema),
});

export const equippedSchema = z.object({
  head: z.string().optional(),
  cloak: z.string().optional(),
  amulet: z.string().optional(),
  armor: z.string().optional(),
  gloves: z.string().optional(),
  bracers: z.string().optional(),
  belt: z.string().optional(),
  boots: z.string().optional(),
  ring1: z.string().optional(),
  ring2: z.string().optional(),
  mainHand: z.string().optional(),
  offHand: z.string().optional(),
  ranged: z.string().optional(),
});

export const characterSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    name: z.string().min(1),
    ancestry: z.string().min(1),
    className: z.string().min(1),
    subclass: z.string().min(1).optional(),
    level: z.number().int().min(1).max(20),
    background: z.string().min(1),
    alignment: z.string().min(1),
    experiencePoints: z.number().int().min(0),
    ruleset: z.literal("2014-phb"),
    languages: z.array(z.string().min(1)).min(1),
    toolProficiencies: z.array(z.string().min(1)),
    abilityScores: abilityScoresSchema,
    hitDie: z.number().int().min(4).max(12),
    maxHitPoints: z.number().int().positive(),
    currentHitPoints: z.number().int().min(0),
    temporaryHitPoints: z.number().int().min(0),
    speed: z.number().int().positive(),
    armorProficiencies: z.array(armorCategorySchema),
    weaponProficiencies: z.array(z.enum(["simple", "martial"])),
    savingThrowProficiencies: z.array(abilitySchema),
    skillProficiencies: z.array(skillSchema),
    fightingStyles: z.array(fightingStyleSchema),
    features: z.array(featureSchema),
    spellcasting: spellcastingSchema.nullable(),
    biography: z.string().min(1),
    buildNotes: z.array(z.string().min(1)),
    items: z.array(itemSchema).min(1),
    equipped: equippedSchema,
  })
  .superRefine((character, ctx) => {
    if (character.currentHitPoints > character.maxHitPoints) {
      ctx.addIssue({
        code: "custom",
        path: ["currentHitPoints"],
        message: "Current hit points cannot exceed the maximum.",
      });
    }

    if (!unique(character.skillProficiencies)) {
      ctx.addIssue({
        code: "custom",
        path: ["skillProficiencies"],
        message: "Skill proficiencies must be unique.",
      });
    }

    if (!unique(character.savingThrowProficiencies)) {
      ctx.addIssue({
        code: "custom",
        path: ["savingThrowProficiencies"],
        message: "Saving throw proficiencies must be unique.",
      });
    }

    const itemIds = new Set<string>();
    for (const [index, item] of character.items.entries()) {
      if (itemIds.has(item.id)) {
        ctx.addIssue({
          code: "custom",
          path: ["items", index, "id"],
          message: `Duplicate item id ${item.id}.`,
        });
      }
      itemIds.add(item.id);

      if (item.slots.length > 0 && item.quantity !== 1) {
        ctx.addIssue({
          code: "custom",
          path: ["items", index, "quantity"],
          message: "Worn items are single objects, not stacks.",
        });
      }

      if (item.kind === "weapon" && !item.weapon) {
        ctx.addIssue({
          code: "custom",
          path: ["items", index, "weapon"],
          message: "A weapon needs a weapon profile.",
        });
      }

      if (item.kind === "armor") {
        if (!item.armor || item.armor.category === "shield") {
          ctx.addIssue({
            code: "custom",
            path: ["items", index, "armor"],
            message: "Armor needs a light, medium, or heavy profile.",
          });
        }
      }

      if (item.kind === "shield") {
        if (item.armor?.category !== "shield") {
          ctx.addIssue({
            code: "custom",
            path: ["items", index, "armor"],
            message: "A shield needs a shield profile.",
          });
        }
        if (item.slots.some((slot) => slot !== "offHand")) {
          ctx.addIssue({
            code: "custom",
            path: ["items", index, "slots"],
            message: "A shield fits the off-hand slot only.",
          });
        }
      }
    }

    const wornIds = new Set<string>();
    for (const slot of EQUIPMENT_SLOT_IDS) {
      const itemId = character.equipped[slot];
      if (!itemId) {
        continue;
      }
      if (wornIds.has(itemId)) {
        ctx.addIssue({
          code: "custom",
          path: ["equipped", slot],
          message: `${itemId} is equipped in more than one slot.`,
        });
      }
      wornIds.add(itemId);
      const item = character.items.find((entry) => entry.id === itemId);
      if (!item) {
        ctx.addIssue({
          code: "custom",
          path: ["equipped", slot],
          message: `${itemId} is not on this character.`,
        });
        continue;
      }
      if (!item.slots.includes(slot)) {
        ctx.addIssue({
          code: "custom",
          path: ["equipped", slot],
          message: `${item.name} does not fit the ${slot} slot.`,
        });
      }
    }
  });

function unique<T>(values: readonly T[]): boolean {
  return new Set(values).size === values.length;
}

export type Ability = z.infer<typeof abilitySchema>;
export type SkillId = z.infer<typeof skillSchema>;
export type EquipmentSlotId = z.infer<typeof equipmentSlotSchema>;
export type WeaponProperty = z.infer<typeof weaponPropertySchema>;
export type DamageType = z.infer<typeof damageTypeSchema>;
export type ArmorCategory = z.infer<typeof armorCategorySchema>;
export type FightingStyle = z.infer<typeof fightingStyleSchema>;
export type WeaponProfile = z.infer<typeof weaponSchema>;
export type ArmorProfile = z.infer<typeof armorSchema>;
export type InventoryItem = z.infer<typeof itemSchema>;
export type CharacterFeature = z.infer<typeof featureSchema>;
export type Spellcasting = z.infer<typeof spellcastingSchema>;
export type Character = z.infer<typeof characterSchema>;
