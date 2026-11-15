import Link from "next/link";
import { copyFor } from "@/domain/copy";
import { currentLocale } from "@/server/locale";

export default async function CampaignsPage() {
  const t = copyFor(await currentLocale());
  return (
    <main className="page">
      <header className="identity">
        <p className="eyebrow">{t.campaigns.later}</p>
        <h1>{t.campaigns.title}</h1>
      </header>
      <section className="panel empty-state">
        <h2>{t.campaigns.planned}</h2>
        <p>{t.campaigns.text}</p>
        <Link className="btn btn-primary" href="/">
          {t.campaigns.back}
        </Link>
      </section>
    </main>
  );
}
