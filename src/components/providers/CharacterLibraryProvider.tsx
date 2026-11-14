"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { SLOT_LABELS } from "@/domain/catalog";
import type { Character, EquipmentSlotId } from "@/domain/schema";
import { equipItem, stowItem } from "@/domain/rules/equipment";

interface Notice {
  tone: "success" | "error";
  text: string;
}

interface LibraryValue {
  characters: Character[];
  notice: Notice | null;
  equip: (characterId: string, itemId: string, slot: EquipmentSlotId) => void;
  stow: (characterId: string, slot: EquipmentSlotId) => void;
  restore: (characterId: string) => void;
  ensure: (character: Character) => void;
  dismissNotice: () => void;
}

const CharacterLibraryContext = createContext<LibraryValue | null>(null);

export function CharacterLibraryProvider({
  initialCharacters,
  children,
}: {
  initialCharacters: Character[];
  children: ReactNode;
}) {
  const [characters, setCharacters] = useState<Character[]>(() =>
    structuredClone(initialCharacters),
  );
  const [notice, setNotice] = useState<Notice | null>(null);
  const baselines = useRef(new Map<string, Character>());

  const ensure = useCallback((character: Character) => {
    if (!baselines.current.has(character.id)) {
      baselines.current.set(character.id, structuredClone(character));
    }
    setCharacters((current) =>
      current.some((entry) => entry.id === character.id)
        ? current
        : [...current, structuredClone(character)],
    );
  }, []);

  const equip = (characterId: string, itemId: string, slot: EquipmentSlotId) => {
    const character = characters.find((entry) => entry.id === characterId);
    if (!character) {
      setNotice({
        tone: "error",
        text: "That character is not in the library.",
      });
      return;
    }

    const result = equipItem(character, itemId, slot);
    if (!result.ok) {
      setNotice({ tone: "error", text: result.reason });
      return;
    }

    if (!result.alreadyEquipped) {
      setCharacters((current) =>
        current.map((entry) =>
          entry.id === characterId ? result.character : entry,
        ),
      );
    }

    const item = character.items.find((entry) => entry.id === itemId);
    const displaced = result.displacedItemId
      ? character.items.find((entry) => entry.id === result.displacedItemId)
      : undefined;
    const name = item?.name ?? "Item";
    const slotLabel = SLOT_LABELS[slot].toLowerCase();
    let text = result.alreadyEquipped
      ? `${name} is already worn in the ${slotLabel} slot.`
      : `${name} is now in the ${slotLabel} slot.`;
    if (displaced) {
      text += ` ${displaced.name} went back into your equipment.`;
    }
    setNotice({ tone: "success", text });
  };

  const stow = (characterId: string, slot: EquipmentSlotId) => {
    const character = characters.find((entry) => entry.id === characterId);
    if (!character) {
      setNotice({
        tone: "error",
        text: "That character is not in the library.",
      });
      return;
    }

    const result = stowItem(character, slot);
    if (!result.ok) {
      setNotice({ tone: "error", text: result.reason });
      return;
    }

    setCharacters((current) =>
      current.map((entry) =>
        entry.id === characterId ? result.character : entry,
      ),
    );
    const item = character.items.find(
      (entry) => entry.id === result.displacedItemId,
    );
    setNotice({
      tone: "success",
      text: `${item?.name ?? "The item"} is back in your equipment.`,
    });
  };

  const restore = (characterId: string) => {
    const original =
      initialCharacters.find((entry) => entry.id === characterId) ??
      baselines.current.get(characterId);
    if (!original) {
      setNotice({ tone: "error", text: "There is no saved version to restore." });
      return;
    }
    setCharacters((current) =>
      current.map((entry) =>
        entry.id === characterId ? structuredClone(original) : entry,
      ),
    );
    setNotice({
      tone: "success",
      text:
        characterId === "mira-thorn"
          ? `${original.name} is restored to the sample.`
          : `${original.name}'s equipment is restored.`,
    });
  };

  return (
    <CharacterLibraryContext.Provider
      value={{
        characters,
        notice,
        equip,
        stow,
        restore,
        ensure,
        dismissNotice: () => setNotice(null),
      }}
    >
      {children}
    </CharacterLibraryContext.Provider>
  );
}

export function useCharacterLibrary(): LibraryValue {
  const value = useContext(CharacterLibraryContext);
  if (!value) {
    throw new Error("Character library is unavailable.");
  }
  return value;
}

export function useCharacter(characterId: string): Character | undefined {
  return useCharacterLibrary().characters.find(
    (character) => character.id === characterId,
  );
}

export function useLiveCharacter(source: Character): Character {
  const fromLibrary = useCharacter(source.id);
  const { ensure } = useCharacterLibrary();
  useLayoutEffect(() => {
    if (!fromLibrary) {
      ensure(source);
    }
  }, [ensure, fromLibrary, source]);
  return fromLibrary ?? source;
}

export function LibraryNotice() {
  const { notice, dismissNotice } = useCharacterLibrary();
  if (!notice) {
    return null;
  }

  return (
    <div className={`notice notice-${notice.tone}`} role={notice.tone === "error" ? "alert" : "status"}>
      <p>{notice.text}</p>
      <button type="button" className="btn" onClick={dismissNotice}>
        Close
      </button>
    </div>
  );
}
