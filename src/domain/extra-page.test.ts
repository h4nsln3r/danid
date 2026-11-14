import { describe, expect, it } from "vitest";
import { buildCharacter } from "@/domain/build-character";
import { applyExtraFindings, extraFromModelText, replaceFrontPage } from "@/domain/extra-page";
import { parseSheetForm } from "@/domain/sheet";

function fighter() {
  const form = new FormData();
  form.set("draftId", "d-1234abcd");
  form.set("name", "Torsten");
  form.set("ancestry", "Human");
  form.set("className", "Fighter");
  form.set("subclass", "");
  form.set("level", "3");
  form.set("background", "Soldier");
  form.set("alignment", "Lawful good");
  form.set("experiencePoints", "900");
  form.set("strength", "16");
  form.set("dexterity", "12");
  form.set("constitution", "14");
  form.set("intelligence", "10");
  form.set("wisdom", "11");
  form.set("charisma", "8");
  form.set("maxHitPoints", "28");
  form.set("currentHitPoints", "20");
  form.set("speed", "30");
  form.set("hitDie", "10");
  form.set("languages", "Common");
  form.set("armorName", "Chain mail");
  form.set("weapons", "Longsword");
  form.set("sheetArmorClass", "");
  form.append("skills", "athletics");
  const parsed = parseSheetForm(form);
  if (!parsed.ok) {
    throw new Error(parsed.message);
  }
  return { sheet: parsed.value, character: buildCharacter(parsed.value, "torsten-1234abcd") };
}

describe("extra pages", () => {
  it("keeps a known weapon's damage and leaves an unknown attack without damage", () => {
    const { character } = fighter();
    const next = applyExtraFindings(character, 2, [
      { kind: "attack", name: "Longbow", detail: "" },
      { kind: "attack", name: "Grandfather's axe", detail: "scratched" },
      { kind: "spell", name: "Shield", detail: "" },
    ]);
    const bow = next.items.find((item) => item.name === "Longbow");
    const axe = next.items.find((item) => item.name === "Grandfather's axe");
    expect(bow?.kind).toBe("weapon");
    expect(bow?.weapon?.damageDice).toBe("1d8");
    expect(axe?.kind).toBe("gear");
    expect(axe?.weapon).toBeUndefined();
    expect(next.features.some((feature) => feature.name === "Shield" && feature.source === "Sheet page 2")).toBe(
      true,
    );
    expect(next.spellcasting).toBeNull();
  });

  it("replacing page 2 drops the previous page 2 items and keeps page 1", () => {
    const { character } = fighter();
    const withPage = applyExtraFindings(character, 2, [
      { kind: "attack", name: "Grandfather's axe", detail: "" },
    ]);
    const replaced = applyExtraFindings(withPage, 2, [{ kind: "note", name: "A debt in Phandalin", detail: "" }]);
    expect(replaced.items.some((item) => item.name === "Grandfather's axe")).toBe(false);
    expect(replaced.items.some((item) => item.name === "Longsword")).toBe(true);
    expect(replaced.buildNotes.some((note) => note.includes("Phandalin"))).toBe(true);
  });

  it("keeps later pages when the front page is replaced", () => {
    const { sheet, character } = fighter();
    const withPage = applyExtraFindings(character, 3, [
      { kind: "feature", name: "Second wind note", detail: "Used once." },
    ]);
    const replaced = replaceFrontPage(withPage, { ...sheet, name: "Torsten Stone" });
    expect(replaced.name).toBe("Torsten Stone");
    expect(replaced.features.some((feature) => feature.name === "Second wind note")).toBe(true);
  });

  it("explains a reading that is not JSON", () => {
    expect(extraFromModelText("nope").notes[0]).toMatch(/JSON/);
  });
});
