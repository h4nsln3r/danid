"use server";

import { randomBytes } from "node:crypto";
import { z } from "zod";
import {
  applyExtraFindings,
  replaceFrontPage,
  type ExtraFinding,
  type ExtraReading,
} from "@/domain/extra-page";
import { sheetImageKind, type SheetImageKind } from "@/domain/image-kind";
import type { Character } from "@/domain/schema";
import { parseSheetForm, type SheetReading } from "@/domain/sheet";
import {
  getOwnedCharacter,
  portraitGallery,
  saveOwnedCharacter,
  saveSheetFile,
  setPortraitGallery,
  setSheetPageFile,
  type SheetPageSlot,
} from "@/server/library-store";
import { currentPlayer } from "@/server/players";
import { readCharacterSheet, readExtraPage, SheetReaderError } from "@/server/sheet-reader";

interface ActionFailure {
  ok: false;
  message: string;
  saved?: boolean;
  fileName?: string;
}

const findingSchema = z.object({
  kind: z.enum(["attack", "spell", "feature", "note"]),
  name: z.string().trim().min(1).max(120),
  detail: z.string().max(400),
});

export async function uploadSheetPage(
  formData: FormData,
): Promise<
  | { ok: true; page: 1; fileName: string; reading: SheetReading }
  | { ok: true; page: 2 | 3 | 4; fileName: string; reading: ExtraReading }
  | ActionFailure
> {
  const loaded = await ownedFromForm(formData);
  if (!loaded.ok) {
    return loaded;
  }
  const page = pageNumber(formData.get("page"));
  if (!page) {
    return { ok: false, message: "Choose page 1, 2, 3, or 4." };
  }
  const image = await imageFromForm(formData, "sheet");
  if (!image.ok) {
    return image;
  }

  const fileName = `${loaded.character.id}-page-${page}-${randomBytes(2).toString("hex")}.${image.kind}`;
  await saveSheetFile(fileName, image.bytes);
  await setSheetPageFile(loaded.playerId, loaded.character.id, String(page) as SheetPageSlot, fileName);

  try {
    if (page === 1) {
      const reading = await readCharacterSheet(image.bytes, image.kind);
      return { ok: true, page: 1, fileName, reading };
    }
    const reading = await readExtraPage(image.bytes, image.kind);
    return { ok: true, page, fileName, reading };
  } catch (error) {
    const message =
      error instanceof SheetReaderError
        ? error.message
        : "The reading failed. The picture is saved. Try that page again.";
    return { ok: false, saved: true, fileName, message };
  }
}

export async function confirmFrontPage(
  formData: FormData,
): Promise<{ ok: true; character: Character } | ActionFailure> {
  const loaded = await ownedFromForm(formData);
  if (!loaded.ok) {
    return loaded;
  }
  formData.set("draftId", "d-00000000");
  const parsed = parseSheetForm(formData);
  if (!parsed.ok) {
    return parsed;
  }
  const character = replaceFrontPage(loaded.character, parsed.value);
  await saveOwnedCharacter(loaded.playerId, character);
  return { ok: true, character };
}

export async function confirmExtraPage(
  formData: FormData,
): Promise<{ ok: true; character: Character } | ActionFailure> {
  const loaded = await ownedFromForm(formData);
  if (!loaded.ok) {
    return loaded;
  }
  const page = pageNumber(formData.get("page"));
  if (page !== 2 && page !== 3 && page !== 4) {
    return { ok: false, message: "Pages 2, 3, and 4 add attacks, spells, features, and notes." };
  }
  let selected: ExtraFinding[];
  try {
    selected = z.array(findingSchema).max(40).parse(JSON.parse(String(formData.get("findings") ?? "[]")));
  } catch {
    return { ok: false, message: "The chosen lines could not be read. Try the page again." };
  }
  const character = applyExtraFindings(loaded.character, page, selected);
  await saveOwnedCharacter(loaded.playerId, character);
  return { ok: true, character };
}

export async function uploadPortrait(
  formData: FormData,
): Promise<{ ok: true; files: string[]; active: string } | ActionFailure> {
  const loaded = await ownedFromForm(formData);
  if (!loaded.ok) {
    return loaded;
  }
  const image = await imageFromForm(formData, "portrait");
  if (!image.ok) {
    return image;
  }
  const gallery = portraitGallery(loaded.entry);
  const replace = stringField(formData, "replace");
  const remaining = replace ? gallery.files.filter((file) => file !== replace) : gallery.files;
  if (!replace && remaining.length >= 8) {
    return { ok: false, message: "Eight pictures are saved. Replace one of them." };
  }
  const fileName = `${loaded.character.id}-portrait-${randomBytes(2).toString("hex")}.${image.kind}`;
  await saveSheetFile(fileName, image.bytes);
  const files = [...remaining, fileName].slice(0, 8);
  const active = !gallery.active || gallery.active === replace ? fileName : gallery.active;
  await setPortraitGallery(loaded.playerId, loaded.character.id, files, active);
  return { ok: true, files, active };
}

export async function showPortrait(
  formData: FormData,
): Promise<{ ok: true; active: string } | ActionFailure> {
  const loaded = await ownedFromForm(formData);
  if (!loaded.ok) {
    return loaded;
  }
  const fileName = stringField(formData, "fileName");
  const gallery = portraitGallery(loaded.entry);
  if (!gallery.files.includes(fileName)) {
    return { ok: false, message: "That picture is not on this character." };
  }
  await setPortraitGallery(loaded.playerId, loaded.character.id, gallery.files, fileName);
  return { ok: true, active: fileName };
}

async function ownedFromForm(formData: FormData): Promise<
  | {
      ok: true;
      playerId: string;
      entry: NonNullable<Awaited<ReturnType<typeof getOwnedCharacter>>>;
      character: Character;
    }
  | ActionFailure
> {
  const player = await currentPlayer();
  if (!player) {
    return { ok: false, message: "Choose who you are before changing pictures." };
  }
  const characterId = stringField(formData, "characterId");
  const entry = await getOwnedCharacter(player.id, characterId);
  if (!entry) {
    return { ok: false, message: "That character is not yours to change." };
  }
  return { ok: true, playerId: player.id, entry, character: entry.character };
}

async function imageFromForm(
  formData: FormData,
  field: string,
): Promise<{ ok: true; bytes: Uint8Array; kind: SheetImageKind } | ActionFailure> {
  const file = formData.get(field);
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Choose a picture." };
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = sheetImageKind(bytes);
  if (!kind) {
    return {
      ok: false,
      message: "The picture must be JPEG, PNG, or WebP, and at most 8 MB. HEIC from an iPhone needs to be saved as JPEG.",
    };
  }
  return { ok: true, bytes, kind };
}

function pageNumber(value: FormDataEntryValue | null): 1 | 2 | 3 | 4 | null {
  if (value === "1" || value === "2" || value === "3" || value === "4") {
    return Number(value) as 1 | 2 | 3 | 4;
  }
  return null;
}

function stringField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}
