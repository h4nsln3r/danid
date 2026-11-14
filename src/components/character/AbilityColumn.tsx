import { ABILITY_LABELS, ABILITY_SHORT } from "@/domain/catalog";
import { formatModifier } from "@/domain/format";
import type { Character } from "@/domain/schema";
import { abilityLabelOrder, abilityModifier } from "@/domain/rules/abilities";

export function AbilityColumn({ character }: { character: Character }) {
  return (
    <section className="panel" aria-labelledby="abilities-heading">
      <h2 id="abilities-heading">Ability Scores</h2>
      <ul className="ability-list">
        {abilityLabelOrder().map((ability) => {
          const score = character.abilityScores[ability];
          const modifier = abilityModifier(score);
          return (
            <li key={ability} className="ability">
              <span className="ability-name">
                <abbr title={ABILITY_LABELS[ability]}>{ABILITY_SHORT[ability]}</abbr>
              </span>
              <span className="ability-mod">{formatModifier(modifier)}</span>
              <span className="ability-score">Score {score}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
