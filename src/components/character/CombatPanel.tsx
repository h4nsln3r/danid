import { ABILITY_LABELS, ABILITY_SHORT, SLOT_LABELS } from "@/domain/catalog";
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

export function CombatPanel({ character }: { character: Character }) {
  const ac = armorClass(character);
  const pace = speed(character);
  const hpRatio = Math.max(
    0,
    Math.min(100, (character.currentHitPoints / character.maxHitPoints) * 100),
  );
  const attacks = attackLines(character);
  const notes = combatNotes(character);

  return (
    <section className="panel" aria-labelledby="combat-heading">
      <h2 id="combat-heading">Combat</h2>
      <div className="ac-row">
        <p className="ac-medal">
          <span className="ac-value">{ac.total}</span>
          <span className="ac-label">Armor Class</span>
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
          <dt>Hit Points</dt>
          <dd>
            {character.currentHitPoints} / {character.maxHitPoints}
          </dd>
        </div>
        <div>
          <dt>Hit Dice</dt>
          <dd>
            {character.level}d{character.hitDie}
          </dd>
        </div>
        <div>
          <dt>Initiative</dt>
          <dd>{formatModifier(initiativeBonus(character))}</dd>
        </div>
        <div>
          <dt>Speed</dt>
          <dd>{pace.feet} ft.</dd>
        </div>
        <div>
          <dt>Proficiency Bonus</dt>
          <dd>{formatModifier(proficiencyBonus(character.level))}</dd>
        </div>
        <div>
          <dt>Passive Wisdom (Perception)</dt>
          <dd>{passiveScore(character, "perception")}</dd>
        </div>
      </dl>
      <div className="hp-track" aria-hidden="true">
        <span className="hp-fill" style={{ width: `${hpRatio}%` }} />
      </div>
      <p className="fine-print">Hit Points are not edited on this page.</p>
      {pace.note ? <p className="fine-print">{pace.note}</p> : null}

      <h3>Saving Throws</h3>
      <ul className="save-list">
        {abilityLabelOrder().map((ability) => {
          const trained = character.savingThrowProficiencies.includes(ability);
          return (
            <li key={ability}>
              <span className={trained ? "pip pip-on" : "pip"} aria-hidden="true" />
              <span>
                {ABILITY_SHORT[ability]}
                <span className="sr-only">
                  {trained
                    ? `, proficient ${ABILITY_LABELS[ability]}`
                    : `, ${ABILITY_LABELS[ability]}`}
                </span>
              </span>
              <span>{formatModifier(savingThrowModifier(character, ability))}</span>
            </li>
          );
        })}
      </ul>

      <h3>Attacks</h3>
      {attacks.length === 0 ? (
        <p className="fine-print">No weapon is wielded.</p>
      ) : (
        <ul className="attack-list">
          {attacks.map((attack) => (
            <li key={`${attack.slot}-${attack.itemId}`} className={attack.available ? "" : "is-unavailable"}>
              <span className="attack-name">{attack.name}</span>
              <span className="attack-slot">{SLOT_LABELS[attack.slot]}</span>
              <span className="attack-bonus">{formatModifier(attack.attackBonus)}</span>
              <span className="attack-damage">{attack.damage}</span>
              {attack.available ? null : (
                <span className="attack-reason">Unavailable. {attack.unavailableReason}</span>
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
