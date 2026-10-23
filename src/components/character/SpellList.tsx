import { ABILITY_LABELS } from "@/domain/catalog";
import { formatModifier } from "@/domain/format";
import type { Character } from "@/domain/schema";
import { spellAttackBonus, spellSaveDc } from "@/domain/rules/combat";

export function SpellList({ character }: { character: Character }) {
  const casting = character.spellcasting;
  if (!casting) {
    return (
      <section className="panel" aria-labelledby="spells-heading">
        <h2 id="spells-heading">Spells</h2>
        <p>This character has no spellcasting.</p>
      </section>
    );
  }

  const saveDc = spellSaveDc(character);
  const attack = spellAttackBonus(character);

  return (
    <section className="panel" aria-labelledby="spells-heading">
      <h2 id="spells-heading">Spells</h2>
      <p className="fine-print">
        Ranger spells from the 2014 Player&apos;s Handbook. The lines below are
        short reminders, and the slots are shown full.
      </p>
      <dl className="stat-grid">
        <div>
          <dt>Ability</dt>
          <dd>{ABILITY_LABELS[casting.ability]}</dd>
        </div>
        <div>
          <dt>Save DC</dt>
          <dd>{saveDc}</dd>
        </div>
        <div>
          <dt>Spell attack</dt>
          <dd>{attack === null ? "—" : formatModifier(attack)}</dd>
        </div>
      </dl>
      <ul className="slot-pips">
        {casting.slots.map((slot) => (
          <li key={slot.level}>
            <span>
              Level {slot.level}, {slot.total} {slot.total === 1 ? "slot" : "slots"}
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
              <span className="feature-source">Level {spell.level}</span>
            </h3>
            <p>{spell.summary}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
