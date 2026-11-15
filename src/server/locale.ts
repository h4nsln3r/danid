import { cookies } from "next/headers";
import { isLocale, type Locale } from "@/domain/locale";

export const LOCALE_COOKIE = "danid_locale";

export async function currentLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : "en";
}
