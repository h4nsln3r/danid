"use server";

import { cookies } from "next/headers";
import { isLocale } from "@/domain/locale";
import { LOCALE_COOKIE } from "@/server/locale";

export async function setLocale(formData: FormData): Promise<void> {
  const value = String(formData.get("locale") ?? "");
  const locale = isLocale(value) ? value : "en";
  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}
