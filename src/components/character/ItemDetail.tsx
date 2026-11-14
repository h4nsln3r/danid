import { SLOT_LABELS, SOURCE_LABELS } from "@/domain/catalog";
import { formatWeight, itemWeightLb, weaponDetailLines } from "@/domain/format";
import type { Character, EquipmentSlotId } from "@/domain/schema";
import { equippedItem, itemsForSlot, slotOfItem } from "@/domain/rules/equipment";

export function ItemDetail({
  character,
  slot,
  onEquip,
  onStow,
}: {
  character: Character;
  slot: EquipmentSlotId;
  onEquip: (itemId: string, slot: EquipmentSlotId) => void;
  onStow: (slot: EquipmentSlotId) => void;
}) {
  const item = equippedItem(character, slot);
  const alternatives = itemsForSlot(character, slot);
  const label = SLOT_LABELS[slot];

  return (
    <section
      className="panel"
      id="equipped-item-detail"
      aria-labelledby="detail-heading"
    >
      <h2 id="detail-heading">
        {label}
        <span className="feature-source">{item ? item.name : "Empty"}</span>
      </h2>
      {item ? (
        <ItemBody itemId={item.id} character={character} />
      ) : (
        <p>Nothing is worn here.</p>
      )}
      {item ? (
        <div className="button-row">
          <button type="button" className="btn" onClick={() => onStow(slot)}>
            Stow {item.name}
          </button>
        </div>
      ) : null}
      {alternatives.length > 0 ? (
        <div className="alternative-list">
          <h3>Other items for this slot</h3>
          <ul>
            {alternatives.map((candidate) => {
              const wornAt = slotOfItem(character, candidate.id);
              const action = wornAt
                ? `Move ${candidate.name} here`
                : `Equip ${candidate.name}`;
              return (
                <li key={candidate.id}>
                  <span>{candidate.name}</span>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => onEquip(candidate.id, slot)}
                  >
                    {action}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <p className="fine-print">No carried item fits this slot.</p>
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
  const item = character.items.find((entry) => entry.id === itemId);
  if (!item) {
    return <p>That item is missing from this character.</p>;
  }
  const weight = itemWeightLb(item);

  return (
    <>
      <p>{item.description}</p>
      <ul className="meta-list">
        <li>{SOURCE_LABELS[item.source]}</li>
        {weight === undefined ? <li>Weight unlisted</li> : <li>{formatWeight(weight)}</li>}
        {item.quantity > 1 ? <li>Quantity {item.quantity}</li> : null}
      </ul>
      {item.weapon ? (
        <ul className="meta-list">
          {weaponDetailLines(item.weapon).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : null}
      {item.armor ? (
        <p className="fine-print">
          {item.armor.category === "shield"
            ? `Shield, +${item.armor.baseAc} armor class.`
            : `${item.armor.category} armor, base armor class ${item.armor.baseAc}.`}
        </p>
      ) : null}
    </>
  );
}
