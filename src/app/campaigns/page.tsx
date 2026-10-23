import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Kampanjer",
  description: "Kampanjer kommer i en senare fas.",
};

export default function CampaignsPage() {
  return (
    <main className="page">
      <header className="identity">
        <p className="eyebrow">Senare fas</p>
        <h1>Kampanjer</h1>
      </header>
      <section className="panel empty-state">
        <h2>Kampanjer är planerade</h2>
        <p>
          Här ska delade bord, inbjudningar och behörigheter ligga. Inget av
          det är byggt ännu, så det finns ingen kampanj att öppna.
        </p>
        <Link className="btn btn-primary" href="/">
          Tillbaka till sällskapet
        </Link>
      </section>
    </main>
  );
}
