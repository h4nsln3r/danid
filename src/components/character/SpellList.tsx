import { ABILITY_LABELS } from "@/domain/catalog";
import { formatModifier } from "@/domain/format";
import type { Character } from "@/domain/schema";
import { spellAttackBonus, spellSaveDc } from "@/domain/rules/combat";

export function SpellList({ character }: { character: Character }) {
  const casting = character.spellcasting;
  if (!casting) {
    return (
      <section className="panel" aria-labelledby="spells-heading">
        <h2 id="spells-heading">Spellcasting</h2>
        <p>This character has no spellcasting.</p>
      </section>
    );
  }

  const saveDc = spellSaveDc(character);
  const attack = spellAttackBonus(character);

  return (
    <section className="panel" aria-labelledby="spells-heading">
      <h2 id="spells-heading">Spellcasting</h2>
      <p className="fine-print">
        Ranger spells from the 2014 Player&apos;s Handbook. The lines below are
        short reminders, and the slots are shown full.
      </p>
      <dl className="stat-grid">
        <div>
          <dt>Spellcasting Ability</dt>
          <dd>{ABILITY_LABELS[casting.ability]}</dd>
        </div>
        <div>
          <dt>Spell Save DC</dt>
          <dd>{saveDc}</dd>
        </div>
        <div>
          <dt>Spell Attack Modifier</dt>
          <dd>{attack === null ? "—" : formatModifier(attack)}</dd>
        </div>
      </dl>
      <ul className="slot-pips">
        {casting.slots.map((slot) => (
          <li key={slot.level}>
            <span>
              {spellLevelName(slot.level)}, {slot.total}{" "}
              {slot.total === 1 ? "slot" : "slots"}
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
              <span className="feature-source">{spellLevelName(spell.level)}</span>
            </h3>
            <p>{spell.summary}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function spellLevelName(level: number): string {
  if (level === 0) {
    return "Cantrip";
  }
  const suffix = level === 1 ? "st" : level === 2 ? "nd" : level === 3 ? "rd" : "th";
  return `${level}${suffix}-level`;
}
