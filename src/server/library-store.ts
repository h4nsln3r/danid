import { randomBytes } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { withArrowCount, withHitPoints } from "@/domain/rules/play";
import { characterSchema, type Character } from "@/domain/schema";

const playerSchema = z.object({
  id: z.string().regex(/^p-[a-f0-9]{8}$/),
  name: z.string().min(1).max(40),
});

const imageName = z.string().regex(/^[a-z0-9-]+\.(jpg|png|webp)$/);

const sheetPagesSchema = z.object({
  "1": imageName.nullable(),
  "2": imageName.nullable(),
  "3": imageName.nullable(),
  "4": imageName.nullable(),
});

const storedCharacterSchema = z.object({
  ownerId: playerSchema.shape.id,
  sheetFile: imageName.nullable(),
  portraitFile: imageName.nullable().optional(),
  sheetPages: sheetPagesSchema.optional(),
  portraitFiles: z.array(imageName).max(8).optional(),
  sceneFile: imageName.nullable().optional(),
  character: characterSchema,
});

const draftSchema = z.object({
  id: z.string().regex(/^d-[a-f0-9]{8}$/),
  ownerId: playerSchema.shape.id,
  sheetFile: imageName.nullable(),
  portraitFile: imageName.nullable().optional(),
});

const librarySchema = z.object({
  players: z.array(playerSchema),
  characters: z.array(storedCharacterSchema),
  drafts: z.array(draftSchema),
});

export type Player = z.infer<typeof playerSchema>;
export type StoredCharacter = z.infer<typeof storedCharacterSchema>;
export type SheetDraft = z.infer<typeof draftSchema>;

const dataDir = path.join(process.cwd(), "data");
const libraryPath = path.join(dataDir, "library.json");
const sheetDir = path.join(dataDir, "sheets");

let chain: Promise<unknown> = Promise.resolve();

function withLibrary<T>(task: () => Promise<T>): Promise<T> {
  const run = chain.then(task, task);
  chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function readLibrary(): Promise<z.infer<typeof librarySchema>> {
  try {
    const text = await readFile(libraryPath, "utf8");
    return librarySchema.parse(JSON.parse(text));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return { players: [], characters: [], drafts: [] };
    }
    throw error;
  }
}

async function writeLibrary(library: z.infer<typeof librarySchema>): Promise<void> {
  await mkdir(dataDir, { recursive: true });
  const temporary = `${libraryPath}.${process.pid}.tmp`;
  await writeFile(temporary, JSON.stringify(library, null, 2), "utf8");
  await rename(temporary, libraryPath);
}

export function newPlayerId(): string {
  return `p-${randomBytes(4).toString("hex")}`;
}

export function newDraftId(): string {
  return `d-${randomBytes(4).toString("hex")}`;
}

export async function listPlayers(): Promise<Player[]> {
  const library = await readLibrary();
  return library.players;
}

export async function addPlayer(name: string): Promise<Player> {
  return withLibrary(async () => {
    const library = await readLibrary();
    const player = { id: newPlayerId(), name };
    library.players.push(player);
    await writeLibrary(library);
    return player;
  });
}

export async function getPlayer(id: string): Promise<Player | undefined> {
  const library = await readLibrary();
  return library.players.find((player) => player.id === id);
}

export async function listOwnedCharacters(ownerId: string): Promise<StoredCharacter[]> {
  const library = await readLibrary();
  return library.characters.filter((entry) => entry.ownerId === ownerId);
}

export interface CompanyCharacter {
  ownerId: string;
  ownerName: string;
  hasPortrait: boolean;
  character: Character;
}

export async function listCompany(): Promise<CompanyCharacter[]> {
  const library = await readLibrary();
  const names = new Map(library.players.map((player) => [player.id, player.name]));
  return library.characters
    .map((entry) => ({
      ownerId: entry.ownerId,
      ownerName: names.get(entry.ownerId) ?? "Unknown player",
      hasPortrait: Boolean(entry.portraitFile),
      character: entry.character,
    }))
    .sort((left, right) => {
      const byPlayer = left.ownerName.localeCompare(right.ownerName);
      return byPlayer === 0
        ? left.character.name.localeCompare(right.character.name)
        : byPlayer;
    });
}

export async function getStoredCharacter(
  characterId: string,
): Promise<StoredCharacter | undefined> {
  const library = await readLibrary();
  return library.characters.find((entry) => entry.character.id === characterId);
}

export async function storedCharacterIdExists(id: string): Promise<boolean> {
  const library = await readLibrary();
  return library.characters.some((entry) => entry.character.id === id);
}

export async function getOwnedCharacter(
  ownerId: string,
  characterId: string,
): Promise<StoredCharacter | undefined> {
  const library = await readLibrary();
  return library.characters.find(
    (entry) => entry.ownerId === ownerId && entry.character.id === characterId,
  );
}

export async function saveCharacter(
  ownerId: string,
  character: Character,
  sheetFile: string | null,
  portraitFile: string | null = null,
): Promise<void> {
  await withLibrary(async () => {
    const library = await readLibrary();
    const existing = library.characters.findIndex(
      (entry) => entry.character.id === character.id,
    );
    if (existing >= 0 && library.characters[existing]?.ownerId !== ownerId) {
      throw new Error("Character id belongs to another player.");
    }
    const record = { ownerId, sheetFile, portraitFile, character };
    if (existing >= 0) {
      library.characters[existing] = record;
    } else {
      library.characters.push(record);
    }
    await writeLibrary(library);
  });
}

export async function saveSheetFile(fileName: string, bytes: Uint8Array): Promise<void> {
  if (!/^[a-z0-9-]+\.(jpg|png|webp)$/.test(fileName)) {
    throw new Error("Unsafe sheet file name.");
  }
  await mkdir(sheetDir, { recursive: true });
  await writeFile(path.join(sheetDir, fileName), bytes);
}

export function sheetFilePath(fileName: string): string {
  if (!/^[a-z0-9-]+\.(jpg|png|webp)$/.test(fileName)) {
    throw new Error("Unsafe sheet file name.");
  }
  return path.join(sheetDir, fileName);
}

export async function updateDraft(
  ownerId: string,
  draftId: string,
  patch: Partial<Pick<SheetDraft, "sheetFile" | "portraitFile">>,
): Promise<void> {
  await withLibrary(async () => {
    const library = await readLibrary();
    const draft = library.drafts.find(
      (entry) => entry.id === draftId && entry.ownerId === ownerId,
    );
    if (!draft) {
      throw new Error("Draft is missing.");
    }
    if (patch.sheetFile !== undefined) {
      draft.sheetFile = patch.sheetFile;
    }
    if (patch.portraitFile !== undefined) {
      draft.portraitFile = patch.portraitFile;
    }
    await writeLibrary(library);
  });
}

export async function addDraft(draft: SheetDraft): Promise<void> {
  await withLibrary(async () => {
    const library = await readLibrary();
    library.drafts.push(draft);
    await writeLibrary(library);
  });
}

export async function getDraft(
  ownerId: string,
  draftId: string,
): Promise<SheetDraft | undefined> {
  const library = await readLibrary();
  return library.drafts.find((draft) => draft.id === draftId && draft.ownerId === ownerId);
}

export type SheetPageSlot = "1" | "2" | "3" | "4";

export function sheetPageMap(entry: StoredCharacter): Record<SheetPageSlot, string | null> {
  return {
    "1": entry.sheetPages?.["1"] ?? entry.sheetFile,
    "2": entry.sheetPages?.["2"] ?? null,
    "3": entry.sheetPages?.["3"] ?? null,
    "4": entry.sheetPages?.["4"] ?? null,
  };
}

export function portraitGallery(entry: StoredCharacter): { files: string[]; active: string | null } {
  const files = entry.portraitFiles?.length
    ? entry.portraitFiles
    : entry.portraitFile
      ? [entry.portraitFile]
      : [];
  const active =
    entry.portraitFile && files.includes(entry.portraitFile) ? entry.portraitFile : (files[0] ?? null);
  return { files, active };
}

export function characterOwnsFile(entry: StoredCharacter, fileName: string): boolean {
  const pages = sheetPageMap(entry);
  const portraits = portraitGallery(entry).files;
  return Object.values(pages).includes(fileName) || portraits.includes(fileName) || entry.sceneFile === fileName;
}

export async function setSheetPageFile(
  ownerId: string,
  characterId: string,
  page: SheetPageSlot,
  fileName: string,
): Promise<void> {
  await withLibrary(async () => {
    const library = await readLibrary();
    const entry = library.characters.find(
      (item) => item.ownerId === ownerId && item.character.id === characterId,
    );
    if (!entry) {
      throw new Error("Character is missing.");
    }
    const pages = sheetPageMap(entry);
    pages[page] = fileName;
    entry.sheetPages = pages;
    if (page === "1") {
      entry.sheetFile = fileName;
    }
    await writeLibrary(library);
  });
}

export async function updatePlayTotals(
  ownerId: string,
  characterId: string,
  hitPoints: number,
  arrows: number,
): Promise<Character> {
  return withLibrary(async () => {
    const library = await readLibrary();
    const entry = library.characters.find(
      (item) => item.ownerId === ownerId && item.character.id === characterId,
    );
    if (!entry) {
      throw new Error("Character is missing.");
    }
    entry.character = characterSchema.parse(
      withArrowCount(withHitPoints(entry.character, hitPoints), arrows),
    );
    await writeLibrary(library);
    return entry.character;
  });
}

export async function saveOwnedCharacter(
  ownerId: string,
  character: Character,
): Promise<void> {
  await withLibrary(async () => {
    const library = await readLibrary();
    const entry = library.characters.find(
      (item) => item.ownerId === ownerId && item.character.id === character.id,
    );
    if (!entry) {
      throw new Error("Character is missing.");
    }
    entry.character = character;
    await writeLibrary(library);
  });
}

export async function setPortraitGallery(
  ownerId: string,
  characterId: string,
  files: string[],
  active: string | null,
): Promise<void> {
  await withLibrary(async () => {
    const library = await readLibrary();
    const entry = library.characters.find(
      (item) => item.ownerId === ownerId && item.character.id === characterId,
    );
    if (!entry) {
      throw new Error("Character is missing.");
    }
    entry.portraitFiles = files.slice(0, 8);
    entry.portraitFile = active;
    await writeLibrary(library);
  });
}

export async function removeDraft(ownerId: string, draftId: string): Promise<void> {
  await withLibrary(async () => {
    const library = await readLibrary();
    library.drafts = library.drafts.filter(
      (draft) => !(draft.id === draftId && draft.ownerId === ownerId),
    );
    await writeLibrary(library);
  });
}
