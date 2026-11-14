"use client";

import { useActionState, useRef, useState } from "react";
import { createCharacter, readSheet, savePortrait } from "@/app/actions/sheets";
import { ABILITY_LABELS, SKILL_CATALOG } from "@/domain/catalog";
import { SKILL_IDS } from "@/domain/schema";
import type { SheetValues } from "@/domain/sheet";

const ABILITIES = [
  "strength",
  "dexterity",
  "constitution",
  "intelligence",
  "wisdom",
  "charisma",
] as const;

const MAX_EDGE = 1600;

async function prepareSheetImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.size < 700_000) {
    return file;
  }
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      bitmap.close();
      return file;
    }
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.82);
    });
    if (!blob || blob.size >= file.size) {
      return file;
    }
    const stem = file.name.replace(/\.[^.]+$/, "") || "sheet";
    return new File([blob], `${stem}.jpg`, { type: "image/jpeg" });
  } catch {
    return file;
  }
}

export function CreateCharacterForm({ playerName }: { playerName: string }) {
  const readGeneration = useRef(0);
  const draftIdRef = useRef<string | null>(null);
  const chargeFrame = useRef(0);
  const [sheetPreview, setSheetPreview] = useState<string | null>(null);
  const [portraitPreview, setPortraitPreview] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [charge, setCharge] = useState<{ label: string; progress: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createState, createAction, saving] = useActionState(createCharacter, null);
  const [draft, setDraft] = useState<{
    draftId: string;
    values: SheetValues;
    notes: string[];
  } | null>(null);

  const rememberPreview = (
    next: File,
    setUrl: (update: (current: string | null) => string) => void,
  ) => {
    setUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }
      return URL.createObjectURL(next);
    });
  };

  const beginCharge = (label: string) => {
    cancelAnimationFrame(chargeFrame.current);
    const started = performance.now();
    const tick = (now: number) => {
      const seconds = (now - started) / 1000;
      setCharge({ label, progress: 6 + 86 * (1 - Math.exp(-seconds / 7)) });
      chargeFrame.current = requestAnimationFrame(tick);
    };
    chargeFrame.current = requestAnimationFrame(tick);
  };

  const endCharge = async (generation: number) => {
    if (generation !== readGeneration.current) {
      return;
    }
    cancelAnimationFrame(chargeFrame.current);
    setCharge({ label: "Ready", progress: 100 });
    await new Promise((resolve) => {
      setTimeout(resolve, 420);
    });
    if (generation !== readGeneration.current) {
      return;
    }
    setCharge(null);
  };

  const acceptImage = (kind: "sheet" | "portrait", next: File | null) => {
    if (!next || reading) {
      return;
    }
    if (next.size > 20 * 1024 * 1024) {
      setError("That picture is too large. Use one under 20 MB.");
      return;
    }
    const generation = readGeneration.current + 1;
    readGeneration.current = generation;
    setError(null);
    setReading(true);
    beginCharge(kind === "sheet" ? "Reading the character sheet" : "Setting the portrait");
    void (async () => {
      const prepared = await prepareSheetImage(next);
      if (generation !== readGeneration.current) {
        return;
      }
      if (prepared.size > 8 * 1024 * 1024) {
        setReading(false);
        setCharge(null);
        setError("The picture can be at most 8 MB.");
        return;
      }
      const body = new FormData();
      if (draftIdRef.current) {
        body.set("draftId", draftIdRef.current);
      }
      if (kind === "sheet") {
        rememberPreview(prepared, setSheetPreview);
        body.set("sheet", prepared);
        const result = await readSheet(body);
        if (generation !== readGeneration.current) {
          return;
        }
        if (!result.ok) {
          setReading(false);
          setCharge(null);
          setError(result.message);
          return;
        }
        draftIdRef.current = result.draftId;
        await endCharge(generation);
        if (generation !== readGeneration.current) {
          return;
        }
        setDraft({
          draftId: result.draftId,
          values: result.values,
          notes: result.notes,
        });
      } else {
        rememberPreview(prepared, setPortraitPreview);
        body.set("portrait", prepared);
        const result = await savePortrait(body);
        if (generation !== readGeneration.current) {
          return;
        }
        if (!result.ok) {
          setReading(false);
          setCharge(null);
          setError(result.message);
          return;
        }
        draftIdRef.current = result.draftId;
        await endCharge(generation);
      }
      if (generation === readGeneration.current) {
        setReading(false);
      }
    })();
  };

  return (
    <div className="create-flow">
      <header className="identity">
        <p className="eyebrow">{playerName}</p>
        <h1>New Character</h1>
        <p className="lede">
          Start with the character sheet or a portrait. The sheet is read and
          the fields fill in. The portrait becomes the figure.
        </p>
      </header>

      {error || createState ? (
        <p className="notice notice-error" role="alert">
          {error ?? createState?.message}
        </p>
      ) : null}

      <section className="panel intake">
        <div className="intake-grid">
          <article className="intake-card">
            <h2>Character sheet</h2>
            {sheetPreview ? (
              // The preview is a local file the player just chose.
              // eslint-disable-next-line @next/next/no-img-element
              <img className="sheet-preview" src={sheetPreview} alt="Preview of the character sheet" />
            ) : (
              <p className="intake-empty">No sheet yet.</p>
            )}
            <div className="choice-row">
              <PictureChoice
                label="Take a picture"
                primary
                capture
                disabled={reading}
                onFile={(file) => acceptImage("sheet", file)}
              />
              <PictureChoice
                label="Upload"
                disabled={reading}
                onFile={(file) => acceptImage("sheet", file)}
              />
            </div>
            <p className="fine-print">
              The sheet is saved on this computer and sent to Gemini only when
              you add it here.
            </p>
          </article>
          <article className="intake-card">
            <h2>Portrait</h2>
            <figure className="portrait-frame intake-portrait">
              {portraitPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="portrait-photo" src={portraitPreview} alt="Portrait of the character" />
              ) : (
                <div className="portrait-mark" aria-hidden="true">?</div>
              )}
              <figcaption>The figure</figcaption>
            </figure>
            <div className="choice-row">
              <PictureChoice
                label="Take a picture"
                primary
                capture
                disabled={reading}
                onFile={(file) => acceptImage("portrait", file)}
              />
              <PictureChoice
                label="Upload"
                disabled={reading}
                onFile={(file) => acceptImage("portrait", file)}
              />
            </div>
            <p className="fine-print">
              The portrait stays on this computer. It is not read for numbers.
            </p>
          </article>
        </div>
        {charge ? (
          <div
            className="charge-meter"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(charge.progress)}
            aria-label={charge.label}
          >
            <div className="charge-meter-fill" style={{ width: `${charge.progress}%` }} />
            <span className="charge-meter-label">
              {charge.label}
              {charge.progress < 100 ? ` ${Math.round(charge.progress)}%` : ""}
            </span>
          </div>
        ) : null}
      </section>

      {draft ? (
        <div className="create-grid">
          <form key={draft.draftId} className="panel sheet-form" action={createAction}>
            <h2>Check the values</h2>
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
              <Field label="Character Name" name="name" defaultValue={draft.values.name} required />
              <Field label="Race" name="ancestry" defaultValue={draft.values.ancestry} required />
              <Field label="Class" name="className" defaultValue={draft.values.className} required />
              <Field label="Archetype" name="subclass" defaultValue={draft.values.subclass} />
            </div>
            <div className="field-row">
              <Field label="Level" name="level" defaultValue={draft.values.level} inputMode="numeric" required />
              <Field label="Background" name="background" defaultValue={draft.values.background} required />
              <Field label="Alignment" name="alignment" defaultValue={draft.values.alignment} required />
              <Field
                label="Experience Points"
                name="experiencePoints"
                defaultValue={draft.values.experiencePoints}
                inputMode="numeric"
              />
            </div>

            <fieldset className="field-set">
              <legend>Ability Scores</legend>
              <div className="field-row">
                {ABILITIES.map((name) => (
                  <Field
                    key={name}
                    label={ABILITY_LABELS[name]}
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
                label="Hit Point Maximum"
                name="maxHitPoints"
                defaultValue={draft.values.maxHitPoints}
                inputMode="numeric"
                required
              />
              <Field
                label="Current Hit Points"
                name="currentHitPoints"
                defaultValue={draft.values.currentHitPoints}
                inputMode="numeric"
                required
              />
              <Field
                label="Speed (ft.)"
                name="speed"
                defaultValue={draft.values.speed}
                inputMode="numeric"
                required
              />
              <label className="field">
                <span>Hit Die</span>
                <select name="hitDie" defaultValue={draft.values.hitDie} required>
                  <option value="">Choose</option>
                  {[4, 6, 8, 10, 12].map((die) => (
                    <option key={die} value={die}>
                      d{die}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <Field label="Languages" name="languages" defaultValue={draft.values.languages} required />
            <p className="fine-print">Separate languages with commas.</p>
            <Field label="Armor" name="armorName" defaultValue={draft.values.armorName} />
            <label className="check-line">
              <input type="checkbox" name="shield" defaultChecked={draft.values.shield} />
              Wielding a shield
            </label>
            <label className="field">
              <span>Weapons</span>
              <textarea name="weapons" rows={4} defaultValue={draft.values.weapons} />
            </label>
            <p className="fine-print">
              One weapon per line. Known weapons and armor from the 2014
              Player&apos;s Handbook keep their book values. Unknown names are
              saved with no invented damage.
            </p>

            <fieldset className="field-set">
              <legend>Skills</legend>
              <div className="skill-grid">
                {SKILL_IDS.map((skill) => (
                  <label key={skill} className="check-line">
                    <input
                      type="checkbox"
                      name="skills"
                      value={skill}
                      defaultChecked={draft.values.skills.includes(skill)}
                    />
                    {SKILL_CATALOG[skill].label}
                  </label>
                ))}
              </div>
            </fieldset>

            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Creating…" : "Create Character"}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function PictureChoice({
  label,
  primary,
  capture,
  disabled,
  onFile,
}: {
  label: string;
  primary?: boolean;
  capture?: boolean;
  disabled: boolean;
  onFile: (file: File | null) => void;
}) {
  return (
    <label className={`btn file-trigger${primary ? " btn-primary" : ""}`}>
      {label}
      <input
        type="file"
        accept={capture ? "image/*" : "image/jpeg,image/png,image/webp,image/*"}
        capture={capture ? "environment" : undefined}
        disabled={disabled}
        onChange={(event) => {
          onFile(event.target.files?.[0] ?? null);
          event.target.value = "";
        }}
      />
    </label>
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
