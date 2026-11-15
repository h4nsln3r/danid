"use client";

import { abilityName, abilityShort, slotName } from "@/domain/locale";
import { formatModifier } from "@/domain/format";
import type { Character } from "@/domain/schema";
import { abilityLabelOrder, proficiencyBonus } from "@/domain/rules/abilities";
import {
  armorClass,
  attackLines,
  combatNotes,
  initiativeBonus,
  speed,
} from "@/domain/rules/combat";
import { passiveScore, savingThrowModifier } from "@/domain/rules/skills";
import { useCopy, useLocale } from "@/components/providers/LocaleProvider";

export function CombatPanel({ character }: { character: Character }) {
  const t = useCopy();
  const locale = useLocale();
  const ac = armorClass(character, locale);
  const pace = speed(character, locale);
  const hpRatio = Math.max(
    0,
    Math.min(100, (character.currentHitPoints / character.maxHitPoints) * 100),
  );
  const attacks = attackLines(character, locale);
  const notes = combatNotes(character, locale);

  return (
    <section className="panel" aria-labelledby="combat-heading">
      <h2 id="combat-heading">{t.sheet.combat}</h2>
      <div className="ac-row">
        <p className="ac-medal">
          <span className="ac-value">{ac.total}</span>
          <span className="ac-label">{t.sheet.armorClass}</span>
        </p>
        <p className="ac-parts">{ac.parts.join(" + ")}</p>
      </div>
      {ac.warnings.length > 0 ? (
        <ul className="warning-list">
          {ac.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      ) : null}

      <dl className="stat-grid">
        <div>
          <dt>{t.sheet.hitPoints}</dt>
          <dd>
            {character.currentHitPoints} / {character.maxHitPoints}
          </dd>
        </div>
        <div>
          <dt>{t.sheet.hitDice}</dt>
          <dd>
            {character.level}d{character.hitDie}
          </dd>
        </div>
        <div>
          <dt>{t.sheet.initiative}</dt>
          <dd>{formatModifier(initiativeBonus(character))}</dd>
        </div>
        <div>
          <dt>{t.sheet.speed}</dt>
          <dd>{pace.feet} {t.sheet.feet}</dd>
        </div>
        <div>
          <dt>{t.sheet.proficiency}</dt>
          <dd>{formatModifier(proficiencyBonus(character.level))}</dd>
        </div>
        <div>
          <dt>{t.sheet.passive}</dt>
          <dd>{passiveScore(character, "perception")}</dd>
        </div>
      </dl>
      <div className="hp-track" aria-hidden="true">
        <span className="hp-fill" style={{ width: `${hpRatio}%` }} />
      </div>
      {pace.note ? <p className="fine-print">{pace.note}</p> : null}

      <h3>{t.sheet.saves}</h3>
      <ul className="save-list">
        {abilityLabelOrder().map((ability) => {
          const trained = character.savingThrowProficiencies.includes(ability);
          return (
            <li key={ability}>
              <span className={trained ? "pip pip-on" : "pip"} aria-hidden="true" />
              <span>
                {abilityShort(locale, ability)}
                <span className="sr-only">
                  {trained
                    ? `, ${t.sheet.proficient} ${abilityName(locale, ability)}`
                    : `, ${abilityName(locale, ability)}`}
                </span>
              </span>
              <span>{formatModifier(savingThrowModifier(character, ability))}</span>
            </li>
          );
        })}
      </ul>

      <h3>{t.sheet.attacks}</h3>
      {attacks.length === 0 ? (
        <p className="fine-print">{t.sheet.noWeapon}</p>
      ) : (
        <ul className="attack-list">
          {attacks.map((attack) => (
            <li key={`${attack.slot}-${attack.itemId}`} className={attack.available ? "" : "is-unavailable"}>
              <span className="attack-name">{attack.name}</span>
              <span className="attack-slot">{slotName(locale, attack.slot)}</span>
              <span className="attack-bonus">{formatModifier(attack.attackBonus)}</span>
              <span className="attack-damage">{attack.damage}</span>
              {attack.available ? null : (
                <span className="attack-reason">{t.sheet.unavailable} {attack.unavailableReason}</span>
              )}
              <span className="attack-notes">{attack.notes.join(" ")}</span>
            </li>
          ))}
        </ul>
      )}
      {notes.length > 0 ? (
        <ul className="note-list">
          {notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
