import { getCharacter } from "@/domain/characters";
import { canChangeCharacter } from "@/domain/ownership";
import type { Character } from "@/domain/schema";
import {
  getOwnedCharacter,
  getPlayer,
  getStoredCharacter,
  portraitGallery,
  sheetPageMap,
} from "@/server/library-store";
import { currentPlayerId } from "@/server/players";

export interface CharacterView {
  character: Character;
  canEdit: boolean;
  playedBy: string | null;
}

export async function loadCharacterView(
  characterId: string,
): Promise<CharacterView | undefined> {
  const sample = getCharacter(characterId);
  const playerId = await currentPlayerId();
  if (sample) {
    return { character: sample, canEdit: true, playedBy: null };
  }
  const stored = await getStoredCharacter(characterId);
  if (!stored) {
    return undefined;
  }
  const canEdit = canChangeCharacter({
    sample: false,
    ownerId: stored.ownerId,
    playerId: playerId ?? null,
  });
  const owner = canEdit ? undefined : await getPlayer(stored.ownerId);
  return {
    character: stored.character,
    canEdit,
    playedBy: canEdit ? null : (owner?.name ?? "another player"),
  };
}

export async function loadVisibleCharacter(
  characterId: string,
): Promise<Character | undefined> {
  const view = await loadCharacterView(characterId);
  return view?.character;
}

export async function visibleSheetFile(characterId: string): Promise<string | undefined> {
  if (getCharacter(characterId)) {
    return undefined;
  }
  const playerId = await currentPlayerId();
  if (!playerId) {
    return undefined;
  }
  const stored = await getOwnedCharacter(playerId, characterId);
  return stored?.sheetFile ?? undefined;
}

export async function ownedCharacter(characterId: string) {
  if (getCharacter(characterId)) {
    return undefined;
  }
  const playerId = await currentPlayerId();
  if (!playerId) {
    return undefined;
  }
  return getOwnedCharacter(playerId, characterId);
}

export async function visibleSceneFile(characterId: string): Promise<string | undefined> {
  if (getCharacter(characterId)) {
    return undefined;
  }
  const stored = await getStoredCharacter(characterId);
  return stored?.sceneFile ?? undefined;
}

export async function visiblePortraitFile(characterId: string): Promise<string | undefined> {
  if (getCharacter(characterId)) {
    return undefined;
  }
  const stored = await getStoredCharacter(characterId);
  return stored?.portraitFile ?? undefined;
}

export async function visiblePortraitGallery(
  characterId: string,
): Promise<{ files: string[]; active: string | null }> {
  if (getCharacter(characterId)) {
    return { files: [], active: null };
  }
  const stored = await getStoredCharacter(characterId);
  if (!stored) {
    return { files: [], active: null };
  }
  const gallery = portraitGallery(stored);
  const files = [...gallery.files];
  if (stored.sceneFile && !files.includes(stored.sceneFile)) {
    files.push(stored.sceneFile);
  }
  for (const page of Object.values(sheetPageMap(stored))) {
    if (page && !files.includes(page)) {
      files.push(page);
    }
  }
  return { files, active: gallery.active ?? files[0] ?? null };
}
