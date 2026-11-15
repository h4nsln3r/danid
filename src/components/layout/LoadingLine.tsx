"use client";

import { useCopy } from "@/components/providers/LocaleProvider";

export function LoadingLine({
  label,
}: {
  label: "home" | "company" | "form" | "sheet";
}) {
  const t = useCopy();
  return <p className="loading-line">{t.loading[label]}</p>;
}
