"use server";

import { redirect } from "next/navigation";
import { addPlayer, getPlayer } from "@/server/library-store";
import { clearPlayerCookie, setPlayerCookie } from "@/server/players";

export async function createPlayer(formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "").trim().replace(/\s+/g, " ");
  if (name.length < 1 || name.length > 40) {
    redirect("/?error=name");
  }
  const player = await addPlayer(name);
  await setPlayerCookie(player.id);
  redirect("/");
}

export async function choosePlayer(formData: FormData): Promise<void> {
  const id = String(formData.get("playerId") ?? "");
  const player = await getPlayer(id);
  if (!player) {
    redirect("/");
  }
  await setPlayerCookie(player.id);
  redirect("/");
}

export async function leavePlayer(): Promise<void> {
  await clearPlayerCookie();
  redirect("/");
}
