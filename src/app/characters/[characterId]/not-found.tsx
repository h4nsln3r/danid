import Link from "next/link";
import { copyFor } from "@/domain/copy";
import { currentLocale } from "@/server/locale";

export default async function CharacterNotFound() {
  const t = copyFor(await currentLocale());
  return (
    <section className="error-state">
      <h1>{t.errors.noCharacter}</h1>
      <p>{t.errors.noCharacterHere}</p>
      <Link className="btn btn-primary" href="/">
        {t.errors.back}
      </Link>
    </section>
  );
}
