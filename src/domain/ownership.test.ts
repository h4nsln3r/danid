import { describe, expect, it } from "vitest";
import { canChangeCharacter } from "@/domain/ownership";

describe("who can change a character", () => {
  it("lets the sample be tried by anyone", () => {
    expect(
      canChangeCharacter({ sample: true, ownerId: null, playerId: null }),
    ).toBe(true);
  });

  it("lets a player change a character they created", () => {
    expect(
      canChangeCharacter({
        sample: false,
        ownerId: "p-abcdef01",
        playerId: "p-abcdef01",
      }),
    ).toBe(true);
  });

  it("refuses a different player and a visitor with no name", () => {
    expect(
      canChangeCharacter({
        sample: false,
        ownerId: "p-abcdef01",
        playerId: "p-12345678",
      }),
    ).toBe(false);
    expect(
      canChangeCharacter({
        sample: false,
        ownerId: "p-abcdef01",
        playerId: null,
      }),
    ).toBe(false);
  });
});
