"use client";

import { useActionState, useRef, useState } from "react";
import { createCharacter, readSheet } from "@/app/actions/sheets";
import { SKILL_IDS, type SkillId } from "@/domain/schema";
import type { SheetValues } from "@/domain/sheet";

const ABILITIES = [
  ["strength", "Styrka"],
  ["dexterity", "Rörlighet"],
  ["constitution", "Fysik"],
  ["intelligence", "Intelligens"],
  ["wisdom", "Visdom"],
  ["charisma", "Karisma"],
] as const;

const SKILL_LABELS: Record<SkillId, string> = {
  acrobatics: "Akrobatik",
  "animal-handling": "Djurhantering",
  arcana: "Arkanakunskap",
  athletics: "Friidrott",
  deception: "Bluff",
  history: "Historia",
  insight: "Insikt",
  intimidation: "Hot",
  investigation: "Efterforskning",
  medicine: "Läkekonst",
  nature: "Naturkunskap",
  perception: "Uppfattningsförmåga",
  performance: "Uppträdande",
  persuasion: "Övertalning",
  religion: "Religion",
  "sleight-of-hand": "Fingerfärdighet",
  stealth: "Smyga",
  survival: "Överlevnad",
};

export function CreateCharacterForm({ playerName }: { playerName: string }) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createState, createAction, saving] = useActionState(createCharacter, null);
  const [draft, setDraft] = useState<{
    draftId: string;
    values: SheetValues;
    notes: string[];
  } | null>(null);

  const chooseFile = (next: File | null) => {
    if (!next) {
      return;
    }
    if (next.size > 8 * 1024 * 1024) {
      setError("Bilden får vara högst 8 MB.");
      return;
    }
    setError(null);
    setDraft(null);
    setFile(next);
    setPreviewUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }
      return URL.createObjectURL(next);
    });
  };

  const onRead = async () => {
    if (!file) {
      setError("Ta ett kort eller ladda upp en bild först.");
      return;
    }
    setReading(true);
    setError(null);
    const body = new FormData();
    body.set("sheet", file);
    const result = await readSheet(body);
    setReading(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setDraft({
      draftId: result.draftId,
      values: result.values,
      notes: result.notes,
    });
  };

  return (
    <div className="create-flow">
      <header className="identity">
        <p className="eyebrow">{playerName}</p>
        <h1>Ny karaktär</h1>
        <p className="lede">
          Ta ett kort på pappersbladet eller ladda upp en bild. Det som går att
          läsa fylls i här. Rätta allt som ser fel ut innan karaktären skapas.
        </p>
      </header>

      {error || createState ? (
        <p className="notice notice-error" role="alert">
          {error ?? createState?.message}
        </p>
      ) : null}

      <div className="create-grid">
        <section className="panel">
          <h2>Pappersbladet</h2>
          <div className="choice-row">
            <button type="button" className="btn btn-primary" onClick={() => cameraRef.current?.click()}>
              Ta kort
            </button>
            <button type="button" className="btn" onClick={() => uploadRef.current?.click()}>
              Ladda upp bild
            </button>
          </div>
          <input
            ref={cameraRef}
            className="visually-hidden"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(event) => chooseFile(event.target.files?.[0] ?? null)}
          />
          <input
            ref={uploadRef}
            className="visually-hidden"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/*"
            onChange={(event) => chooseFile(event.target.files?.[0] ?? null)}
          />
          {previewUrl ? (
            // The preview is a local file the player just chose, not a remote image.
            // eslint-disable-next-line @next/next/no-img-element
            <img className="sheet-preview" src={previewUrl} alt="Förhandsvisning av karaktärsbladet" />
          ) : (
            <p>Ingen bild vald.</p>
          )}
          <button
            type="button"
            className="btn btn-primary"
            disabled={!file || reading}
            onClick={() => void onRead()}
          >
            {reading ? "Läser bladet…" : "Läs in bladet"}
          </button>
          <p className="fine-print">
            Bilden sparas på den här datorn. När du ber appen läsa den skickas
            bilden till Google Gemini.
          </p>
        </section>

        {draft ? (
          <form key={draft.draftId} className="panel sheet-form" action={createAction}>
            <h2>Kontrollera värdena</h2>
            {draft.notes.length > 0 ? (
              <ul className="note-list">
                {draft.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            ) : null}
            <input type="hidden" name="draftId" value={draft.draftId} />
            <input type="hidden" name="sheetArmorClass" value={draft.values.sheetArmorClass} />

            <div className="field-row">
              <Field label="Namn" name="name" defaultValue={draft.values.name} required />
              <Field label="Folk" name="ancestry" defaultValue={draft.values.ancestry} required />
              <Field label="Klass" name="className" defaultValue={draft.values.className} required />
              <Field label="Arketyp" name="subclass" defaultValue={draft.values.subclass} />
            </div>
            <div className="field-row">
              <Field label="Nivå" name="level" defaultValue={draft.values.level} inputMode="numeric" required />
              <Field label="Bakgrund" name="background" defaultValue={draft.values.background} required />
              <Field label="Läggning" name="alignment" defaultValue={draft.values.alignment} required />
              <Field
                label="Erfarenhetspoäng"
                name="experiencePoints"
                defaultValue={draft.values.experiencePoints}
                inputMode="numeric"
              />
            </div>

            <fieldset className="field-set">
              <legend>Grundegenskaper</legend>
              <div className="field-row">
                {ABILITIES.map(([name, label]) => (
                  <Field
                    key={name}
                    label={label}
                    name={name}
                    defaultValue={draft.values[name]}
                    inputMode="numeric"
                    required
                  />
                ))}
              </div>
            </fieldset>

            <div className="field-row">
              <Field
                label="Max träffpoäng"
                name="maxHitPoints"
                defaultValue={draft.values.maxHitPoints}
                inputMode="numeric"
                required
              />
              <Field
                label="Nuvarande träffpoäng"
                name="currentHitPoints"
                defaultValue={draft.values.currentHitPoints}
                inputMode="numeric"
                required
              />
              <Field
                label="Förflyttning (fot)"
                name="speed"
                defaultValue={draft.values.speed}
                inputMode="numeric"
                required
              />
              <label className="field">
                <span>Träffpoängstärning</span>
                <select name="hitDie" defaultValue={draft.values.hitDie} required>
                  <option value="">Välj</option>
                  {[4, 6, 8, 10, 12].map((die) => (
                    <option key={die} value={die}>
                      d{die}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <Field label="Språk, åtskilda med komma" name="languages" defaultValue={draft.values.languages} required />
            <Field label="Rustning" name="armorName" defaultValue={draft.values.armorName} />
            <label className="check-line">
              <input type="checkbox" name="shield" defaultChecked={draft.values.shield} />
              Sköld buren
            </label>
            <label className="field">
              <span>Vapen, ett per rad</span>
              <textarea name="weapons" rows={4} defaultValue={draft.values.weapons} />
            </label>
            <p className="fine-print">
              Kända vapen och rustningar från Player&apos;s Handbook 2014 får sina
              värden. Okända namn sparas utan påhittad skada.
            </p>

            <fieldset className="field-set">
              <legend>Färdigheter</legend>
              <div className="skill-grid">
                {SKILL_IDS.map((skill) => (
                  <label key={skill} className="check-line">
                    <input
                      type="checkbox"
                      name="skills"
                      value={skill}
                      defaultChecked={draft.values.skills.includes(skill)}
                    />
                    {SKILL_LABELS[skill]}
                  </label>
                ))}
              </div>
            </fieldset>

            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Skapar…" : "Skapa karaktär"}
            </button>
          </form>
        ) : (
          <section className="panel empty-state">
            <h2>Inget blad inläst ännu</h2>
            <p>Bilden stannar här tills du ber appen läsa den.</p>
          </section>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required,
  inputMode,
}: {
  label: string;
  name: string;
  defaultValue: string;
  required?: boolean;
  inputMode?: "numeric" | "text";
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input name={name} defaultValue={defaultValue} required={required} inputMode={inputMode} />
    </label>
  );
}
