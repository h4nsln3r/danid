"use client";

import { useEffect, useId, useRef, useState } from "react";
import { savePlayTotals } from "@/app/actions/play";
import type { Character } from "@/domain/schema";
import { arrowCount } from "@/domain/rules/play";
import { useCopy } from "@/components/providers/LocaleProvider";
import { useCharacterLibrary } from "@/components/providers/CharacterLibraryProvider";

export function PlayBar({
  character,
  canEdit,
  rememberPlay,
}: {
  character: Character;
  canEdit: boolean;
  rememberPlay: boolean;
}) {
  const { setHitPoints, setArrows } = useCharacterLibrary();
  const t = useCopy();
  const saves = useRef(Promise.resolve());
  const totals = useRef({
    hitPoints: character.currentHitPoints,
    arrows: arrowCount(character),
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    totals.current = {
      hitPoints: character.currentHitPoints,
      arrows: arrowCount(character),
    };
  }, [character]);

  function persist(hitPoints: number, arrows: number) {
    if (!rememberPlay) {
      return;
    }
    saves.current = saves.current.then(async () => {
      const result = await savePlayTotals(character.id, hitPoints, arrows);
      setError(result.ok ? null : result.message);
    });
  }

  return (
    <div className="play-bar">
      <Counter
        label={t.play.hitPoints}
        value={character.currentHitPoints}
        detail={` / ${character.maxHitPoints}`}
        canEdit={canEdit}
        decreaseLabel={t.play.loseHp}
        increaseLabel={t.play.healHp}
        onCommit={(next) => {
          const arrows = totals.current.arrows;
          totals.current = { hitPoints: next, arrows };
          setHitPoints(character.id, next);
          persist(next, arrows);
        }}
      />
      <Counter
        label={t.play.arrows}
        value={arrowCount(character)}
        canEdit={canEdit}
        decreaseLabel={t.play.useArrow}
        increaseLabel={t.play.recoverArrow}
        onCommit={(next) => {
          const hitPoints = totals.current.hitPoints;
          totals.current = { hitPoints, arrows: next };
          setArrows(character.id, next);
          persist(hitPoints, next);
        }}
      />
      {error ? (
        <p className="notice notice-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function Counter({
  label,
  value,
  detail,
  canEdit,
  decreaseLabel,
  increaseLabel,
  onCommit,
}: {
  label: string;
  value: number;
  detail?: string;
  canEdit: boolean;
  decreaseLabel: string;
  increaseLabel: string;
  onCommit: (next: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));
  const [tracked, setTracked] = useState(value);
  const inputId = useId();
  if (tracked !== value) {
    setTracked(value);
    setDraft(String(value));
  }

  function shown(): number {
    const parsed = Number(draft);
    return Number.isFinite(parsed) ? parsed : value;
  }

  if (!canEdit) {
    return (
      <p className="play-counter">
        <span className="play-label">{label}</span>
        <span className="play-value">
          {value}
          {detail ?? ""}
        </span>
      </p>
    );
  }

  return (
    <div className="play-counter">
      <label className="play-label" htmlFor={inputId}>
        {label}
      </label>
      <span className="play-steps">
        <button
          type="button"
          className="btn play-step"
          aria-label={decreaseLabel}
          onClick={() => onCommit(shown() - 1)}
        >
          −
        </button>
        <input
          id={inputId}
          className="play-input"
          inputMode="numeric"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => onCommit(shown())}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onCommit(shown());
            }
          }}
        />
        <button
          type="button"
          className="btn play-step"
          aria-label={increaseLabel}
          onClick={() => onCommit(shown() + 1)}
        >
          +
        </button>
        {detail ? <span className="play-detail">{detail}</span> : null}
      </span>
    </div>
  );
}
