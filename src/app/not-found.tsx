import Link from "next/link";
import { copyFor } from "@/domain/copy";
import { currentLocale } from "@/server/locale";

export default async function NotFound() {
  const t = copyFor(await currentLocale());
  return (
    <main className="page">
      <section className="error-state">
        <h1>{t.errors.missingPage}</h1>
        <p>{t.errors.missingAddress}</p>
        <Link className="btn btn-primary" href="/">
          {t.errors.back}
        </Link>
      </section>
    </main>
  );
}
