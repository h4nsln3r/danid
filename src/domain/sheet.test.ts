import { describe, expect, it } from "vitest";
import { sheetImageKind } from "@/domain/image-kind";
import { sheetFromModelText } from "@/domain/sheet";

describe("sheet images", () => {
  it("recognizes jpeg, png, and webp, and rejects a short or huge file", () => {
    const jpeg = new Uint8Array(32);
    jpeg.set([0xff, 0xd8, 0xff]);
    const png = new Uint8Array(32);
    png.set([0x89, 0x50, 0x4e, 0x47]);
    const webp = new Uint8Array(32);
    webp.set([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);
    expect(sheetImageKind(jpeg)).toBe("jpg");
    expect(sheetImageKind(png)).toBe("png");
    expect(sheetImageKind(webp)).toBe("webp");
    expect(sheetImageKind(new Uint8Array([1, 2, 3]))).toBeNull();
    expect(sheetImageKind(new Uint8Array(8 * 1024 * 1024 + 1))).toBeNull();
  });
});

describe("sheet reading", () => {
  it("fills a Swedish sheet and flags a skill it cannot match", () => {
    const reading = sheetFromModelText(`{
      "name": "Torsten",
      "ancestry": "Människa",
      "className": "Krigare",
      "subclass": null,
      "level": 3,
      "background": "Soldat",
      "alignment": "Laglydig god",
      "experiencePoints": 900,
      "abilities": { "strength": 16, "dexterity": 12, "constitution": 14, "intelligence": 10, "wisdom": 11, "charisma": 8 },
      "maxHitPoints": 28,
      "currentHitPoints": 20,
      "speed": 30,
      "armorClass": 18,
      "hitDie": null,
      "skills": ["Friidrott", "Okänd färdighet"],
      "languages": ["Allmänspråk"],
      "armorName": "Ringbrynja",
      "shield": true,
      "weapons": ["Långsvärd"],
      "uncertainties": ["Arketypen var otydlig."]
    }`);

    expect(reading.values.name).toBe("Torsten");
    expect(reading.values.hitDie).toBe("10");
    expect(reading.values.skills).toEqual(["athletics"]);
    expect(reading.values.shield).toBe(true);
    expect(reading.notes).toContain("Arketypen var otydlig.");
    expect(reading.notes.some((note) => note.includes("Okänd färdighet"))).toBe(true);
  });

  it("asks for the missing numbers when the model returns nothing useful", () => {
    const reading = sheetFromModelText("not json");
    expect(reading.values.name).toBe("");
    expect(reading.notes[0]).toMatch(/JSON/);
  });
});
