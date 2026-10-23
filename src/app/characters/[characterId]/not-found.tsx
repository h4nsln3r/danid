import Link from "next/link";

export default function CharacterNotFound() {
  return (
    <section className="error-state">
      <h1>Inget folio med det namnet</h1>
      <p>Den här spelaren har ingen karaktär på adressen.</p>
      <Link className="btn btn-primary" href="/">
        Tillbaka till sällskapet
      </Link>
    </section>
  );
}
