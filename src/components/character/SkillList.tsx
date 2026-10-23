import { ABILITY_SHORT, SKILL_CATALOG } from "@/domain/catalog";
import { formatModifier } from "@/domain/format";
import type { Character } from "@/domain/schema";
import { SKILL_IDS } from "@/domain/schema";
import { skillModifier } from "@/domain/rules/skills";

export function SkillList({ character }: { character: Character }) {
  return (
    <section className="panel" aria-labelledby="skills-heading">
      <h2 id="skills-heading">Skills</h2>
      <ul className="skill-list">
        {SKILL_IDS.map((skill) => {
          const trained = character.skillProficiencies.includes(skill);
          const detail = SKILL_CATALOG[skill];
          return (
            <li key={skill}>
              <span className={trained ? "pip pip-on" : "pip"} aria-hidden="true" />
              <span>
                {detail.label}
                <span className="skill-ability"> {ABILITY_SHORT[detail.ability]}</span>
                <span className="sr-only">{trained ? ", proficient" : ""}</span>
              </span>
              <span className="skill-mod">{formatModifier(skillModifier(character, skill))}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
