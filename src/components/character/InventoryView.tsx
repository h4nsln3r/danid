"use client";

import { useId, useState, type ReactNode } from "react";
import { SLOT_LABELS, SOURCE_LABELS } from "@/domain/catalog";
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

export function InventoryView({
  source,
  canEdit,
}: {
  source: Character;
  canEdit: boolean;
}) {
  const character = useLiveCharacter(source, canEdit);
  const { equip, stow } = useCharacterLibrary();
  const [query, setQuery] = useState("");
  const searchId = useId();

  if (!character) {
    return (
      <section className="error-state" role="alert">
        <h1>This equipment is missing</h1>
        <p>There is no character with that id.</p>
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
        <h1>Equipment</h1>
        <p className="identity-meta">
          {formatWeight(totalWeightLb(character))} carried. Carrying Capacity{" "}
          {formatWeight(carryingCapacity(character))}.
        </p>
      </header>

      <form
        className="search-form"
        role="search"
        onSubmit={(event) => event.preventDefault()}
      >
        <label htmlFor={searchId}>Search equipment</label>
        <input
          id={searchId}
          className="field"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Shield, rope, arrows"
        />
      </form>

      <div className="inventory-grid">
        <section className="panel" aria-labelledby="worn-heading">
          <h2 id="worn-heading">Worn</h2>
          {worn.length === 0 ? (
            <div className="empty-state">
              <p className="empty-title">Nothing worn matches</p>
              <p>Clear the search or choose another word.</p>
            </div>
          ) : (
            <ul className="gear-list">
              {worn.map(({ slot, item }) => (
                <GearRow
                  key={slot}
                  item={item}
                  eyebrow={SLOT_LABELS[slot]}
                  action={
                    canEdit ? (
                      <button
                        type="button"
                        className="btn"
                        onClick={() => stow(character.id, slot)}
                      >
                        Stow {item.name}
                      </button>
                    ) : null
                  }
                />
              ))}
            </ul>
          )}
        </section>

        <section className="panel" aria-labelledby="pack-heading">
          <h2 id="pack-heading">Carried</h2>
          {pack.length === 0 ? (
            <div className="empty-state">
              <p className="empty-title">
                {needle ? "Nothing carried matches" : "Nothing is carried"}
              </p>
              <p>
                {needle
                  ? "Try a shorter search, or clear the field to see every carried item."
                  : "Every item is worn, or no equipment has been filled in."}
              </p>
            </div>
          ) : (
            <ul className="gear-list">
              {pack.map((item) => (
                <GearRow
                  key={item.id}
                  item={item}
                  eyebrow={item.slots.length === 0 ? "Carried, not worn" : "Not worn"}
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
                            Equip to {SLOT_LABELS[slot]}
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
          {SOURCE_LABELS[item.source]}
          {weight === undefined ? "" : ` · ${formatWeight(weight)}`}
        </p>
      </div>
      {action}
    </li>
  );
}
