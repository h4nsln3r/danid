import type { EquipmentSlotId } from "@/domain/schema";

export function SlotIcon({ slot }: { slot: EquipmentSlotId }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="slot-icon">
      <SlotGlyph slot={slot} />
    </svg>
  );
}

function SlotGlyph({ slot }: { slot: EquipmentSlotId }) {
  const stroke = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (slot) {
    case "head":
      return (
        <>
          <circle cx="12" cy="8" r="3.2" {...stroke} />
          <path d="M6 19c1.2-3 3.2-4.5 6-4.5S16.8 16 18 19" {...stroke} />
        </>
      );
    case "cloak":
      return <path d="M8 6h8l2 14H6L8 6z" {...stroke} />;
    case "amulet":
      return (
        <>
          <path d="M8 5c2 3 6 3 8 0" {...stroke} />
          <path d="M12 8l2.2 3.2L12 18l-2.2-6.8L12 8z" {...stroke} />
        </>
      );
    case "armor":
      return <path d="M7 6l5-2 5 2v6c0 4-2.2 6.4-5 8-2.8-1.6-5-4-5-8V6z" {...stroke} />;
    case "gloves":
      return <path d="M8 11V6.5M11 11V5M14 11V6.5M17 12V8c0 4 0 7-2 9H9c-2-1-2-4-1-8v3" {...stroke} />;
    case "bracers":
      return (
        <>
          <path d="M7 8h10v3H7zM8 14h8v3H8z" {...stroke} />
        </>
      );
    case "belt":
      return (
        <>
          <path d="M4 12h16" {...stroke} />
          <rect x="10" y="9" width="4" height="6" rx="0.6" {...stroke} />
        </>
      );
    case "boots":
      return <path d="M8 4h5v9l4 2v3H6v-4l2-2V4z" {...stroke} />;
    case "ring1":
    case "ring2":
      return <circle cx="12" cy="12" r="4.5" {...stroke} />;
    case "mainHand":
      return <path d="M12 3v12M9 19h6l-1-4H10l-1 4zM8 7l4-4 4 4" {...stroke} />;
    case "offHand":
      return <path d="M12 3l6 3v6c0 4.5-2.6 7.2-6 9-3.4-1.8-6-4.5-6-9V6l6-3z" {...stroke} />;
    case "ranged":
      return (
        <>
          <path d="M7 5c4 3 4 11 0 14" {...stroke} />
          <path d="M7 5l10 7L7 19" {...stroke} />
        </>
      );
    default:
      return null;
  }
}
