import type { Character, InventoryItem } from "@/domain/schema";

const ARROW_NAME = /arrow|pilar|pil\b/i;
const MAX_ARROWS = 999;

function clamp(value: number, min: number, max: number): number {
  const rounded = Math.trunc(value);
  if (!Number.isFinite(rounded)) {
    return min;
  }
  return Math.min(max, Math.max(min, rounded));
}

export function withHitPoints(character: Character, hitPoints: number): Character {
  return {
    ...character,
    currentHitPoints: clamp(hitPoints, 0, character.maxHitPoints),
  };
}

export function arrowStack(character: Character): InventoryItem | undefined {
  return character.items.find(
    (item) => item.kind === "ammunition" && ARROW_NAME.test(item.name),
  );
}

export function arrowCount(character: Character): number {
  return arrowStack(character)?.quantity ?? 0;
}

function arrowId(items: readonly InventoryItem[]): string {
  if (!items.some((item) => item.id === "arrows")) {
    return "arrows";
  }
  let suffix = 2;
  while (items.some((item) => item.id === `arrows-${suffix}`)) {
    suffix += 1;
  }
  return `arrows-${suffix}`;
}

export function withArrowCount(character: Character, count: number): Character {
  const quantity = clamp(count, 0, MAX_ARROWS);
  const existing = arrowStack(character);
  if (!existing && quantity === 0) {
    return character;
  }
  if (existing && quantity === 0) {
    const items = character.items.filter((item) => item.id !== existing.id);
    if (items.length === 0) {
      return character;
    }
    return { ...character, items };
  }
  if (existing) {
    return {
      ...character,
      items: character.items.map((item) =>
        item.id === existing.id ? { ...item, quantity } : item,
      ),
    };
  }
  const created: InventoryItem = {
    id: arrowId(character.items),
    name: "Arrows",
    kind: "ammunition",
    slots: [],
    quantity,
    weightLbEach: 0.05,
    description: "Arrows for a bow. Twenty weigh 1 pound.",
    source: "PHB 2014",
  };
  return { ...character, items: [...character.items, created] };
}
