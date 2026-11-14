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
  return `${base || "character"}-${suffix}`;
}

export function buildCharacter(sheet: ParsedSheet, id: string): Character {
  const notes: string[] = [
    "These values come from a character sheet and were confirmed in the form.",
    "Class features, spells, and choices that were not clearly written on the sheet were not invented.",
  ];
  const classProfile = findClass(sheet.className);
  if (!classProfile) {
    notes.push(
      `${sheet.className} does not match one of the twelve classes in the 2014 Player's Handbook. Saving throws and weapon proficiencies were left empty.`,
    );
  } else if (classProfile.weaponNote) {
    notes.push(classProfile.weaponNote);
  }
  if (sheet.sheetArmorClass) {
    notes.push(
      `The character sheet showed Armor Class ${sheet.sheetArmorClass}. This page calculates Armor Class from the armor you wear.`,
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
        description: `Armor from the Player's Handbook (2014). Armor Class ${known.armor.baseAc}.`,
        source: "PHB 2014",
        armor: known.armor,
      });
      equipped.armor = idForItem;
    } else {
      notes.push(
        `The armor "${armorName}" does not match an armor in the 2014 Player's Handbook, so it grants no Armor Class.`,
      );
      pushItem(items, {
        name: armorName,
        kind: "gear",
        slots: [],
        quantity: 1,
        description: "The name was read from the sheet. No Armor Class was filled in.",
        source: "mundane",
      });
    }
  }

  if (shield) {
    const known = findArmor("shield");
    if (known?.kind === "shield") {
      const idForItem = pushItem(items, {
        name: "Shield",
        kind: "shield",
        slots: ["offHand"],
        quantity: 1,
        weightLbEach: known.weightLbEach,
        description: "Wielding a shield increases your Armor Class by 2.",
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
            description: "Wielding a shield increases your Armor Class by 2.",
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
        `"${line}" does not match a weapon in the 2014 Player's Handbook. It is carried, with no invented damage.`,
      );
      pushItem(items, {
        name: line,
        kind: "gear",
        slots: [],
        quantity: 1,
        description: "The name was read from the sheet. Damage and properties are not filled in.",
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
      notes.push(`${line} did not fit an open weapon slot and is carried.`);
    }
  }

  if (items.length === 0) {
    const pouchId = pushItem(items, {
      name: "Pouch",
      kind: "gear",
      slots: ["belt"],
      quantity: 1,
      weightLbEach: 1,
      description: "A cloth or leather pouch, added so the character has one piece of equipment.",
      source: "mundane",
    });
    equipped.belt = pouchId;
    notes.push("No weapon or armor was read, so an empty pouch was added.");
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
        name: "Read from a character sheet",
        summary:
          "Class features and spells that were not clearly written on the sheet are not included. Add them before they are used in play.",
        source: "Character sheet",
      },
    ],
    spellcasting: null,
    biography: `${sheet.name} was created from a photographed or uploaded character sheet.`,
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
  return `${slug || "item"}-${index}`;
}

function weaponDescription(dice: string, properties: readonly string[]): string {
  const hands = properties.includes("two-handed") ? " Two-handed." : "";
  return `Weapon from the Player's Handbook (2014). Damage ${dice}.${hands}`;
}
