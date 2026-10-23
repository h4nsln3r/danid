import Link from "next/link";
import { choosePlayer, createPlayer, leavePlayer } from "@/app/actions/players";
import { RangerPortrait } from "@/components/character/RangerPortrait";
import { PortraitMark } from "@/components/character/PortraitMark";
import { listCharacters } from "@/domain/characters";
import { listOwnedCharacters, listPlayers } from "@/server/library-store";
import { currentPlayer } from "@/server/players";

export async function CompanyHome({
  nameError,
}: {
  nameError: boolean;
}) {
  const player = await currentPlayer();
  const players = await listPlayers();

  if (!player) {
    return (
      <>
        <header className="identity">
          <p className="eyebrow">Lokalt bord</p>
          <h1>Vem spelar?</h1>
          <p className="lede">
            Skriv ditt namn. Det är ingen inloggning, bara ett namn på den här
            datorn, så att var och en kan ha sina egna karaktärer.
          </p>
        </header>
        {nameError ? (
          <p className="notice notice-error" role="alert">
            Namnet behöver vara 1–40 tecken.
          </p>
        ) : null}
        <form className="panel name-form" action={createPlayer}>
          <label className="field">
            <span>Ditt namn</span>
            <input name="name" required maxLength={40} autoComplete="nickname" />
          </label>
          <button type="submit" className="btn btn-primary">
            Fortsätt
          </button>
        </form>
        {players.length > 0 ? (
          <section className="panel">
            <h2>Redan här</h2>
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
        <h1>Dina karaktärer</h1>
        <p className="lede">
          Skapa en karaktär från ett pappersblad. Du kan ha flera. Utrustning
          du byter i foliet ligger kvar tills sidan laddas om.
        </p>
        <div className="button-row">
          <Link className="btn btn-primary" href="/characters/new">
            Skapa karaktär
          </Link>
          <form action={leavePlayer}>
            <button type="submit" className="btn">
              Byt spelare
            </button>
          </form>
        </div>
      </header>
      {owned.length === 0 ? (
        <section className="panel empty-state">
          <h2>Inga karaktärer ännu</h2>
          <p>Ta ett kort på ditt blad, eller ladda upp en bild.</p>
        </section>
      ) : (
        <ul className="roster">
          {owned.map((entry) => (
            <li key={entry.character.id}>
              <Link href={`/characters/${entry.character.id}`} className="roster-card">
                <span className="roster-portrait">
                  <PortraitMark name={entry.character.name} />
                </span>
                <span className="roster-copy">
                  <span className="eyebrow">Nivå {entry.character.level}</span>
                  <span className="roster-name">{entry.character.name}</span>
                  <span>
                    {entry.character.ancestry} {entry.character.className}
                    {entry.character.subclass ? ` · ${entry.character.subclass}` : ""}
                  </span>
                  <span className="btn btn-primary">Öppna folio</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <section className="panel">
        <h2>Exempel</h2>
        <ul className="roster">
          {sample.map((character) => (
            <li key={character.id}>
              <Link href={`/characters/${character.id}`} className="roster-card">
                <span className="roster-portrait">
                  <RangerPortrait />
                </span>
                <span className="roster-copy">
                  <span className="eyebrow">Nivå {character.level}</span>
                  <span className="roster-name">{character.name}</span>
                  <span>
                    {character.ancestry} {character.className}
                  </span>
                  <span className="btn">Öppna exempel</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
