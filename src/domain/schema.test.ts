import { describe, expect, it } from "vitest";
import { miraThorn } from "@/domain/sample/mira-thorn";
import { characterSchema } from "@/domain/schema";
import { averageHitPoints } from "@/domain/rules/hit-points";
import { abilityModifier } from "@/domain/rules/abilities";

describe("character schema", () => {
  it("accepts the sample wood elf ranger", () => {
    const parsed = characterSchema.parse(miraThorn);
    expect(parsed.id).toBe("mira-thorn");
    expect(parsed.maxHitPoints).toBe(
      averageHitPoints(
        parsed.level,
        parsed.hitDie,
        abilityModifier(parsed.abilityScores.constitution),
      ),
    );
  });

  it("rejects the same item in two slots", () => {
    const result = characterSchema.safeParse({
      ...miraThorn,
      equipped: {
        ...miraThorn.equipped,
        offHand: "shortsword",
      },
    });
    expect(result.success).toBe(false);
  });

  it("rejects a weapon equipped as armor", () => {
    const result = characterSchema.safeParse({
      ...miraThorn,
      equipped: {
        ...miraThorn.equipped,
        armor: "shortsword",
      },
    });
    expect(result.success).toBe(false);
  });

  it("rejects a worn stack", () => {
    const result = characterSchema.safeParse({
      ...miraThorn,
      items: miraThorn.items.map((item) =>
        item.id === "shortsword" ? { ...item, quantity: 2 } : item,
      ),
    });
    expect(result.success).toBe(false);
  });
});
