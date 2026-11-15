"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useCopy } from "@/components/providers/LocaleProvider";

export function PortraitGallery({
  name,
  urls,
  shownUrl,
  children,
}: {
  name: string;
  urls: string[];
  shownUrl: string;
  children: ReactNode;
}) {
  const t = useCopy();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (open && !dialog.open) {
      dialog.showModal();
    }
    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const step = (direction: -1 | 1) => {
    setIndex((current) => (current + direction + urls.length) % urls.length);
  };

  return (
    <>
      <button
        type="button"
        className="face-badge face-badge-button"
        aria-label={`${t.gallery.show} ${name}`}
        onClick={() => {
          const shown = urls.indexOf(shownUrl);
          setIndex(shown >= 0 ? shown : 0);
          setOpen(true);
        }}
      >
        {children}
      </button>
      <dialog
        ref={dialogRef}
        className="portrait-viewer"
        aria-label={`${t.gallery.picturesOf} ${name}`}
        onClose={() => setOpen(false)}
        onCancel={(event) => {
          event.preventDefault();
          setOpen(false);
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            setOpen(false);
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") {
            event.preventDefault();
            step(1);
          }
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            step(-1);
          }
        }}
      >
        {open && urls[index] ? (
          <div className="portrait-viewer-frame">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={urls[index]} alt={t.gallery.caption.replace("{name}", name).replace("{n}", String(index + 1)).replace("{total}", String(urls.length))} />
            <div className="portrait-viewer-bar">
              <button type="button" className="btn" onClick={() => step(-1)} disabled={urls.length < 2}>
                {t.gallery.previous}
              </button>
              <p>
                {t.gallery.counter.replace("{n}", String(index + 1)).replace("{total}", String(urls.length))}
              </p>
              <button type="button" className="btn" onClick={() => step(1)} disabled={urls.length < 2}>
                {t.gallery.next}
              </button>
              <button type="button" className="btn" onClick={() => setOpen(false)}>
                {t.gallery.close}
              </button>
            </div>
          </div>
        ) : null}
      </dialog>
    </>
  );
}
