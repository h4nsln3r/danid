export function SheetSkeleton() {
  return (
    <div className="skeleton" aria-busy="true" aria-live="polite">
      <p>Loading the character sheet…</p>
      <div className="skeleton-grid">
        <div className="skeleton-block" />
        <div className="skeleton-block skeleton-tall" />
        <div className="skeleton-block" />
      </div>
    </div>
  );
}
