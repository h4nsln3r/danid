"use client";

import { useState } from "react";
import { rulesetName } from "@/domain/locale";
import type { Character, EquipmentSlotId } from "@/domain/schema";
import { AbilityColumn } from "@/components/character/AbilityColumn";
import { CombatPanel } from "@/components/character/CombatPanel";
import { EquipmentBoard } from "@/components/character/EquipmentBoard";
import { FeatureList } from "@/components/character/FeatureList";
import { ItemDetail } from "@/components/character/ItemDetail";
import { PlayBar } from "@/components/character/PlayBar";
import { PortraitGallery } from "@/components/character/PortraitGallery";
import { PortraitMark } from "@/components/character/PortraitMark";
import { RangerPortrait } from "@/components/character/RangerPortrait";
import { SkillList } from "@/components/character/SkillList";
import { SpellList } from "@/components/character/SpellList";
import { useCopy, useLocale } from "@/components/providers/LocaleProvider";
import {
  useCharacterLibrary,
  useLiveCharacter,
} from "@/components/providers/CharacterLibraryProvider";

export function CharacterOverview({
  source,
  portraitUrl,
  portraitUrls = [],
  sceneUrl,
  canEdit,
  playedBy,
  rememberPlay,
}: {
  source: Character;
  portraitUrl?: string;
  portraitUrls?: string[];
  sceneUrl?: string;
  canEdit: boolean;
  playedBy?: string | null;
  rememberPlay: boolean;
}) {
  const character = useLiveCharacter(source, canEdit);
  const { equip, stow, restore } = useCharacterLibrary();
  const [selected, setSelected] = useState<EquipmentSlotId>("armor");
  const t = useCopy();
  const locale = useLocale();

  if (!character) {
    return (
      <section className="error-state" role="alert">
        <h1>{t.sheet.missingTitle}</h1>
        <p>{t.sheet.missingText}</p>
      </section>
    );
  }

  return (
    <article className="folio">
      <PlayBar character={character} canEdit={canEdit} rememberPlay={rememberPlay} />
      <header className="identity">
        <div className="identity-top">
          {portraitUrl && portraitUrls.length > 0 ? (
            <PortraitGallery name={character.name} urls={portraitUrls} shownUrl={portraitUrl}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="face-badge-img" src={portraitUrl} alt="" />
            </PortraitGallery>
          ) : (
            <div className="face-badge" aria-hidden="true">
              {character.id === "mira-thorn" ? (
                <RangerPortrait framed={false} />
              ) : (
                <PortraitMark name={character.name} />
              )}
            </div>
          )}
          <div>
        <p className="eyebrow">{rulesetName(locale, character.ruleset)}</p>
        <h1>{character.name}</h1>
        <p className="identity-line">
          {t.home.level} {character.level} {character.ancestry.toLowerCase()}{" "}
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
        {playedBy ? (
          <p className="identity-meta">{t.sheet.playedBy} {playedBy}</p>
        ) : null}
        {canEdit ? (
          <div className="button-row">
            <button
              type="button"
              className="btn"
              onClick={() => restore(character.id)}
            >
              {character.id === "mira-thorn" ? t.sheet.restoreSample : t.sheet.restoreEquipment}
            </button>
          </div>
        ) : (
          <p className="fine-print">
            {t.sheet.lookOnly.replace("{name}", playedBy ?? t.sheet.theirPlayer)}
          </p>
        )}
          </div>
        </div>
      </header>

      <div className="folio-grid">
        <div className="area-stage">
          <section className="panel stage-panel" aria-label={t.sheet.slots}>
            <p className="fine-print">{t.sheet.slotHint}</p>
            <EquipmentBoard
              character={character}
              selected={selected}
              onSelect={setSelected}
              samplePortrait={character.id === "mira-thorn"}
              portraitUrl={portraitUrl}
              sceneUrl={sceneUrl}
              caption={
                character.id === "mira-thorn"
                  ? "Hunter of the Greenholt"
                  : character.className
              }
            />
          </section>
        </div>
        <div className="area-abilities">
          <AbilityColumn character={character} />
        </div>
        <div className="area-combat">
          <CombatPanel character={character} />
        </div>
        <div className="area-detail">
          <ItemDetail
            character={character}
            slot={selected}
            canEdit={canEdit}
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
            <h2 id="bio-heading">{t.sheet.notes}</h2>
            <p>{character.biography}</p>
            <details className="notes">
              <summary>{t.sheet.howBuilt}</summary>
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
