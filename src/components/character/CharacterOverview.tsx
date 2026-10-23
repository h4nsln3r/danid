"use client";

import { useState } from "react";
import { RULESET_LABELS } from "@/domain/catalog";
import type { Character, EquipmentSlotId } from "@/domain/schema";
import { AbilityColumn } from "@/components/character/AbilityColumn";
import { CombatPanel } from "@/components/character/CombatPanel";
import { EquipmentBoard } from "@/components/character/EquipmentBoard";
import { FeatureList } from "@/components/character/FeatureList";
import { ItemDetail } from "@/components/character/ItemDetail";
import { SkillList } from "@/components/character/SkillList";
import { SpellList } from "@/components/character/SpellList";
import {
  useCharacterLibrary,
  useLiveCharacter,
} from "@/components/providers/CharacterLibraryProvider";

export function CharacterOverview({ source }: { source: Character }) {
  const character = useLiveCharacter(source);
  const { equip, stow, restore } = useCharacterLibrary();
  const [selected, setSelected] = useState<EquipmentSlotId>("armor");

  if (!character) {
    return (
      <section className="error-state" role="alert">
        <h1>This folio is missing</h1>
        <p>The sample library has no character with that id.</p>
      </section>
    );
  }

  return (
    <article className="folio">
      <header className="identity">
        <p className="eyebrow">{RULESET_LABELS[character.ruleset]}</p>
        <h1>{character.name}</h1>
        <p className="identity-line">
          Level {character.level} {character.ancestry.toLowerCase()}{" "}
          {character.className.toLowerCase()}
          {character.subclass ? ` (${character.subclass})` : ""}
        </p>
        <p className="identity-meta">
          {character.alignment} · {character.background} ·{" "}
          {character.experiencePoints.toLocaleString("en-US")} XP
        </p>
        <p className="identity-meta">
          {character.languages.join(", ")}
          {character.toolProficiencies.length > 0
            ? ` · ${character.toolProficiencies.join(", ")}`
            : ""}
        </p>
        <div className="button-row">
          <button
            type="button"
            className="btn"
            onClick={() => restore(character.id)}
          >
            {character.id === "mira-thorn" ? "Restore sample" : "Återställ utrustning"}
          </button>
        </div>
      </header>

      <div className="folio-grid">
        <div className="area-abilities">
          <AbilityColumn character={character} />
        </div>
        <div className="area-stage">
          <section className="panel stage-panel" aria-label="Equipment slots">
            <p className="fine-print">
              Select a slot to inspect it. Tab and Enter reach every slot.
            </p>
            <EquipmentBoard
              character={character}
              selected={selected}
              onSelect={setSelected}
              samplePortrait={character.id === "mira-thorn"}
              caption={
                character.id === "mira-thorn"
                  ? "Hunter of the Greenholt"
                  : character.className
              }
            />
          </section>
        </div>
        <div className="area-combat">
          <CombatPanel character={character} />
        </div>
        <div className="area-detail">
          <ItemDetail
            character={character}
            slot={selected}
            onEquip={(itemId, slot) => equip(character.id, itemId, slot)}
            onStow={(slot) => stow(character.id, slot)}
          />
        </div>
        <div className="area-skills">
          <SkillList character={character} />
        </div>
        <div className="area-features">
          <FeatureList character={character} />
        </div>
        <div className="area-spells">
          <SpellList character={character} />
        </div>
        <div className="area-bio">
          <section className="panel" aria-labelledby="bio-heading">
            <h2 id="bio-heading">Notes</h2>
            <p>{character.biography}</p>
            <details className="notes">
              <summary>How this sheet was built</summary>
              <ul>
                {character.buildNotes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </details>
          </section>
        </div>
      </div>
    </article>
  );
}
