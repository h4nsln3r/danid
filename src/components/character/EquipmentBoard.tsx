import type { Character, EquipmentSlotId } from "@/domain/schema";
import { EquipmentSlotButton } from "@/components/character/EquipmentSlotButton";
import { PortraitMark } from "@/components/character/PortraitMark";
import { RangerPortrait } from "@/components/character/RangerPortrait";
import { equippedItem } from "@/domain/rules/equipment";

const LEFT_SLOTS = [
  "head",
  "amulet",
  "gloves",
  "belt",
  "ring1",
  "mainHand",
] as const satisfies readonly EquipmentSlotId[];

const RIGHT_SLOTS = [
  "cloak",
  "armor",
  "bracers",
  "boots",
  "ring2",
  "offHand",
] as const satisfies readonly EquipmentSlotId[];

export function EquipmentBoard({
  character,
  selected,
  onSelect,
  samplePortrait,
  caption,
}: {
  character: Character;
  selected: EquipmentSlotId;
  onSelect: (slot: EquipmentSlotId) => void;
  samplePortrait: boolean;
  caption: string;
}) {
  return (
    <div className="equipment-stage">
      <div className="portrait-column">
        <figure className="portrait-frame">
          {samplePortrait ? <RangerPortrait /> : <PortraitMark name={character.name} />}
          <figcaption>{caption}</figcaption>
        </figure>
        <EquipmentSlotButton
          slot="ranged"
          item={equippedItem(character, "ranged")}
          selected={selected === "ranged"}
          onSelect={onSelect}
        />
      </div>
      <div className="slot-columns">
        <div className="slot-column slot-column-left">
          {LEFT_SLOTS.map((slot) => (
            <EquipmentSlotButton
              key={slot}
              slot={slot}
              item={equippedItem(character, slot)}
              selected={selected === slot}
              onSelect={onSelect}
            />
          ))}
        </div>
        <div className="slot-column slot-column-right">
          {RIGHT_SLOTS.map((slot) => (
            <EquipmentSlotButton
              key={slot}
              slot={slot}
              item={equippedItem(character, slot)}
              selected={selected === slot}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
