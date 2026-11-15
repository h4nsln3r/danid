"use client";

import { slotName, sourceName, armorTrainingName } from "@/domain/locale";
import { formatWeight, itemWeightLb, weaponDetailLines } from "@/domain/format";
import type { Character, EquipmentSlotId } from "@/domain/schema";
import { equippedItem, itemsForSlot, slotOfItem } from "@/domain/rules/equipment";
import { useCopy, useLocale } from "@/components/providers/LocaleProvider";

export function ItemDetail({
  character,
  slot,
  canEdit,
  onEquip,
  onStow,
}: {
  character: Character;
  slot: EquipmentSlotId;
  canEdit: boolean;
  onEquip: (itemId: string, slot: EquipmentSlotId) => void;
  onStow: (slot: EquipmentSlotId) => void;
}) {
  const t = useCopy();
  const locale = useLocale();
  const item = equippedItem(character, slot);
  const alternatives = itemsForSlot(character, slot);
  const label = slotName(locale, slot);

  return (
    <section
      className="panel"
      id="equipped-item-detail"
      aria-labelledby="detail-heading"
    >
      <h2 id="detail-heading">
        {label}
        <span className="feature-source">{item ? item.name : t.gear.empty}</span>
      </h2>
      {item ? (
        <ItemBody itemId={item.id} character={character} />
      ) : (
        <p>{t.gear.nothingHere}</p>
      )}
      {item && canEdit ? (
        <div className="button-row">
          <button type="button" className="btn" onClick={() => onStow(slot)}>
            {t.gear.stow} {item.name}
          </button>
        </div>
      ) : null}
      {alternatives.length > 0 ? (
        <div className="alternative-list">
          <h3>{t.gear.otherItems}</h3>
          <ul>
            {alternatives.map((candidate) => {
              const wornAt = slotOfItem(character, candidate.id);
              const action = wornAt
                ? `${t.gear.moveHere} ${candidate.name} ${t.gear.here}`
                : `${t.gear.equip} ${candidate.name}`;
              return (
                <li key={candidate.id}>
                  <span>{candidate.name}</span>
                  {canEdit ? (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => onEquip(candidate.id, slot)}
                    >
                      {action}
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <p className="fine-print">{t.gear.noFit}</p>
      )}
      {canEdit ? null : (
        <p className="fine-print">
          {t.library.onlyOwner}
        </p>
      )}
    </section>
  );
}

function ItemBody({
  itemId,
  character,
}: {
  itemId: string;
  character: Character;
}) {
  const t = useCopy();
  const locale = useLocale();
  const item = character.items.find((entry) => entry.id === itemId);
  if (!item) {
    return <p>{t.gear.missingItem}</p>;
  }
  const weight = itemWeightLb(item);

  return (
    <>
      <p>{item.description}</p>
      <ul className="meta-list">
        <li>{sourceName(locale, item.source)}</li>
        {weight === undefined ? <li>{t.gear.weightUnlisted}</li> : <li>{formatWeight(weight)}</li>}
        {item.quantity > 1 ? <li>{t.gear.quantity} {item.quantity}</li> : null}
      </ul>
      {item.weapon ? (
        <ul className="meta-list">
          {weaponDetailLines(item.weapon, locale).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : null}
      {item.armor ? (
        <p className="fine-print">
          {item.armor.category === "shield"
            ? `${locale === "sv" ? "Sköld" : "Shield"}, +${item.armor.baseAc} ${locale === "sv" ? "rustningsklass" : "armor class"}.`
            : `${armorTrainingName(locale, item.armor.category)}, ${locale === "sv" ? "grundvärde" : "base armor class"} ${item.armor.baseAc}.`}
        </p>
      ) : null}
    </>
  );
}
