import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Campaigns",
  description: "Campaigns come in a later phase.",
};

export default function CampaignsPage() {
  return (
    <main className="page">
      <header className="identity">
        <p className="eyebrow">Later phase</p>
        <h1>Campaigns</h1>
      </header>
      <section className="panel empty-state">
        <h2>Campaigns are planned</h2>
        <p>
          Shared tables, invitations, and permissions will live here. None of
          that is built yet, so there is no campaign to open.
        </p>
        <Link className="btn btn-primary" href="/">
          Back to your characters
        </Link>
      </section>
    </main>
  );
}
