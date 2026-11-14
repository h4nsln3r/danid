"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

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
        aria-label={`Show the pictures of ${name}`}
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
        aria-label={`Pictures of ${name}`}
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
            <img src={urls[index]} alt={`${name}, picture ${index + 1} of ${urls.length}`} />
            <div className="portrait-viewer-bar">
              <button type="button" className="btn" onClick={() => step(-1)} disabled={urls.length < 2}>
                Previous
              </button>
              <p>
                {index + 1} of {urls.length}
              </p>
              <button type="button" className="btn" onClick={() => step(1)} disabled={urls.length < 2}>
                Next
              </button>
              <button type="button" className="btn" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>
          </div>
        ) : null}
      </dialog>
    </>
  );
}
