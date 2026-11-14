"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { confirmExtraPage, confirmFrontPage, showPortrait, uploadPortrait, uploadSheetPage } from "@/app/actions/papers";
import { SKILL_CATALOG } from "@/domain/catalog";
import type { ExtraFinding, ExtraReading } from "@/domain/extra-page";
import { SKILL_IDS } from "@/domain/schema";
import { blankSheet, type SheetReading, type SheetValues } from "@/domain/sheet";
import { useCharacterLibrary } from "@/components/providers/CharacterLibraryProvider";

const PAGES = [1, 2, 3, 4] as const;
const PAGE_COPY: Record<(typeof PAGES)[number], { title: string; text: string }> = {
  1: {
    title: "Page 1 — character sheet",
    text: "The front of the sheet. Replacing it reads the numbers again and keeps pages 2–4.",
  },
  2: {
    title: "Page 2",
    text: "Attacks, spells, features, and notes. Saving replaces what page 2 added before.",
  },
  3: {
    title: "Page 3",
    text: "Another page of the same kind. Saving replaces what page 3 added before.",
  },
  4: {
    title: "Page 4",
    text: "The last extra page. Saving replaces what page 4 added before.",
  },
};

const MAX_EDGE = 1600;

async function prepareSheetImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.size < 700_000) {
    return file;
  }
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) {
      bitmap.close();
      return file;
    }
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
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

export function PapersView({
  characterId,
  pages,
  portraits,
  activePortrait,
}: {
  characterId: string;
  pages: Record<"1" | "2" | "3" | "4", string | null>;
  portraits: string[];
  activePortrait: string | null;
}) {
  const router = useRouter();
  const { adopt } = useCharacterLibrary();
  const [files, setFiles] = useState(pages);
  const [gallery, setGallery] = useState(portraits);
  const [shown, setShown] = useState(activePortrait);
  const [busy, setBusy] = useState<string | null>(null);
  const [charge, setCharge] = useState(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [front, setFront] = useState<SheetReading | null>(null);
  const [extras, setExtras] = useState<Partial<Record<2 | 3 | 4, ExtraReading>>>({});
  const [picked, setPicked] = useState<Partial<Record<2 | 3 | 4, boolean[]>>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const frame = useRef(0);

  useEffect(() => {
    if (!busy) {
      return;
    }
    const started = performance.now();
    const tick = (now: number) => {
      const seconds = (now - started) / 1000;
      setCharge(6 + 86 * (1 - Math.exp(-seconds / 7)));
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [busy]);

  async function finish() {
    cancelAnimationFrame(frame.current);
    setCharge(100);
    setReady(true);
    await new Promise((resolve) => setTimeout(resolve, 420));
    setReady(false);
    setBusy(null);
  }

  async function sendPage(page: (typeof PAGES)[number], file: File) {
    setError(null);
    setNotice(null);
    setBusy(`page-${page}`);
    const prepared = await prepareSheetImage(file);
    const body = new FormData();
    body.set("characterId", characterId);
    body.set("page", String(page));
    body.set("sheet", prepared);
    const result = await uploadSheetPage(body);
    if (!result.ok) {
      if (result.fileName) {
        setFiles((current) => ({ ...current, [String(page)]: result.fileName ?? null }));
      }
      setError(result.message);
      await finish();
      return;
    }
    setFiles((current) => ({ ...current, [String(page)]: result.fileName }));
    if (result.page === 1) {
      setFront(result.reading);
    } else {
      setExtras((current) => ({ ...current, [result.page]: result.reading }));
      setPicked((current) => ({
        ...current,
        [result.page]: result.reading.findings.map(() => true),
      }));
    }
    setNotice(`Page ${page} is read. Check it, then save.`);
    await finish();
  }

  async function saveFront(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setBusy("save-1");
    const body = new FormData(event.currentTarget);
    body.set("characterId", characterId);
    const result = await confirmFrontPage(body);
    if (!result.ok) {
      setError(result.message);
      await finish();
      return;
    }
    adopt(result.character);
    setNotice("Page 1 is saved. Later pages are still on the character.");
    router.refresh();
    await finish();
  }

  async function saveExtra(page: 2 | 3 | 4) {
    const reading = extras[page];
    if (!reading) {
      return;
    }
    setError(null);
    setBusy(`save-${page}`);
    const flags = picked[page] ?? [];
    const findings = reading.findings.filter((_, index) => flags[index]);
    const body = new FormData();
    body.set("characterId", characterId);
    body.set("page", String(page));
    body.set("findings", JSON.stringify(findings));
    const result = await confirmExtraPage(body);
    if (!result.ok) {
      setError(result.message);
      await finish();
      return;
    }
    adopt(result.character);
    setNotice(
      findings.length
        ? `Page ${page} is saved.`
        : `Page ${page} is cleared. Nothing from that page stays on the character.`,
    );
    router.refresh();
    await finish();
  }

  async function sendPortrait(file: File, replace?: string) {
    setError(null);
    setNotice(null);
    setBusy(replace ? `replace-${replace}` : "portrait");
    const prepared = await prepareSheetImage(file);
    const body = new FormData();
    body.set("characterId", characterId);
    body.set("portrait", prepared);
    if (replace) {
      body.set("replace", replace);
    }
    const result = await uploadPortrait(body);
    if (!result.ok) {
      setError(result.message);
      await finish();
      return;
    }
    setGallery(result.files);
    setShown(result.active);
    setNotice(replace ? "That picture is replaced." : "The picture is saved.");
    router.refresh();
    await finish();
  }

  async function choosePortrait(fileName: string) {
    setError(null);
    setBusy(`show-${fileName}`);
    const body = new FormData();
    body.set("characterId", characterId);
    body.set("fileName", fileName);
    const result = await showPortrait(body);
    if (!result.ok) {
      setError(result.message);
      await finish();
      return;
    }
    setShown(result.active);
    setNotice("This picture is now the portrait on the character sheet.");
    router.refresh();
    await finish();
  }

  return (
    <section className="panel">
      <h1>Papers and pictures</h1>
      <p>
        Four pages, one picture each. A new picture replaces that page. Page 1 is the character sheet.
        Pages 2–4 can add attacks, spells, features, and notes after you confirm them. Unknown attacks
        are kept without invented damage.
      </p>
      {error ? (
        <p className="notice notice-error" role="alert">
          {error}
        </p>
      ) : null}
      {notice ? <p className="notice notice-success">{notice}</p> : null}
      {busy ? (
        <div className="charge-meter" role="progressbar" aria-valuenow={Math.round(ready ? 100 : charge)} aria-valuemin={0} aria-valuemax={100}>
          <div className="charge-meter-fill" style={{ width: `${ready ? 100 : charge}%` }} />
          <span className="charge-meter-label">{ready ? "Ready" : "Reading"}</span>
        </div>
      ) : null}

      <div className="papers-grid">
        {PAGES.map((page) => {
          const fileName = files[String(page) as "1" | "2" | "3" | "4"];
          const extra = page === 1 ? null : extras[page];
          return (
            <article key={page} className="paper-card">
              <h2>{PAGE_COPY[page].title}</h2>
              <p>{PAGE_COPY[page].text}</p>
              {fileName ? (
                <img
                  className="paper-shot"
                  alt=""
                  src={`/characters/${characterId}/picture/${fileName}`}
                />
              ) : (
                <p>No picture yet.</p>
              )}
              <div className="button-row">
                <PictureChoice
                  label="Take a picture"
                  capture
                  disabled={busy !== null}
                  onFile={(file) => void sendPage(page, file)}
                />
                <PictureChoice
                  label={fileName ? "Replace" : "Upload"}
                  disabled={busy !== null}
                  onFile={(file) => void sendPage(page, file)}
                />
              </div>
              {page === 1 && front ? <FrontReview reading={front} disabled={busy !== null} onSubmit={saveFront} /> : null}
              {page !== 1 && extra ? (
                <ExtraReview
                  reading={extra}
                  flags={picked[page] ?? []}
                  disabled={busy !== null}
                  onToggle={(index) =>
                    setPicked((current) => {
                      const flags = [...(current[page] ?? [])];
                      flags[index] = !flags[index];
                      return { ...current, [page]: flags };
                    })
                  }
                  onSave={() => void saveExtra(page)}
                />
              ) : null}
            </article>
          );
        })}
      </div>

      <h2>Pictures of the character</h2>
      <p>One picture is shown on the sheet and in the company. You can keep up to eight and choose which one is shown.</p>
      <PictureChoice
        label="Add a picture"
        disabled={busy !== null || gallery.length >= 8}
        onFile={(file) => void sendPortrait(file)}
      />
      <div className="papers-grid">
        {gallery.map((fileName) => (
          <article key={fileName} className="portrait-tile">
            <img alt="" src={`/characters/${characterId}/picture/${fileName}`} />
            <p>{fileName === shown ? "Shown on the character sheet." : "Saved, not shown."}</p>
            <div className="button-row">
              {fileName === shown ? null : (
                <button type="button" className="btn" disabled={busy !== null} onClick={() => void choosePortrait(fileName)}>
                  Show this picture
                </button>
              )}
              <PictureChoice
                label="Replace"
                disabled={busy !== null}
                onFile={(file) => void sendPortrait(file, fileName)}
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function FrontReview({
  reading,
  disabled,
  onSubmit,
}: {
  reading: SheetReading;
  disabled: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const values = reading.values ?? blankSheet();
  return (
    <form className="sheet-form" onSubmit={onSubmit}>
      {reading.notes.length ? (
        <ul className="note-list">
          {reading.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      ) : null}
      <Field label="Name" name="name" defaultValue={values.name} required />
      <Field label="Ancestry" name="ancestry" defaultValue={values.ancestry} />
      <Field label="Class" name="className" defaultValue={values.className} required />
      <Field label="Subclass" name="subclass" defaultValue={values.subclass} />
      <Field label="Level" name="level" defaultValue={values.level} required />
      <Field label="Background" name="background" defaultValue={values.background} />
      <Field label="Alignment" name="alignment" defaultValue={values.alignment} />
      <Field label="Experience" name="experiencePoints" defaultValue={values.experiencePoints} />
      {(["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"] as const).map((ability) => (
        <Field key={ability} label={ability} name={ability} defaultValue={values[ability]} required />
      ))}
      <Field label="Hit point maximum" name="maxHitPoints" defaultValue={values.maxHitPoints} required />
      <Field label="Current hit points" name="currentHitPoints" defaultValue={values.currentHitPoints} required />
      <Field label="Speed" name="speed" defaultValue={values.speed} required />
      <Field label="Hit die" name="hitDie" defaultValue={values.hitDie} />
      <Field label="Languages" name="languages" defaultValue={values.languages} />
      <Field label="Armor" name="armorName" defaultValue={values.armorName} />
      <label>
        <input type="checkbox" name="shield" defaultChecked={values.shield} /> Shield
      </label>
      <label>
        Weapons, one per line
        <textarea name="weapons" defaultValue={values.weapons} rows={4} />
      </label>
      <Field label="Armor class on the sheet" name="sheetArmorClass" defaultValue={values.sheetArmorClass} />
      <fieldset>
        <legend>Skills</legend>
        {SKILL_IDS.map((skill) => (
          <label key={skill}>
            <input type="checkbox" name="skills" value={skill} defaultChecked={values.skills.includes(skill)} />{" "}
            {SKILL_CATALOG[skill].label}
          </label>
        ))}
      </fieldset>
      <button type="submit" className="btn btn-primary" disabled={disabled}>
        Save page 1
      </button>
    </form>
  );
}

function ExtraReview({
  reading,
  flags,
  disabled,
  onToggle,
  onSave,
}: {
  reading: ExtraReading;
  flags: boolean[];
  disabled: boolean;
  onToggle: (index: number) => void;
  onSave: () => void;
}) {
  return (
    <div>
      {reading.notes.length ? (
        <ul className="note-list">
          {reading.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      ) : null}
      {reading.findings.length ? (
        <ul className="finding-list">
          {reading.findings.map((finding, index) => (
            <li key={`${finding.kind}-${finding.name}-${index}`}>
              <label>
                <input type="checkbox" checked={flags[index] ?? false} onChange={() => onToggle(index)} />
                <span>
                  <strong>{labelFor(finding)}</strong>
                  {finding.detail ? ` — ${finding.detail}` : ""}
                </span>
              </label>
            </li>
          ))}
        </ul>
      ) : (
        <p>Nothing readable was found on this page.</p>
      )}
      <button type="button" className="btn btn-primary" disabled={disabled} onClick={onSave}>
        Save this page
      </button>
    </div>
  );
}

function labelFor(finding: ExtraFinding): string {
  if (finding.kind === "attack") {
    return `Attack: ${finding.name}`;
  }
  if (finding.kind === "spell") {
    return `Spell: ${finding.name}`;
  }
  if (finding.kind === "feature") {
    return `Feature: ${finding.name}`;
  }
  return `Note: ${finding.name}`;
}

function Field({
  label,
  name,
  defaultValue,
  required = false,
}: {
  label: string;
  name: string;
  defaultValue: string;
  required?: boolean;
}) {
  return (
    <label>
      {label}
      <input name={name} defaultValue={defaultValue} required={required} />
    </label>
  );
}

function PictureChoice({
  label,
  capture = false,
  disabled,
  onFile,
}: {
  label: string;
  capture?: boolean;
  disabled: boolean;
  onFile: (file: File) => void;
}) {
  return (
    <label className="btn file-trigger">
      {label}
      <input
        type="file"
        accept={capture ? "image/*" : "image/jpeg,image/png,image/webp,image/*"}
        capture={capture ? "environment" : undefined}
        disabled={disabled}
        onChange={(event) => {
          const file = event.target.files?.[0] ?? null;
          event.target.value = "";
          if (file) {
            onFile(file);
          }
        }}
      />
    </label>
  );
}
