import { z } from "zod";
import { buildCharacter } from "@/domain/build-character";
import { findWeapon } from "@/domain/phb";
import {
  EQUIPMENT_SLOT_IDS,
  characterSchema,
  type Character,
  type InventoryItem,
} from "@/domain/schema";
import type { ParsedSheet } from "@/domain/sheet";

export type SheetPageNumber = 1 | 2 | 3 | 4;

export interface ExtraFinding {
  kind: "attack" | "spell" | "feature" | "note";
  name: string;
  detail: string;
}

export interface ExtraReading {
  findings: ExtraFinding[];
  notes: string[];
}

const named = z.object({
  name: z.string(),
  detail: z.string().nullable().optional(),
});

const extraSchema = z.object({
  attacks: z.array(named).optional(),
  spells: z.array(named.extend({ level: z.number().nullable().optional() })).optional(),
  features: z.array(named).optional(),
  notes: z.array(z.string()).optional(),
  uncertainties: z.array(z.string()).optional(),
});

export function extraFromModelText(text: string): ExtraReading {
  const trimmed = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    return extraFromModel(JSON.parse(trimmed) as unknown);
  } catch {
    return {
      findings: [],
      notes: ["The reading did not return valid JSON. Nothing was added."],
    };
  }
}

export function extraFromModel(input: unknown): ExtraReading {
  const parsed = extraSchema.safeParse(input);
  if (!parsed.success) {
    return {
      findings: [],
      notes: ["The reading was missing the extra-page fields. Nothing was added."],
    };
  }
  const findings: ExtraFinding[] = [];
  for (const attack of parsed.data.attacks ?? []) {
    pushNamed(findings, "attack", attack.name, attack.detail);
  }
  for (const spell of parsed.data.spells ?? []) {
    const level = spell.level == null ? "" : `Level ${spell.level}. `;
    pushNamed(findings, "spell", spell.name, `${level}${spell.detail?.trim() ?? ""}`.trim());
  }
  for (const feature of parsed.data.features ?? []) {
    pushNamed(findings, "feature", feature.name, feature.detail);
  }
  for (const note of parsed.data.notes ?? []) {
    const text = note.trim();
    if (text) {
      findings.push({ kind: "note", name: text, detail: "" });
    }
  }
  return {
    findings,
    notes: (parsed.data.uncertainties ?? []).map((note) => note.trim()).filter(Boolean),
  };
}

export function replaceFrontPage(previous: Character, sheet: ParsedSheet): Character {
  const built = buildCharacter(sheet, previous.id);
  const keptFeatures = previous.features.filter((feature) => feature.source.startsWith("Sheet page "));
  const keptItems = previous.items.filter((item) => /^page[2-4]-/.test(item.id));
  const keptNotes = previous.buildNotes.filter((note) => note.startsWith("Page "));
  const equipped = { ...built.equipped };
  for (const slot of EQUIPMENT_SLOT_IDS) {
    const worn = previous.equipped[slot];
    if (worn && keptItems.some((item) => item.id === worn) && !equipped[slot]) {
      equipped[slot] = worn;
    }
  }
  return characterSchema.parse({
    ...built,
    features: [...built.features, ...keptFeatures],
    items: [...built.items, ...keptItems],
    equipped,
    spellcasting: previous.spellcasting,
    biography: previous.biography,
    buildNotes: [...built.buildNotes, ...keptNotes],
  });
}

export function applyExtraFindings(
  character: Character,
  page: 2 | 3 | 4,
  selected: ExtraFinding[],
): Character {
  const source = `Sheet page ${page}`;
  const prefix = `page${page}-`;
  const removed = new Set(
    character.items.filter((item) => item.id.startsWith(prefix)).map((item) => item.id),
  );
  const items = character.items.filter((item) => !removed.has(item.id));
  const equipped = { ...character.equipped };
  for (const slot of EQUIPMENT_SLOT_IDS) {
    const worn = equipped[slot];
    if (worn && removed.has(worn)) {
      delete equipped[slot];
    }
  }
  const features = character.features.filter((feature) => feature.source !== source);
  const buildNotes = character.buildNotes.filter((note) => !note.startsWith(`Page ${page}:`));
  let index = 1;

  for (const finding of selected) {
    if (finding.kind === "note") {
      const text = (finding.detail || finding.name).trim();
      if (text) {
        buildNotes.push(`Page ${page}: ${text}`);
      }
      continue;
    }
    if (finding.kind === "attack") {
      const known = findWeapon(finding.name);
      const id = `${prefix}${slug(finding.name)}-${index}`;
      index += 1;
      if (known) {
        const item: InventoryItem = {
          id,
          name: finding.name,
          kind: "weapon",
          slots: known.slots,
          quantity: 1,
          weightLbEach: known.weightLbEach,
          description: finding.detail
            ? `Written on page ${page}: ${finding.detail}`
            : `Weapon from the Player's Handbook (2014). Damage ${known.weapon.damageDice}.`,
          source: "PHB 2014",
          weapon: known.weapon,
        };
        items.push(item);
        const slot = known.slots.find((candidate) => !equipped[candidate]);
        if (slot) {
          equipped[slot] = id;
        }
      } else {
        items.push({
          id,
          name: finding.name,
          kind: "gear",
          slots: [],
          quantity: 1,
          description: finding.detail
            ? `Written on page ${page}: ${finding.detail} No damage was invented.`
            : `The name was read from page ${page}. Damage and properties are not filled in.`,
          source: "mundane",
        });
        buildNotes.push(
          `Page ${page}: "${finding.name}" does not match a 2014 Player's Handbook weapon, so it has no invented damage.`,
        );
      }
      continue;
    }
    features.push({
      id: `${prefix}${finding.kind}-${slug(finding.name)}-${index}`,
      name: finding.name,
      summary: finding.detail || `Written on page ${page}. The book's text was not added.`,
      source,
    });
    index += 1;
  }

  const keptItems =
    items.length > 0
      ? items
      : [
          {
            id: "pack",
            name: "Empty pack",
            kind: "gear" as const,
            slots: [],
            quantity: 1,
            description: "No equipment remains after this page was cleared.",
            source: "mundane" as const,
          },
        ];

  return characterSchema.parse({
    ...character,
    items: keptItems,
    equipped,
    features,
    buildNotes: buildNotes.length > 0 ? buildNotes : ["Updated from the character's papers."],
  });
}

function pushNamed(
  findings: ExtraFinding[],
  kind: ExtraFinding["kind"],
  name: string,
  detail: string | null | undefined,
) {
  const trimmed = name.trim();
  if (!trimmed) {
    return;
  }
  findings.push({ kind, name: trimmed, detail: detail?.trim() ?? "" });
}

function slug(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 24) || "item"
  );
}
