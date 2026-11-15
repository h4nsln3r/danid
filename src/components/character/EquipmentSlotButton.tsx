"use client";

import { slotName } from "@/domain/locale";
import type { EquipmentSlotId, InventoryItem } from "@/domain/schema";
import { SlotIcon } from "@/components/character/SlotIcon";
import { useCopy, useLocale } from "@/components/providers/LocaleProvider";

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
  const t = useCopy();
  const locale = useLocale();
  const label = slotName(locale, slot);
  const worn = item?.name ?? t.gear.empty;

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
