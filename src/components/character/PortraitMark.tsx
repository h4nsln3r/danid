export function PortraitMark({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();

  return (
    <div className="portrait-mark" role="img" aria-label={`Portrait of ${name}`}>
      <span>{initials || "?"}</span>
    </div>
  );
}
