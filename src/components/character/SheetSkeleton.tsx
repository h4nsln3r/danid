"use client";

import { useCopy } from "@/components/providers/LocaleProvider";

export function SheetSkeleton() {
  const t = useCopy();
  return (
    <div className="skeleton" aria-busy="true" aria-live="polite">
      <p>{t.loading.skeleton}</p>
      <div className="skeleton-grid">
        <div className="skeleton-block" />
        <div className="skeleton-block skeleton-tall" />
        <div className="skeleton-block" />
      </div>
    </div>
  );
}
