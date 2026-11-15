"use client";

import { useId, useState, type ReactNode } from "react";
import { slotName, sourceName } from "@/domain/locale";
import { formatWeight, itemWeightLb } from "@/domain/format";
import type { Character, InventoryItem } from "@/domain/schema";
import { EQUIPMENT_SLOT_IDS } from "@/domain/schema";
import {
  carriedItems,
  carryingCapacity,
  equippedItem,
  totalWeightLb,
} from "@/domain/rules/equipment";
import {
  useCharacterLibrary,
  useLiveCharacter,
} from "@/components/providers/CharacterLibraryProvider";
import { useCopy, useLocale } from "@/components/providers/LocaleProvider";

export function InventoryView({
  source,
  canEdit,
}: {
  source: Character;
  canEdit: boolean;
}) {
  const character = useLiveCharacter(source, canEdit);
  const { equip, stow } = useCharacterLibrary();
  const t = useCopy();
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const searchId = useId();

  if (!character) {
    return (
      <section className="error-state" role="alert">
        <h1>{t.errors.unknown}</h1>
        <p>{t.errors.noCharacterHere}</p>
      </section>
    );
  }

  const needle = query.trim().toLowerCase();
  const matches = (item: InventoryItem) => {
    if (!needle) {
      return true;
    }
    return (
      item.name.toLowerCase().includes(needle) ||
      item.description.toLowerCase().includes(needle)
    );
  };

  const worn = EQUIPMENT_SLOT_IDS.flatMap((slot) => {
    const item = equippedItem(character, slot);
    return item && matches(item) ? [{ slot, item }] : [];
  });
  const pack = carriedItems(character).filter(matches);

  return (
    <article className="folio">
      <header className="identity">
        <p className="eyebrow">{character.name}</p>
        <h1>{t.gear.title}</h1>
        <p className="identity-meta">
          {formatWeight(totalWeightLb(character))} {t.gear.carried}. {t.gear.capacity}{" "}
          {formatWeight(carryingCapacity(character))}.
        </p>
      </header>

      <form
        className="search-form"
        role="search"
        onSubmit={(event) => event.preventDefault()}
      >
        <label htmlFor={searchId}>{t.gear.search}</label>
        <input
          id={searchId}
          className="field"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t.gear.placeholder}
        />
      </form>

      <div className="inventory-grid">
        <section className="panel" aria-labelledby="worn-heading">
          <h2 id="worn-heading">{t.gear.worn}</h2>
          {worn.length === 0 ? (
            <div className="empty-state">
              <p className="empty-title">{t.gear.nothingWorn}</p>
              <p>{t.gear.clearSearch}</p>
            </div>
          ) : (
            <ul className="gear-list">
              {worn.map(({ slot, item }) => (
                <GearRow
                  key={slot}
                  item={item}
                  eyebrow={slotName(locale, slot)}
                  action={
                    canEdit ? (
                      <button
                        type="button"
                        className="btn"
                        onClick={() => stow(character.id, slot)}
                      >
                        {t.gear.stow} {item.name}
                      </button>
                    ) : null
                  }
                />
              ))}
            </ul>
          )}
        </section>

        <section className="panel" aria-labelledby="pack-heading">
          <h2 id="pack-heading">{t.gear.pack}</h2>
          {pack.length === 0 ? (
            <div className="empty-state">
              <p className="empty-title">
                {needle ? t.gear.nothingCarried : t.gear.nothingHeld}
              </p>
              <p>
                {needle ? t.gear.shorter : t.gear.allWorn}
              </p>
            </div>
          ) : (
            <ul className="gear-list">
              {pack.map((item) => (
                <GearRow
                  key={item.id}
                  item={item}
                  eyebrow={item.slots.length === 0 ? t.gear.carriedOnly : t.gear.notWorn}
                  action={
                    !canEdit || item.slots.length === 0 ? null : (
                      <div className="button-row">
                        {item.slots.map((slot) => (
                          <button
                            key={slot}
                            type="button"
                            className="btn btn-primary"
                            onClick={() => equip(character.id, item.id, slot)}
                          >
                            {t.gear.equipTo} {slotName(locale, slot)}
                          </button>
                        ))}
                      </div>
                    )
                  }
                />
              ))}
            </ul>
          )}
        </section>
      </div>
    </article>
  );
}

function GearRow({
  item,
  eyebrow,
  action,
}: {
  item: InventoryItem;
  eyebrow: string;
  action: ReactNode;
}) {
  const locale = useLocale();
  const weight = itemWeightLb(item);
  return (
    <li className="gear-row">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h3>
          {item.name}
          {item.quantity > 1 ? ` × ${item.quantity}` : ""}
        </h3>
        <p>{item.description}</p>
        <p className="fine-print">
          {sourceName(locale, item.source)}
          {weight === undefined ? "" : ` · ${formatWeight(weight)}`}
        </p>
      </div>
      {action}
    </li>
  );
}
