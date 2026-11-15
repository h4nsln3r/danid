"use client";

import { abilityShort, skillName } from "@/domain/locale";
import { formatModifier } from "@/domain/format";
import type { Character } from "@/domain/schema";
import { SKILL_IDS } from "@/domain/schema";
import { SKILL_CATALOG } from "@/domain/catalog";
import { skillModifier } from "@/domain/rules/skills";
import { useCopy, useLocale } from "@/components/providers/LocaleProvider";

export function SkillList({ character }: { character: Character }) {
  const t = useCopy();
  const locale = useLocale();
  return (
    <section className="panel" aria-labelledby="skills-heading">
      <h2 id="skills-heading">{t.create.skills}</h2>
      <ul className="skill-list">
        {SKILL_IDS.map((skill) => {
          const trained = character.skillProficiencies.includes(skill);
          const detail = SKILL_CATALOG[skill];
          return (
            <li key={skill}>
              <span className={trained ? "pip pip-on" : "pip"} aria-hidden="true" />
              <span>
                {skillName(locale, skill)}
                <span className="skill-ability"> {abilityShort(locale, detail.ability)}</span>
                <span className="sr-only">{trained ? `, ${t.sheet.proficient}` : ""}</span>
              </span>
              <span className="skill-mod">{formatModifier(skillModifier(character, skill))}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

