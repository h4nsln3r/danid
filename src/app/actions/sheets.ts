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

export async function readSheet(
  formData: FormData,
): Promise<ReadSheetSuccess | ActionFailure> {
  const player = await currentPlayer();
  if (!player) {
    return { ok: false, message: "Välj vem du är innan du läser in ett blad." };
  }

  const file = formData.get("sheet");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Välj en bild av karaktärsbladet." };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = sheetImageKind(bytes);
  if (!kind) {
    return {
      ok: false,
      message: "Bilden måste vara JPEG, PNG eller WebP, och högst 8 MB. HEIC från iPhone behöver sparas om till JPEG.",
    };
  }

  const draftId = newDraftId();
  const sheetFile = `${draftId}.${kind}`;
  await saveSheetFile(sheetFile, bytes);
  await addDraft({ id: draftId, ownerId: player.id, sheetFile });

  try {
    const reading = await readCharacterSheet(bytes, kind);
    return { ok: true, draftId, values: reading.values, notes: reading.notes };
  } catch (error) {
    const message =
      error instanceof SheetReaderError
        ? error.message
        : "Läsningen misslyckades. Fyll i bladet själv.";
    return {
      ok: true,
      draftId,
      values: blankSheet(),
      notes: [message],
    };
  }
}

export async function createCharacter(
  _previous: ActionFailure | null,
  formData: FormData,
): Promise<ActionFailure> {
  const player = await currentPlayer();
  if (!player) {
    return { ok: false, message: "Välj vem du är innan du skapar karaktären." };
  }

  const parsed = parseSheetForm(formData);
  if (!parsed.ok) {
    return parsed;
  }

  const draft = await getDraft(player.id, parsed.value.draftId);
  if (!draft) {
    return {
      ok: false,
      message: "Bildens utkast finns inte kvar. Ladda upp bladet igen.",
    };
  }

  let id = characterIdFromName(parsed.value.name, randomBytes(4).toString("hex"));
  if (hasCharacter(id) || (await storedCharacterIdExists(id))) {
    id = characterIdFromName(parsed.value.name, randomBytes(4).toString("hex"));
  }

  const character = buildCharacter(parsed.value, id);
  await saveCharacter(player.id, character, draft.sheetFile);
  await removeDraft(player.id, draft.id);
  redirect(`/characters/${character.id}`);
}
