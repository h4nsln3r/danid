"use client";

import { abilityName, abilityShort } from "@/domain/locale";
import { formatModifier } from "@/domain/format";
import type { Character } from "@/domain/schema";
import { abilityLabelOrder, abilityModifier } from "@/domain/rules/abilities";
import { useCopy, useLocale } from "@/components/providers/LocaleProvider";

export function AbilityColumn({ character }: { character: Character }) {
  const t = useCopy();
  const locale = useLocale();
  return (
    <section className="panel" aria-labelledby="abilities-heading">
      <h2 id="abilities-heading">{t.sheet.abilityScores}</h2>
      <ul className="ability-list">
        {abilityLabelOrder().map((ability) => {
          const score = character.abilityScores[ability];
          const modifier = abilityModifier(score);
          return (
            <li key={ability} className="ability">
              <span className="ability-name">
                <abbr title={abilityName(locale, ability)}>{abilityShort(locale, ability)}</abbr>
              </span>
              <span className="ability-mod">{formatModifier(modifier)}</span>
              <span className="ability-score">{t.sheet.score} {score}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
