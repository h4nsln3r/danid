import Link from "next/link";
import { PortraitMark } from "@/components/character/PortraitMark";
import { copyFor } from "@/domain/copy";
import { listCompany } from "@/server/library-store";
import { currentLocale } from "@/server/locale";
import { currentPlayer } from "@/server/players";

export async function CompanyRoster() {
  const [player, company, locale] = await Promise.all([
    currentPlayer(),
    listCompany(),
    currentLocale(),
  ]);
  const t = copyFor(locale);

  return (
    <>
      <header className="identity">
        <p className="eyebrow">{t.home.computer}</p>
        <h1>{t.company.title}</h1>
        <p className="lede">{t.company.lede}</p>
      </header>
      {company.length === 0 ? (
        <section className="panel empty-state">
          <h2>{t.company.emptyTitle}</h2>
          <p>{t.company.emptyText}</p>
        </section>
      ) : (
        <ul className="roster">
          {company.map((entry) => {
            const yours = player?.id === entry.ownerId;
            return (
              <li key={entry.character.id}>
                <Link href={`/characters/${entry.character.id}`} className="roster-card">
                  <span className="roster-portrait">
                    {entry.hasPortrait ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        className="portrait-photo"
                        src={`/characters/${entry.character.id}/portrait`}
                        alt={`${t.home.portraitOf} ${entry.character.name}`}
                      />
                    ) : (
                      <PortraitMark name={entry.character.name} />
                    )}
                  </span>
                  <span className="roster-copy">
                    <span className="eyebrow">
                      {t.home.level} {entry.character.level}
                      {yours ? ` · ${t.company.you}` : ` · ${entry.ownerName}`}
                    </span>
                    <span className="roster-name">{entry.character.name}</span>
                    <span>
                      {entry.character.ancestry} {entry.character.className}
                      {entry.character.subclass ? ` · ${entry.character.subclass}` : ""}
                    </span>
                    <span className={yours ? "btn btn-primary" : "btn"}>
                      {yours ? t.company.openYours : t.company.look}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
