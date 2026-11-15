"use client";

import { useCopy } from "@/components/providers/LocaleProvider";

export function PortraitMark({ name }: { name: string }) {
  const t = useCopy();
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();

  return (
    <div className="portrait-mark" role="img" aria-label={`${t.home.portraitOf} ${name}`}>
      <span>{initials || "?"}</span>
    </div>
  );
}
