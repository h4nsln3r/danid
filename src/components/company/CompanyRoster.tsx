import Link from "next/link";
import { PortraitMark } from "@/components/character/PortraitMark";
import { listCompany } from "@/server/library-store";
import { currentPlayer } from "@/server/players";

export async function CompanyRoster() {
  const [player, company] = await Promise.all([currentPlayer(), listCompany()]);

  return (
    <>
      <header className="identity">
        <p className="eyebrow">This computer</p>
        <h1>All characters</h1>
        <p className="lede">
          Every character saved here is listed. You can open any of them. Only
          the player who created a character can change that character&apos;s
          equipment or papers.
        </p>
      </header>
      {company.length === 0 ? (
        <section className="panel empty-state">
          <h2>No characters yet</h2>
          <p>When someone creates a character, it shows up here.</p>
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
                        alt={`Portrait of ${entry.character.name}`}
                      />
                    ) : (
                      <PortraitMark name={entry.character.name} />
                    )}
                  </span>
                  <span className="roster-copy">
                    <span className="eyebrow">
                      Level {entry.character.level}
                      {yours ? " · You" : ` · ${entry.ownerName}`}
                    </span>
                    <span className="roster-name">{entry.character.name}</span>
                    <span>
                      {entry.character.ancestry} {entry.character.className}
                      {entry.character.subclass ? ` · ${entry.character.subclass}` : ""}
                    </span>
                    <span className={yours ? "btn btn-primary" : "btn"}>
                      {yours ? "Open your character" : "Look"}
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
