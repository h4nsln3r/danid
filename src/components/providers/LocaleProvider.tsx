"use client";

import { createContext, useContext, type ReactNode } from "react";
import { copyFor, type Copy } from "@/domain/copy";
import type { Locale } from "@/domain/locale";

const LocaleContext = createContext<Locale>("en");

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

export function useCopy(): Copy {
  return copyFor(useLocale());
}
