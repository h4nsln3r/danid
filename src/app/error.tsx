"use client";

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="page">
      <section className="error-state" role="alert">
        <h1>Sidan kunde inte öppnas</h1>
        <p>Något gick fel när sidan skulle visas.</p>
        <button type="button" className="btn btn-primary" onClick={reset}>
          Försök igen
        </button>
      </section>
    </main>
  );
}
