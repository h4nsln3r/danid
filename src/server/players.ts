import { cookies } from "next/headers";
import { getPlayer, type Player } from "@/server/library-store";

export const PLAYER_COOKIE = "danid_player";

export async function currentPlayerId(): Promise<string | undefined> {
  const store = await cookies();
  const value = store.get(PLAYER_COOKIE)?.value;
  if (!value || !/^p-[a-f0-9]{8}$/.test(value)) {
    return undefined;
  }
  return value;
}

export async function currentPlayer(): Promise<Player | undefined> {
  const id = await currentPlayerId();
  if (!id) {
    return undefined;
  }
  return getPlayer(id);
}

export async function setPlayerCookie(playerId: string): Promise<void> {
  const store = await cookies();
  store.set(PLAYER_COOKIE, playerId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function clearPlayerCookie(): Promise<void> {
  const store = await cookies();
  store.delete(PLAYER_COOKIE);
}
