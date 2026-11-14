"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { buildCharacter, characterIdFromName } from "@/domain/build-character";
import { sheetImageKind } from "@/domain/image-kind";
import { hasCharacter } from "@/domain/characters";
import { blankSheet, parseSheetForm } from "@/domain/sheet";
import {
  addDraft,
  getDraft,
  newDraftId,
  removeDraft,
  saveCharacter,
  saveSheetFile,
  storedCharacterIdExists,
  updateDraft,
} from "@/server/library-store";
import { currentPlayer } from "@/server/players";
import { readCharacterSheet, SheetReaderError } from "@/server/sheet-reader";

interface ReadSheetSuccess {
  ok: true;
  draftId: string;
  values: ReturnType<typeof blankSheet>;
  notes: string[];
}

interface ActionFailure {
  ok: false;
  message: string;
}

async function imageFromForm(
  formData: FormData,
  field: string,
  emptyMessage: string,
): Promise<{ ok: true; bytes: Uint8Array; kind: "jpg" | "png" | "webp" } | ActionFailure> {
  const file = formData.get(field);
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: emptyMessage };
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

async function draftForUpload(playerId: string, requestedId: FormDataEntryValue | null) {
  if (typeof requestedId !== "string" || requestedId.length === 0) {
    return undefined;
  }
  return getDraft(playerId, requestedId);
}

export async function readSheet(
  formData: FormData,
): Promise<ReadSheetSuccess | ActionFailure> {
  const player = await currentPlayer();
  if (!player) {
    return { ok: false, message: "Choose who you are before the sheet is read." };
  }

  const image = await imageFromForm(
    formData,
    "sheet",
    "Choose a picture of the character sheet.",
  );
  if (!image.ok) {
    return image;
  }

  const existing = await draftForUpload(player.id, formData.get("draftId"));
  const draftId = existing?.id ?? newDraftId();
  const sheetFile = `${draftId}.${image.kind}`;
  await saveSheetFile(sheetFile, image.bytes);
  if (existing) {
    await updateDraft(player.id, draftId, { sheetFile });
  } else {
    await addDraft({ id: draftId, ownerId: player.id, sheetFile, portraitFile: null });
  }

  try {
    const reading = await readCharacterSheet(image.bytes, image.kind);
    return { ok: true, draftId, values: reading.values, notes: reading.notes };
  } catch (error) {
    const message =
      error instanceof SheetReaderError
        ? error.message
        : "The reading failed. Fill in the character sheet yourself.";
    return {
      ok: true,
      draftId,
      values: blankSheet(),
      notes: [message],
    };
  }
}

export async function savePortrait(
  formData: FormData,
): Promise<{ ok: true; draftId: string } | ActionFailure> {
  const player = await currentPlayer();
  if (!player) {
    return { ok: false, message: "Choose who you are before adding a portrait." };
  }

  const image = await imageFromForm(formData, "portrait", "Choose a picture of the character.");
  if (!image.ok) {
    return image;
  }

  const existing = await draftForUpload(player.id, formData.get("draftId"));
  const draftId = existing?.id ?? newDraftId();
  const portraitFile = `${draftId}-portrait.${image.kind}`;
  await saveSheetFile(portraitFile, image.bytes);
  if (existing) {
    await updateDraft(player.id, draftId, { portraitFile });
  } else {
    await addDraft({
      id: draftId,
      ownerId: player.id,
      sheetFile: null,
      portraitFile,
    });
  }
  return { ok: true, draftId };
}

export async function createCharacter(
  _previous: ActionFailure | null,
  formData: FormData,
): Promise<ActionFailure> {
  const player = await currentPlayer();
  if (!player) {
    return { ok: false, message: "Choose who you are before you create the character." };
  }

  const parsed = parseSheetForm(formData);
  if (!parsed.ok) {
    return parsed;
  }

  const draft = await getDraft(player.id, parsed.value.draftId);
  if (!draft) {
    return {
      ok: false,
      message: "The picture's draft is gone. Upload the character sheet again.",
    };
  }

  let id = characterIdFromName(parsed.value.name, randomBytes(4).toString("hex"));
  if (hasCharacter(id) || (await storedCharacterIdExists(id))) {
    id = characterIdFromName(parsed.value.name, randomBytes(4).toString("hex"));
  }

  const character = buildCharacter(parsed.value, id);
  await saveCharacter(player.id, character, draft.sheetFile, draft.portraitFile ?? null);
  await removeDraft(player.id, draft.id);
  redirect(`/characters/${character.id}`);
}
