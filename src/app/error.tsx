"use client";

import { useCopy } from "@/components/providers/LocaleProvider";

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useCopy();
  return (
    <main className="page">
      <section className="error-state" role="alert">
        <h1>{t.errors.couldNotOpen}</h1>
        <p>{t.errors.wentWrong}</p>
        <button type="button" className="btn btn-primary" onClick={reset}>
          {t.errors.tryAgain}
        </button>
      </section>
    </main>
  );
}
