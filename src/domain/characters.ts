import { miraThorn } from "@/domain/sample/mira-thorn";
import { characterSchema, type Character } from "@/domain/schema";

const characters: readonly Character[] = [characterSchema.parse(miraThorn)];

export function listCharacters(): Character[] {
  return characters.map((character) => structuredClone(character));
}

export function getCharacter(id: string): Character | undefined {
  const character = characters.find((entry) => entry.id === id);
  return character ? structuredClone(character) : undefined;
}

export function hasCharacter(id: string): boolean {
  return characters.some((character) => character.id === id);
}
