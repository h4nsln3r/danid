import { SLOT_LABELS } from "@/domain/catalog";
import type { EquipmentSlotId, InventoryItem } from "@/domain/schema";
import { SlotIcon } from "@/components/character/SlotIcon";

export function EquipmentSlotButton({
  slot,
  item,
  selected,
  onSelect,
}: {
  slot: EquipmentSlotId;
  item: InventoryItem | undefined;
  selected: boolean;
  onSelect: (slot: EquipmentSlotId) => void;
}) {
  const label = SLOT_LABELS[slot];
  const worn = item?.name ?? "Empty";

  return (
    <button
      type="button"
      className={item ? "slot" : "slot slot-empty"}
      aria-pressed={selected}
      aria-controls="equipped-item-detail"
      onClick={() => onSelect(slot)}
    >
      <SlotIcon slot={slot} />
      <span className="slot-copy">
        <span className="slot-label">{label}</span>
        <span className="slot-item">{worn}</span>
      </span>
    </button>
  );
}
