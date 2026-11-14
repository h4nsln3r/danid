import { describe, expect, it } from "vitest";
import { buildCharacter } from "@/domain/build-character";
import { armorClass } from "@/domain/rules/combat";
import { parseSheetForm } from "@/domain/sheet";

describe("buildCharacter", () => {
  it("builds a fighter from confirmed sheet values and calculates armor class", () => {
    const form = new FormData();
    form.set("draftId", "d-1234abcd");
    form.set("name", "Torsten");
    form.set("ancestry", "Människa");
    form.set("className", "Krigare");
    form.set("subclass", "");
    form.set("level", "3");
    form.set("background", "Soldat");
    form.set("alignment", "Laglydig god");
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
    form.set("languages", "Allmänspråk, Dvärgiska");
    form.set("armorName", "Ringbrynja");
    form.set("shield", "on");
    form.set("weapons", "Långsvärd\nOkänt blad");
    form.set("sheetArmorClass", "18");
    form.append("skills", "athletics");
    form.append("skills", "intimidation");

    const parsed = parseSheetForm(form);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    const character = buildCharacter(parsed.value, "torsten-1234abcd");
    expect(character.id).toBe("torsten-1234abcd");
    expect(character.hitDie).toBe(10);
    expect(character.savingThrowProficiencies).toEqual(["strength", "constitution"]);
    expect(character.armorProficiencies).toContain("heavy");
    expect(character.equipped.armor).toBeTruthy();
    expect(character.equipped.offHand).toBeTruthy();
    expect(character.equipped.mainHand).toBeTruthy();
    expect(armorClass(character).total).toBe(18);
    expect(character.items.some((item) => item.name === "Okänt blad" && item.kind === "gear")).toBe(
      true,
    );
    expect(character.buildNotes.some((note) => note.includes("Armor Class 18"))).toBe(true);
  });
});
