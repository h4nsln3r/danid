"use server";

import { z } from "zod";
import { updatePlayTotals } from "@/server/library-store";
import { currentPlayer } from "@/server/players";

const playTotalsSchema = z.object({
  characterId: z.string().regex(/^[a-z0-9-]+$/),
  hitPoints: z.number().int().min(0).max(9999),
  arrows: z.number().int().min(0).max(999),
});

export async function savePlayTotals(
  characterId: string,
  hitPoints: number,
  arrows: number,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const parsed = playTotalsSchema.safeParse({ characterId, hitPoints, arrows });
  if (!parsed.success) {
    return { ok: false, message: "Enter a whole number for hit points and arrows." };
  }
  const player = await currentPlayer();
  if (!player) {
    return { ok: false, message: "Choose your name before changing a character." };
  }
  try {
    await updatePlayTotals(
      player.id,
      parsed.data.characterId,
      parsed.data.hitPoints,
      parsed.data.arrows,
    );
    return { ok: true };
  } catch {
    return { ok: false, message: "Those numbers could not be saved." };
  }
}
