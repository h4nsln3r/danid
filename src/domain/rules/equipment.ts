import { slotName, type Locale } from "@/domain/locale";
import type { Character, EquipmentSlotId, InventoryItem } from "@/domain/schema";
import { EQUIPMENT_SLOT_IDS } from "@/domain/schema";

export interface EquipSuccess {
  ok: true;
  character: Character;
  alreadyEquipped?: boolean;
  displacedItemId?: string;
}

export interface EquipFailure {
  ok: false;
  reason: string;
}

export type EquipResult = EquipSuccess | EquipFailure;

export function equippedItem(
  character: Character,
  slot: EquipmentSlotId,
): InventoryItem | undefined {
  const itemId = character.equipped[slot];
  if (!itemId) {
    return undefined;
  }
  return character.items.find((item) => item.id === itemId);
}

export function slotOfItem(
  character: Character,
  itemId: string,
): EquipmentSlotId | undefined {
  return EQUIPMENT_SLOT_IDS.find((slot) => character.equipped[slot] === itemId);
}

export function carriedItems(character: Character): InventoryItem[] {
  const worn = new Set(
    EQUIPMENT_SLOT_IDS.map((slot) => character.equipped[slot]).filter(
      (itemId): itemId is string => Boolean(itemId),
    ),
  );
  return character.items.filter((item) => !worn.has(item.id));
}

export function itemsForSlot(
  character: Character,
  slot: EquipmentSlotId,
): InventoryItem[] {
  return character.items.filter((item) => {
    if (!item.slots.includes(slot) || item.quantity !== 1) {
      return false;
    }
    return character.equipped[slot] !== item.id;
  });
}

export function totalWeightLb(character: Character): number {
  const total = character.items.reduce((sum, item) => {
    if (item.weightLbEach === undefined) {
      return sum;
    }
    return sum + item.weightLbEach * item.quantity;
  }, 0);
  return Math.round(total * 100) / 100;
}

/** Standard carrying capacity: Strength score × 15 pounds. */
export function carryingCapacity(character: Character): number {
  return character.abilityScores.strength * 15;
}

export function equipItem(
  character: Character,
  itemId: string,
  slot: EquipmentSlotId,
  locale: Locale = "en",
): EquipResult {
  const item = character.items.find((entry) => entry.id === itemId);
  const place = slotName(locale, slot).toLowerCase();
  if (!item) {
    return {
      ok: false,
      reason: locale === "sv" ? "Det föremålet finns inte på karaktären." : "That item is not on this character.",
    };
  }
  if (!item.slots.includes(slot)) {
    return {
      ok: false,
      reason:
        locale === "sv"
          ? `${item.name} passar inte på platsen ${place}.`
          : `${item.name} does not fit the ${place} slot.`,
    };
  }
  if (item.quantity !== 1) {
    return {
      ok: false,
      reason:
        locale === "sv"
          ? `${item.name} är en hög och stannar i utrustningen.`
          : `${item.name} is a stack and stays in your equipment.`,
    };
  }
  if (character.equipped[slot] === itemId) {
    return { ok: true, character, alreadyEquipped: true };
  }

  const equipped: Character["equipped"] = { ...character.equipped };
  for (const key of EQUIPMENT_SLOT_IDS) {
    if (key !== slot && equipped[key] === itemId) {
      delete equipped[key];
    }
  }
  const displacedItemId = equipped[slot];
  equipped[slot] = itemId;
  return {
    ok: true,
    character: { ...character, equipped },
    displacedItemId,
  };
}

export function stowItem(
  character: Character,
  slot: EquipmentSlotId,
  locale: Locale = "en",
): EquipResult {
  const itemId = character.equipped[slot];
  const place = slotName(locale, slot).toLowerCase();
  if (!itemId) {
    return {
      ok: false,
      reason:
        locale === "sv"
          ? `Platsen ${place} är redan tom.`
          : `The ${place} slot is already empty.`,
    };
  }
  const equipped: Character["equipped"] = { ...character.equipped };
  delete equipped[slot];
  return {
    ok: true,
    character: { ...character, equipped },
    displacedItemId: itemId,
  };
}
