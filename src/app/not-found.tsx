import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page">
      <section className="error-state">
        <h1>This page is not here</h1>
        <p>The address does not match a page.</p>
        <Link className="btn btn-primary" href="/">
          Back to your characters
        </Link>
      </section>
    </main>
  );
}
