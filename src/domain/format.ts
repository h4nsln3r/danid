import { propertyName } from "@/domain/locale";
import type { Locale } from "@/domain/locale";
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

export function weaponDetailLines(weapon: WeaponProfile, locale: Locale = "en"): string[] {
  const kind =
    locale === "sv"
      ? weapon.category === "simple"
        ? "enkelt vapen"
        : "krigsvapen"
      : `${weapon.category} weapon`;
  const lines = [
    `${kind}, ${weapon.damageDice} ${locale === "sv" ? damageWord(weapon.damageType) : weapon.damageType}`,
  ];
  if (weapon.properties.length > 0) {
    lines.push(weapon.properties.map((property) => propertyName(locale, property)).join(", "));
  }
  if (weapon.range) {
    lines.push(
      locale === "sv"
        ? `Räckvidd ${weapon.range.normal}/${weapon.range.long} fot.`
        : `Range ${weapon.range.normal}/${weapon.range.long} ft.`,
    );
  }
  if (weapon.versatileDice) {
    lines.push(
      locale === "sv" ? `Mångsidig ${weapon.versatileDice}` : `Versatile ${weapon.versatileDice}`,
    );
  }
  return lines;
}

function damageWord(damageType: string): string {
  if (damageType === "bludgeoning") return "krossande";
  if (damageType === "piercing") return "stickande";
  if (damageType === "slashing") return "huggande";
  return damageType;
}
