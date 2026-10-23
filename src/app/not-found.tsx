import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page">
      <section className="error-state">
        <h1>Sidan finns inte i boken</h1>
        <p>Adressen matchar ingen sida.</p>
        <Link className="btn btn-primary" href="/">
          Tillbaka till sällskapet
        </Link>
      </section>
    </main>
  );
}
