import Link from "next/link";
import { choosePlayer, createPlayer, leavePlayer } from "@/app/actions/players";
import { RangerPortrait } from "@/components/character/RangerPortrait";
import { PortraitMark } from "@/components/character/PortraitMark";
import { copyFor } from "@/domain/copy";
import { listCharacters } from "@/domain/characters";
import { listOwnedCharacters, listPlayers } from "@/server/library-store";
import { currentLocale } from "@/server/locale";
import { currentPlayer } from "@/server/players";

export async function CompanyHome({
  nameError,
}: {
  nameError: boolean;
}) {
  const player = await currentPlayer();
  const players = await listPlayers();
  const t = copyFor(await currentLocale());

  if (!player) {
    return (
      <>
        <header className="identity">
          <p className="eyebrow">{t.home.computer}</p>
          <h1>{t.home.who}</h1>
          <p className="lede">{t.home.whoLede}</p>
        </header>
        {nameError ? (
          <p className="notice notice-error" role="alert">
            {t.home.nameLength}
          </p>
        ) : null}
        <form className="panel name-form" action={createPlayer}>
          <label className="field">
            <span>{t.home.yourName}</span>
            <input name="name" required maxLength={40} autoComplete="nickname" />
          </label>
          <button type="submit" className="btn btn-primary">
            {t.home.continue}
          </button>
        </form>
        {players.length > 0 ? (
          <section className="panel">
            <h2>{t.home.already}</h2>
            <ul className="player-list">
              {players.map((entry) => (
                <li key={entry.id}>
                  <form action={choosePlayer}>
                    <input type="hidden" name="playerId" value={entry.id} />
                    <button type="submit" className="btn">
                      {entry.name}
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </>
    );
  }

  const owned = await listOwnedCharacters(player.id);
  const sample = listCharacters();

  return (
    <>
      <header className="identity">
        <p className="eyebrow">{player.name}</p>
        <h1>{t.home.yours}</h1>
        <p className="lede">{t.home.yoursLede}</p>
        <div className="button-row">
          <Link className="btn btn-primary" href="/characters/new">
            {t.home.create}
          </Link>
          <Link className="btn" href="/company">
            {t.nav.company}
          </Link>
          <form action={leavePlayer}>
            <button type="submit" className="btn">
              {t.home.switchPlayer}
            </button>
          </form>
        </div>
      </header>
      {owned.length === 0 ? (
        <section className="panel empty-state">
          <h2>{t.home.emptyTitle}</h2>
          <p>{t.home.emptyText}</p>
        </section>
      ) : (
        <ul className="roster">
          {owned.map((entry) => (
            <li key={entry.character.id}>
              <Link href={`/characters/${entry.character.id}`} className="roster-card">
                <span className="roster-portrait">
                  {entry.portraitFile ? (
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
                  <span className="eyebrow">{t.home.level} {entry.character.level}</span>
                  <span className="roster-name">{entry.character.name}</span>
                  <span>
                    {entry.character.ancestry} {entry.character.className}
                    {entry.character.subclass ? ` · ${entry.character.subclass}` : ""}
                  </span>
                  <span className="btn btn-primary">{t.home.open}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <section className="panel">
        <h2>{t.home.sample}</h2>
        <ul className="roster">
          {sample.map((character) => (
            <li key={character.id}>
              <Link href={`/characters/${character.id}`} className="roster-card">
                <span className="roster-portrait">
                  <RangerPortrait />
                </span>
                <span className="roster-copy">
                  <span className="eyebrow">{t.home.level} {character.level}</span>
                  <span className="roster-name">{character.name}</span>
                  <span>
                    {character.ancestry} {character.className}
                  </span>
                  <span className="btn">{t.home.openSample}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
