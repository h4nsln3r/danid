"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { confirmExtraPage, confirmFrontPage, showPortrait, uploadPortrait, uploadSheetPage } from "@/app/actions/papers";
import { abilityName, skillName } from "@/domain/locale";
import type { ExtraFinding, ExtraReading } from "@/domain/extra-page";
import { SKILL_IDS } from "@/domain/schema";
import { blankSheet, type SheetReading } from "@/domain/sheet";
import { useCharacterLibrary } from "@/components/providers/CharacterLibraryProvider";
import { useCopy, useLocale } from "@/components/providers/LocaleProvider";

const PAGES = [1, 2, 3, 4] as const;

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
  const t = useCopy();
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
    setNotice(t.papers.savedPage1);
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
    setNotice(replace ? t.papers.replaced : t.papers.pictureSaved);
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
    setNotice(t.papers.nowPortrait);
    router.refresh();
    await finish();
  }

  return (
    <section className="panel">
      <h1>{t.papers.title}</h1>
      <p>{t.papers.lede}</p>
      {error ? (
        <p className="notice notice-error" role="alert">
          {error}
        </p>
      ) : null}
      {notice ? <p className="notice notice-success">{notice}</p> : null}
      {busy ? (
        <div className="charge-meter" role="progressbar" aria-valuenow={Math.round(ready ? 100 : charge)} aria-valuemin={0} aria-valuemax={100}>
          <div className="charge-meter-fill" style={{ width: `${ready ? 100 : charge}%` }} />
          <span className="charge-meter-label">{ready ? t.papers.ready : t.papers.reading}</span>
        </div>
      ) : null}

      <div className="papers-grid">
        {PAGES.map((page) => {
          const fileName = files[String(page) as "1" | "2" | "3" | "4"];
          const extra = page === 1 ? null : extras[page];
          return (
            <article key={page} className="paper-card">
              <h2>{page === 1 ? t.papers.page1Title : `${t.papers.pageTitle} ${page}`}</h2>
              <p>{page === 1 ? t.papers.page1Text : t.papers.pageText}</p>
              {fileName ? (
                <img
                  className="paper-shot"
                  alt=""
                  src={`/characters/${characterId}/picture/${fileName}`}
                />
              ) : (
                <p>{t.papers.noPicture}</p>
              )}
              <div className="button-row">
                <PictureChoice
                  label={t.papers.takePicture}
                  capture
                  disabled={busy !== null}
                  onFile={(file) => void sendPage(page, file)}
                />
                <PictureChoice
                  label={fileName ? t.papers.replace : t.papers.upload}
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

      <h2>{t.papers.pictures}</h2>
      <p>{t.papers.picturesLede}</p>
      <PictureChoice
        label={t.papers.addPicture}
        disabled={busy !== null || gallery.length >= 8}
        onFile={(file) => void sendPortrait(file)}
      />
      <div className="papers-grid">
        {gallery.map((fileName) => (
          <article key={fileName} className="portrait-tile">
            <img alt="" src={`/characters/${characterId}/picture/${fileName}`} />
            <p>{fileName === shown ? t.papers.shown : t.papers.saved}</p>
            <div className="button-row">
              {fileName === shown ? null : (
                <button type="button" className="btn" disabled={busy !== null} onClick={() => void choosePortrait(fileName)}>
                  Show this picture
                </button>
              )}
              <PictureChoice
                label={t.papers.replace}
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
  const t = useCopy();
  const locale = useLocale();
  return (
    <form className="sheet-form" onSubmit={onSubmit}>
      {reading.notes.length ? (
        <ul className="note-list">
          {reading.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      ) : null}
      <Field label={t.create.name} name="name" defaultValue={values.name} required />
      <Field label={t.papers.ancestry} name="ancestry" defaultValue={values.ancestry} />
      <Field label={t.create.class} name="className" defaultValue={values.className} required />
      <Field label={t.create.archetype} name="subclass" defaultValue={values.subclass} />
      <Field label={t.create.level} name="level" defaultValue={values.level} required />
      <Field label={t.create.background} name="background" defaultValue={values.background} />
      <Field label={t.create.alignment} name="alignment" defaultValue={values.alignment} />
      <Field label={t.papers.experience} name="experiencePoints" defaultValue={values.experiencePoints} />
      {(["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"] as const).map((ability) => (
        <Field key={ability} label={abilityName(locale, ability)} name={ability} defaultValue={values[ability]} required />
      ))}
      <Field label={t.create.hpMax} name="maxHitPoints" defaultValue={values.maxHitPoints} required />
      <Field label={t.create.hpCurrent} name="currentHitPoints" defaultValue={values.currentHitPoints} required />
      <Field label={t.create.speed} name="speed" defaultValue={values.speed} required />
      <Field label={t.create.hitDie} name="hitDie" defaultValue={values.hitDie} />
      <Field label={t.create.languages} name="languages" defaultValue={values.languages} />
      <Field label={t.create.armor} name="armorName" defaultValue={values.armorName} />
      <label>
        <input type="checkbox" name="shield" defaultChecked={values.shield} /> {t.papers.shield}
      </label>
      <label>
        {t.papers.weapons}
        <textarea name="weapons" defaultValue={values.weapons} rows={4} />
      </label>
      <Field label={t.papers.sheetAc} name="sheetArmorClass" defaultValue={values.sheetArmorClass} />
      <fieldset>
        <legend>{t.create.skills}</legend>
        {SKILL_IDS.map((skill) => (
          <label key={skill}>
            <input type="checkbox" name="skills" value={skill} defaultChecked={values.skills.includes(skill)} />{" "}
            {skillName(locale, skill)}
          </label>
        ))}
      </fieldset>
      <button type="submit" className="btn btn-primary" disabled={disabled}>
        {t.papers.savePage1}
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
  const t = useCopy();
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
                  <strong>{labelFor(finding, t)}</strong>
                  {finding.detail ? ` — ${finding.detail}` : ""}
                </span>
              </label>
            </li>
          ))}
        </ul>
      ) : (
        <p>{t.papers.nothingFound}</p>
      )}
      <button type="button" className="btn btn-primary" disabled={disabled} onClick={onSave}>
        {t.papers.savePage}
      </button>
    </div>
  );
}

function labelFor(finding: ExtraFinding, t: ReturnType<typeof useCopy>): string {
  if (finding.kind === "attack") {
    return `${t.papers.attack}: ${finding.name}`;
  }
  if (finding.kind === "spell") {
    return `${t.papers.spell}: ${finding.name}`;
  }
  if (finding.kind === "feature") {
    return `${t.papers.feature}: ${finding.name}`;
  }
  return `${t.papers.note}: ${finding.name}`;
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
