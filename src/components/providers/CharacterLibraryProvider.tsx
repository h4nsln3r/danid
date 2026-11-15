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
import { slotName } from "@/domain/locale";
import type { Character, EquipmentSlotId } from "@/domain/schema";
import { equipItem, stowItem } from "@/domain/rules/equipment";
import { arrowCount, withArrowCount, withHitPoints } from "@/domain/rules/play";
import { useCopy, useLocale } from "@/components/providers/LocaleProvider";

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
  setHitPoints: (characterId: string, hitPoints: number) => void;
  setArrows: (characterId: string, arrows: number) => void;
  ensure: (character: Character, editable?: boolean) => void;
  adopt: (character: Character) => void;
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
  const t = useCopy();
  const locale = useLocale();
  const [characters, setCharacters] = useState<Character[]>(() =>
    structuredClone(initialCharacters),
  );
  const [notice, setNotice] = useState<Notice | null>(null);
  const baselines = useRef(new Map<string, Character>());
  const editableIds = useRef(
    new Set(initialCharacters.map((character) => character.id)),
  );

  const refuseEdit = (characterId: string) => {
    if (editableIds.current.has(characterId)) {
      return false;
    }
    setNotice({
      tone: "error",
      text: t.library.onlyOwner,
    });
    return true;
  };

  const adopt = useCallback((character: Character) => {
    editableIds.current.add(character.id);
    baselines.current.set(character.id, structuredClone(character));
    setCharacters((current) =>
      current.map((item) => (item.id === character.id ? character : item)),
    );
  }, []);

  const ensure = useCallback((character: Character, editable = false) => {
    if (editable) {
      editableIds.current.add(character.id);
    }
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
    if (refuseEdit(characterId)) {
      return;
    }
    const character = characters.find((entry) => entry.id === characterId);
    if (!character) {
      setNotice({
        tone: "error",
        text: t.library.missing,
      });
      return;
    }

    const result = equipItem(character, itemId, slot, locale);
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
    const name = item?.name ?? t.library.item;
    const slotLabel = slotName(locale, slot).toLowerCase();
    let text = result.alreadyEquipped
      ? `${name} ${t.library.alreadyWorn} ${slotLabel} ${t.library.slot}.`
      : `${name} ${t.library.nowIn} ${slotLabel} ${t.library.slot}.`;
    if (displaced) {
      text += ` ${displaced.name} ${t.library.wentBack}`;
    }
    setNotice({ tone: "success", text });
  };

  const stow = (characterId: string, slot: EquipmentSlotId) => {
    if (refuseEdit(characterId)) {
      return;
    }
    const character = characters.find((entry) => entry.id === characterId);
    if (!character) {
      setNotice({
        tone: "error",
        text: t.library.missing,
      });
      return;
    }

    const result = stowItem(character, slot, locale);
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
      text: `${item?.name ?? t.library.theItem} ${t.library.backIn}`,
    });
  };

  const restore = (characterId: string) => {
    if (refuseEdit(characterId)) {
      return;
    }
    const original =
      initialCharacters.find((entry) => entry.id === characterId) ??
      baselines.current.get(characterId);
    if (!original) {
      setNotice({ tone: "error", text: t.library.noSaved });
      return;
    }
    setCharacters((current) =>
      current.map((entry) => {
        if (entry.id !== characterId) {
          return entry;
        }
        if (characterId === "mira-thorn") {
          return structuredClone(original);
        }
        return withHitPoints(
          withArrowCount(structuredClone(original), arrowCount(entry)),
          entry.currentHitPoints,
        );
      }),
    );
    setNotice({
      tone: "success",
      text:
        characterId === "mira-thorn"
          ? `${original.name} ${t.library.restoredSample}`
          : `${original.name}: ${t.library.restoredEquipment}`,
    });
  };

  const setHitPoints = (characterId: string, hitPoints: number) => {
    if (refuseEdit(characterId)) {
      return;
    }
    setCharacters((current) =>
      current.map((entry) =>
        entry.id === characterId ? withHitPoints(entry, hitPoints) : entry,
      ),
    );
  };

  const setArrows = (characterId: string, arrows: number) => {
    if (refuseEdit(characterId)) {
      return;
    }
    setCharacters((current) =>
      current.map((entry) =>
        entry.id === characterId ? withArrowCount(entry, arrows) : entry,
      ),
    );
  };

  return (
    <CharacterLibraryContext.Provider
      value={{
        characters,
        notice,
        equip,
        stow,
        restore,
        setHitPoints,
        setArrows,
        ensure,
        adopt,
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

export function useLiveCharacter(source: Character, editable = false): Character {
  const fromLibrary = useCharacter(source.id);
  const { ensure } = useCharacterLibrary();
  useLayoutEffect(() => {
    ensure(source, editable);
  }, [editable, ensure, source]);
  return fromLibrary ?? source;
}

export function LibraryNotice() {
  const { notice, dismissNotice } = useCharacterLibrary();
  const t = useCopy();
  if (!notice) {
    return null;
  }

  return (
    <div className={`notice notice-${notice.tone}`} role={notice.tone === "error" ? "alert" : "status"}>
      <p>{notice.text}</p>
      <button type="button" className="btn" onClick={dismissNotice}>
        {t.library.close}
      </button>
    </div>
  );
}
