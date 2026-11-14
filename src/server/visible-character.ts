import { getCharacter } from "@/domain/characters";
import type { Character } from "@/domain/schema";
import { getOwnedCharacter } from "@/server/library-store";
import { currentPlayerId } from "@/server/players";

export async function loadVisibleCharacter(
  characterId: string,
): Promise<Character | undefined> {
  const sample = getCharacter(characterId);
  if (sample) {
    return sample;
  }
  const playerId = await currentPlayerId();
  if (!playerId) {
    return undefined;
  }
  const stored = await getOwnedCharacter(playerId, characterId);
  return stored?.character;
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

export async function visiblePortraitFile(characterId: string): Promise<string | undefined> {
  if (getCharacter(characterId)) {
    return undefined;
  }
  const playerId = await currentPlayerId();
  if (!playerId) {
    return undefined;
  }
  const stored = await getOwnedCharacter(playerId, characterId);
  return stored?.portraitFile ?? undefined;
}
