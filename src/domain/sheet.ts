import { z } from "zod";
import { SKILL_IDS, skillSchema, type SkillId } from "@/domain/schema";
import { findClass } from "@/domain/phb";

const DIE_SIZES = [4, 6, 8, 10, 12] as const;

export interface SheetValues {
  name: string;
  ancestry: string;
  className: string;
  subclass: string;
  level: string;
  background: string;
  alignment: string;
  experiencePoints: string;
  strength: string;
  dexterity: string;
  constitution: string;
  intelligence: string;
  wisdom: string;
  charisma: string;
  maxHitPoints: string;
  currentHitPoints: string;
  speed: string;
  hitDie: string;
  skills: SkillId[];
  languages: string;
  armorName: string;
  shield: boolean;
  weapons: string;
  sheetArmorClass: string;
}

export interface SheetReading {
  values: SheetValues;
  notes: string[];
}

const SKILL_ALIASES: Record<string, SkillId> = {
  acrobatics: "acrobatics",
  akrobatik: "acrobatics",
  "animal handling": "animal-handling",
  djurhantering: "animal-handling",
  arcana: "arcana",
  arkanakunskap: "arcana",
  athletics: "athletics",
  friidrott: "athletics",
  deception: "deception",
  bluff: "deception",
  history: "history",
  historia: "history",
  insight: "insight",
  insikt: "insight",
  intimidation: "intimidation",
  hot: "intimidation",
  investigation: "investigation",
  efterforskning: "investigation",
  medicine: "medicine",
  lakekonst: "medicine",
  nature: "nature",
  naturkunskap: "nature",
  perception: "perception",
  uppfattningsformaga: "perception",
  performance: "performance",
  upptradande: "performance",
  persuasion: "persuasion",
  overtalning: "persuasion",
  religion: "religion",
  "sleight of hand": "sleight-of-hand",
  fingerfardighet: "sleight-of-hand",
  stealth: "stealth",
  smyga: "stealth",
  survival: "survival",
  overlevnad: "survival",
};

export function blankSheet(): SheetValues {
  return {
    name: "",
    ancestry: "",
    className: "",
    subclass: "",
    level: "",
    background: "",
    alignment: "",
    experiencePoints: "",
    strength: "",
    dexterity: "",
    constitution: "",
    intelligence: "",
    wisdom: "",
    charisma: "",
    maxHitPoints: "",
    currentHitPoints: "",
    speed: "",
    hitDie: "",
    skills: [],
    languages: "",
    armorName: "",
    shield: false,
    weapons: "",
    sheetArmorClass: "",
  };
}

export function sheetFromModelText(text: string): SheetReading {
  const trimmed = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    return sheetFromModel(JSON.parse(trimmed) as unknown);
  } catch {
    return {
      values: blankSheet(),
      notes: ["Läsningen svarade inte med giltig JSON. Fyll i bladet själv."],
    };
  }
}

export function sheetFromModel(input: unknown): SheetReading {
  const parsed = modelSchema.safeParse(input);
  if (!parsed.success) {
    return {
      values: blankSheet(),
      notes: ["Läsningen saknade de fält som behövs. Fyll i bladet själv."],
    };
  }

  const model = parsed.data;
  const notes = [...(model.uncertainties ?? [])];
  const values = blankSheet();
  values.name = clean(model.name);
  values.ancestry = clean(model.ancestry);
  values.className = clean(model.className);
  values.subclass = clean(model.subclass);
  values.level = numberText(model.level);
  values.background = clean(model.background);
  values.alignment = clean(model.alignment);
  values.experiencePoints = numberText(model.experiencePoints);
  values.strength = numberText(model.abilities?.strength);
  values.dexterity = numberText(model.abilities?.dexterity);
  values.constitution = numberText(model.abilities?.constitution);
  values.intelligence = numberText(model.abilities?.intelligence);
  values.wisdom = numberText(model.abilities?.wisdom);
  values.charisma = numberText(model.abilities?.charisma);
  values.maxHitPoints = numberText(model.maxHitPoints);
  values.currentHitPoints = numberText(model.currentHitPoints);
  values.speed = numberText(model.speed);
  values.armorName = clean(model.armorName);
  values.shield = model.shield === true;
  values.sheetArmorClass = numberText(model.armorClass);
  values.languages = (model.languages ?? [])
    .map((language) => language.trim())
    .filter(Boolean)
    .join(", ");
  values.weapons = (model.weapons ?? [])
    .map((weapon) => weapon.trim())
    .filter(Boolean)
    .join("\n");

  const skills: SkillId[] = [];
  for (const skill of model.skills ?? []) {
    const id = skillId(skill);
    if (!id) {
      notes.push(`Färdigheten "${skill}" matchade ingen färdighet i Player's Handbook 2014.`);
      continue;
    }
    if (!skills.includes(id)) {
      skills.push(id);
    }
  }
  values.skills = skills;

  const classProfile = findClass(values.className);
  if (classProfile) {
    values.hitDie = String(classProfile.hitDie);
    if (model.hitDie != null && model.hitDie !== classProfile.hitDie) {
      notes.push(
        `Bladet verkade ange tärning d${model.hitDie}. Klassen använder d${classProfile.hitDie}, och det värdet är ifyllt.`,
      );
    }
  } else if (model.hitDie != null && DIE_SIZES.includes(model.hitDie as (typeof DIE_SIZES)[number])) {
    values.hitDie = String(model.hitDie);
  }

  noteIfEmpty(notes, values.name, "Namnet");
  noteIfEmpty(notes, values.ancestry, "Folkslaget");
  noteIfEmpty(notes, values.className, "Klassen");
  noteIfEmpty(notes, values.level, "Nivån");
  noteIfEmpty(notes, values.strength, "Styrka");
  noteIfEmpty(notes, values.dexterity, "Rörlighet");
  noteIfEmpty(notes, values.constitution, "Fysik");
  noteIfEmpty(notes, values.intelligence, "Intelligens");
  noteIfEmpty(notes, values.wisdom, "Visdom");
  noteIfEmpty(notes, values.charisma, "Karisma");
  noteIfEmpty(notes, values.maxHitPoints, "Maximala träffpoäng");
  noteIfEmpty(notes, values.speed, "Förflyttning");

  return { values, notes };
}

const looseNumber = z
  .union([z.number(), z.string(), z.null()])
  .optional()
  .transform((value) => {
    if (value == null || value === "") {
      return null;
    }
    const number = typeof value === "number" ? value : Number(value);
    return Number.isFinite(number) ? number : null;
  });

const looseText = z
  .union([z.string(), z.null()])
  .optional()
  .transform((value) => value?.trim() || null);

const modelSchema = z.object({
  name: looseText,
  ancestry: looseText,
  className: looseText,
  subclass: looseText,
  level: looseNumber,
  background: looseText,
  alignment: looseText,
  experiencePoints: looseNumber,
  abilities: z
    .object({
      strength: looseNumber,
      dexterity: looseNumber,
      constitution: looseNumber,
      intelligence: looseNumber,
      wisdom: looseNumber,
      charisma: looseNumber,
    })
    .partial()
    .optional(),
  maxHitPoints: looseNumber,
  currentHitPoints: looseNumber,
  speed: looseNumber,
  armorClass: looseNumber,
  hitDie: looseNumber,
  skills: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  armorName: looseText,
  shield: z.boolean().nullable().optional(),
  weapons: z.array(z.string()).optional(),
  uncertainties: z.array(z.string()).optional(),
});

const sheetFormSchema = z
  .object({
    draftId: z.string().regex(/^d-[a-f0-9]{8}$/, "Bilden saknar ett giltigt utkast."),
    name: z.string().trim().min(1, "Skriv namnet.").max(80),
    ancestry: z.string().trim().min(1, "Skriv folkslaget.").max(80),
    className: z.string().trim().min(1, "Skriv klassen.").max(80),
    subclass: z.string().trim().max(80),
    level: z.coerce.number().int().min(1, "Nivån ska vara 1–20.").max(20),
    background: z.string().trim().min(1, "Skriv bakgrunden.").max(80),
    alignment: z.string().trim().min(1, "Skriv läggningen.").max(80),
    experiencePoints: z.coerce.number().int().min(0).max(999999),
    strength: z.coerce.number().int().min(1).max(30),
    dexterity: z.coerce.number().int().min(1).max(30),
    constitution: z.coerce.number().int().min(1).max(30),
    intelligence: z.coerce.number().int().min(1).max(30),
    wisdom: z.coerce.number().int().min(1).max(30),
    charisma: z.coerce.number().int().min(1).max(30),
    maxHitPoints: z.coerce.number().int().min(1, "Skriv maximala träffpoäng.").max(400),
    currentHitPoints: z.coerce.number().int().min(0).max(400),
    speed: z.coerce.number().int().min(5, "Skriv förflyttning i fot.").max(120),
    hitDie: z.coerce
      .number()
      .int()
      .refine((die) => DIE_SIZES.includes(die as (typeof DIE_SIZES)[number]), {
        message: "Träffpoängstärningen måste vara 4, 6, 8, 10 eller 12.",
      }),
    skills: z.array(skillSchema),
    languages: z.string().trim().min(1, "Skriv minst ett språk."),
    armorName: z.string().trim().max(80),
    shield: z.boolean(),
    weapons: z.string().max(1000),
    sheetArmorClass: z.string().trim().max(4),
  })
  .superRefine((sheet, ctx) => {
    if (sheet.currentHitPoints > sheet.maxHitPoints) {
      ctx.addIssue({
        code: "custom",
        path: ["currentHitPoints"],
        message: "Nuvarande träffpoäng kan inte vara högre än max.",
      });
    }
  });

export type ParsedSheet = z.infer<typeof sheetFormSchema>;

export function parseSheetForm(
  formData: FormData,
): { ok: true; value: ParsedSheet } | { ok: false; message: string } {
  const skills = formData
    .getAll("skills")
    .map(String)
    .filter((skill) => SKILL_IDS.includes(skill as SkillId));
  const parsed = sheetFormSchema.safeParse({
    draftId: stringField(formData, "draftId"),
    name: stringField(formData, "name"),
    ancestry: stringField(formData, "ancestry"),
    className: stringField(formData, "className"),
    subclass: stringField(formData, "subclass"),
    level: stringField(formData, "level"),
    background: stringField(formData, "background"),
    alignment: stringField(formData, "alignment"),
    experiencePoints: stringField(formData, "experiencePoints") || "0",
    strength: stringField(formData, "strength"),
    dexterity: stringField(formData, "dexterity"),
    constitution: stringField(formData, "constitution"),
    intelligence: stringField(formData, "intelligence"),
    wisdom: stringField(formData, "wisdom"),
    charisma: stringField(formData, "charisma"),
    maxHitPoints: stringField(formData, "maxHitPoints"),
    currentHitPoints: stringField(formData, "currentHitPoints"),
    speed: stringField(formData, "speed"),
    hitDie: stringField(formData, "hitDie"),
    skills,
    languages: stringField(formData, "languages"),
    armorName: stringField(formData, "armorName"),
    shield: formData.get("shield") === "on",
    weapons: stringField(formData, "weapons"),
    sheetArmorClass: stringField(formData, "sheetArmorClass"),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Formuläret är ofullständigt." };
  }
  return { ok: true, value: parsed.data };
}

export function weaponLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .flatMap((line) => line.split(","))
    .map((line) => line.trim())
    .filter(Boolean);
}

function skillId(value: string): SkillId | undefined {
  const key = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  return SKILL_ALIASES[key];
}

function clean(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

function numberText(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) {
    return "";
  }
  return String(Math.trunc(value));
}

function noteIfEmpty(notes: string[], value: string, label: string) {
  if (!value) {
    notes.push(`${label} kunde inte läsas. Fyll i det innan du skapar karaktären.`);
  }
}

function stringField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}
