import { PROPERTY_LABELS } from "@/domain/catalog";
import type { InventoryItem, WeaponProfile } from "@/domain/schema";

export function formatModifier(value: number): string {
  return value >= 0 ? `+${value}` : `${value}`;
}

export function formatDamage(
  dice: string,
  bonus: number,
  damageType: string,
): string {
  if (bonus === 0) {
    return `${dice} ${damageType}`;
  }
  const sign = bonus > 0 ? "+" : "";
  return `${dice}${sign}${bonus} ${damageType}`;
}

export function formatWeight(pounds: number): string {
  const rounded = Math.round(pounds * 100) / 100;
  return `${rounded} lb`;
}

export function itemWeightLb(item: InventoryItem): number | undefined {
  if (item.weightLbEach === undefined) {
    return undefined;
  }
  return Math.round(item.weightLbEach * item.quantity * 100) / 100;
}

export function weaponDetailLines(weapon: WeaponProfile): string[] {
  const lines = [
    `${weapon.category} weapon, ${weapon.damageDice} ${weapon.damageType}`,
  ];
  if (weapon.properties.length > 0) {
    lines.push(
      weapon.properties.map((property) => PROPERTY_LABELS[property]).join(", "),
    );
  }
  if (weapon.range) {
    lines.push(`Range ${weapon.range.normal}/${weapon.range.long} ft.`);
  }
  if (weapon.versatileDice) {
    lines.push(`Versatile ${weapon.versatileDice}`);
  }
  return lines;
}
