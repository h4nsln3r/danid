"use client";

import { abilityName } from "@/domain/locale";
import { formatModifier } from "@/domain/format";
import type { Character } from "@/domain/schema";
import { spellAttackBonus, spellSaveDc } from "@/domain/rules/combat";
import { useCopy, useLocale } from "@/components/providers/LocaleProvider";

export function SpellList({ character }: { character: Character }) {
  const t = useCopy();
  const locale = useLocale();
  const casting = character.spellcasting;
  if (!casting) {
    return (
      <section className="panel" aria-labelledby="spells-heading">
        <h2 id="spells-heading">{t.sheet.spells}</h2>
        <p>{t.sheet.noSpells}</p>
      </section>
    );
  }

  const saveDc = spellSaveDc(character);
  const attack = spellAttackBonus(character);

  return (
    <section className="panel" aria-labelledby="spells-heading">
      <h2 id="spells-heading">{t.sheet.spells}</h2>
      <p className="fine-print">{t.sheet.spellNote}</p>
      <dl className="stat-grid">
        <div>
          <dt>{t.sheet.spellAbility}</dt>
          <dd>{abilityName(locale, casting.ability)}</dd>
        </div>
        <div>
          <dt>{t.sheet.spellSave}</dt>
          <dd>{saveDc}</dd>
        </div>
        <div>
          <dt>{t.sheet.spellAttack}</dt>
          <dd>{attack === null ? "—" : formatModifier(attack)}</dd>
        </div>
      </dl>
      <ul className="slot-pips">
        {casting.slots.map((slot) => (
          <li key={slot.level}>
            <span>
              {spellLevelName(slot.level, t.sheet.cantrip, locale)}, {slot.total}{" "}
              {slot.total === 1 ? t.sheet.slotOne : t.sheet.slotMany}
            </span>
            <span className="pip-row" aria-hidden="true">
              {Array.from({ length: slot.total }, (_, index) => (
                <span key={index} className="pip pip-on" />
              ))}
            </span>
          </li>
        ))}
      </ul>
      <ul className="spell-list">
        {casting.known.map((spell) => (
          <li key={spell.name}>
            <h3>
              {spell.name}
              <span className="feature-source">{spellLevelName(spell.level, t.sheet.cantrip, locale)}</span>
            </h3>
            <p>{spell.summary}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function spellLevelName(level: number, cantrip: string, locale: "en" | "sv"): string {
  if (level === 0) {
    return cantrip;
  }
  if (locale === "sv") {
    return `nivå ${level}`;
  }
  const suffix = level === 1 ? "st" : level === 2 ? "nd" : level === 3 ? "rd" : "th";
  return `${level}${suffix}-level`;
}
