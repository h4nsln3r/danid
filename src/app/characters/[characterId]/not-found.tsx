import Link from "next/link";

export default function CharacterNotFound() {
  return (
    <section className="error-state">
      <h1>No character at this address</h1>
      <p>This player has no character here.</p>
      <Link className="btn btn-primary" href="/">
        Back to your characters
      </Link>
    </section>
  );
}
