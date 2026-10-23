import type { Character, InventoryItem } from "@/domain/schema";
import { characterSchema } from "@/domain/schema";
import { findArmor, findClass, findWeapon, isShieldName } from "@/domain/phb";
import type { ParsedSheet } from "@/domain/sheet";
import { weaponLines } from "@/domain/sheet";

export function characterIdFromName(name: string, suffix: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `${base || "karaktar"}-${suffix}`;
}

export function buildCharacter(sheet: ParsedSheet, id: string): Character {
  const notes: string[] = [
    "Värdena kommer från ett inläst pappersblad och har bekräftats i formuläret.",
    "Klassdrag, trollformler och val som inte stod tydligt på bladet har inte hittats på.",
  ];
  const classProfile = findClass(sheet.className);
  if (!classProfile) {
    notes.push(
      `${sheet.className} matchar ingen av de tolv klasserna i Player's Handbook 2014. Räddningar och vapenträning lämnades tomma.`,
    );
  } else if (classProfile.weaponNote) {
    notes.push(classProfile.weaponNote);
  }
  if (sheet.sheetArmorClass) {
    notes.push(
      `Pappersbladet visade rustningsklass ${sheet.sheetArmorClass}. Foliet räknar rustningsklass från buren rustning.`,
    );
  }

  const items: InventoryItem[] = [];
  const equipped: Character["equipped"] = {};
  let shield = sheet.shield || isShieldName(sheet.armorName);
  const armorName = isShieldName(sheet.armorName) ? "" : sheet.armorName;

  if (armorName) {
    const known = findArmor(armorName);
    if (known?.kind === "armor") {
      const idForItem = pushItem(items, {
        name: armorName,
        kind: "armor",
        slots: ["armor"],
        quantity: 1,
        weightLbEach: known.weightLbEach,
        description: `Rustning från Player's Handbook 2014. Grundvärde ${known.armor.baseAc}.`,
        source: "PHB 2014",
        armor: known.armor,
      });
      equipped.armor = idForItem;
    } else {
      notes.push(
        `Rustningen "${armorName}" matchade ingen rustning i Player's Handbook 2014, så den ger ingen rustningsklass.`,
      );
      pushItem(items, {
        name: armorName,
        kind: "gear",
        slots: [],
        quantity: 1,
        description: "Namnet lästes från bladet. Ingen rustningsklass har hittats på.",
        source: "mundane",
      });
    }
  }

  if (shield) {
    const known = findArmor("shield");
    if (known?.kind === "shield") {
      const idForItem = pushItem(items, {
        name: "Sköld",
        kind: "shield",
        slots: ["offHand"],
        quantity: 1,
        weightLbEach: known.weightLbEach,
        description: "En sköld. Den ger +2 i rustningsklass.",
        source: "PHB 2014",
        armor: known.armor,
      });
      equipped.offHand = idForItem;
    }
  }

  for (const line of weaponLines(sheet.weapons)) {
    if (isShieldName(line)) {
      if (!equipped.offHand) {
        shield = true;
        const known = findArmor("shield");
        if (known?.kind === "shield") {
          const idForItem = pushItem(items, {
            name: line,
            kind: "shield",
            slots: ["offHand"],
            quantity: 1,
            weightLbEach: known.weightLbEach,
            description: "En sköld. Den ger +2 i rustningsklass.",
            source: "PHB 2014",
            armor: known.armor,
          });
          equipped.offHand = idForItem;
        }
      }
      continue;
    }

    const known = findWeapon(line);
    if (!known) {
      notes.push(
        `"${line}" matchade inget vapen i Player's Handbook 2014. Det ligger i packningen utan påhittad skada.`,
      );
      pushItem(items, {
        name: line,
        kind: "gear",
        slots: [],
        quantity: 1,
        description: "Namnet lästes från bladet. Skada och egenskaper är inte ifyllda.",
        source: "mundane",
      });
      continue;
    }

    const idForItem = pushItem(items, {
      name: line,
      kind: "weapon",
      slots: known.slots,
      quantity: 1,
      weightLbEach: known.weightLbEach,
      description: weaponDescription(known.weapon.damageDice, known.weapon.properties),
      source: "PHB 2014",
      weapon: known.weapon,
    });
    const slot = known.slots.find((candidate) => !equipped[candidate]);
    if (slot) {
      equipped[slot] = idForItem;
    } else {
      notes.push(`${line} fick inte plats i en ledig vapenplats och ligger i packningen.`);
    }
  }

  if (items.length === 0) {
    const pouchId = pushItem(items, {
      name: "Bältespåse",
      kind: "gear",
      slots: ["belt"],
      quantity: 1,
      weightLbEach: 1,
      description: "En tom påse, tillagd för att karaktären ska ha en utrustningsrad.",
      source: "mundane",
    });
    equipped.belt = pouchId;
    notes.push("Inget vapen eller någon rustning lästes in, så en tom bältespåse lades till.");
  }

  const languages = sheet.languages
    .split(",")
    .map((language) => language.trim())
    .filter(Boolean);

  const character = {
    id,
    name: sheet.name,
    ancestry: sheet.ancestry,
    className: sheet.className,
    subclass: sheet.subclass || undefined,
    level: sheet.level,
    background: sheet.background,
    alignment: sheet.alignment,
    experiencePoints: sheet.experiencePoints,
    ruleset: "2014-phb" as const,
    languages,
    toolProficiencies: [],
    abilityScores: {
      strength: sheet.strength,
      dexterity: sheet.dexterity,
      constitution: sheet.constitution,
      intelligence: sheet.intelligence,
      wisdom: sheet.wisdom,
      charisma: sheet.charisma,
    },
    hitDie: sheet.hitDie,
    maxHitPoints: sheet.maxHitPoints,
    currentHitPoints: sheet.currentHitPoints,
    temporaryHitPoints: 0,
    speed: sheet.speed,
    armorProficiencies: classProfile?.armor ?? [],
    weaponProficiencies: classProfile?.weapons ?? [],
    savingThrowProficiencies: classProfile?.saves ?? [],
    skillProficiencies: sheet.skills,
    fightingStyles: [],
    features: [
      {
        id: "sheet-import",
        name: "Inläst från pappersblad",
        summary:
          "Klassdrag och trollformler som inte stod tydligt på bladet är inte med. Lägg till dem innan de används i spel.",
        source: "Inläst blad",
      },
    ],
    spellcasting: null,
    biography: `${sheet.name} skapades från ett fotograferat eller uppladdat karaktärsblad.`,
    buildNotes: notes,
    items,
    equipped,
  };

  return characterSchema.parse(character);
}

function pushItem(
  items: InventoryItem[],
  item: Omit<InventoryItem, "id">,
): string {
  const id = itemId(item.name, items.length + 1);
  items.push({ ...item, id });
  return id;
}

function itemId(name: string, index: number): string {
  const slug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24);
  return `${slug || "sak"}-${index}`;
}

function weaponDescription(dice: string, properties: readonly string[]): string {
  const hands = properties.includes("two-handed") ? " Kräver två händer." : "";
  return `Vapen från Player's Handbook 2014. Skada ${dice}.${hands}`;
}
