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
          <p className="eyebrow">This computer</p>
          <h1>Who is playing?</h1>
          <p className="lede">
            Enter your name. This is not a login, only a name on this computer,
            so each person can keep their own characters.
          </p>
        </header>
        {nameError ? (
          <p className="notice notice-error" role="alert">
            The name needs to be 1–40 characters.
          </p>
        ) : null}
        <form className="panel name-form" action={createPlayer}>
          <label className="field">
            <span>Your name</span>
            <input name="name" required maxLength={40} autoComplete="nickname" />
          </label>
          <button type="submit" className="btn btn-primary">
            Continue
          </button>
        </form>
        {players.length > 0 ? (
          <section className="panel">
            <h2>Already here</h2>
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
        <h1>Your characters</h1>
        <p className="lede">
          Create a character from a character sheet. You can have more than
          one. Equipment you change stays until the page reloads.
        </p>
        <div className="button-row">
          <Link className="btn btn-primary" href="/characters/new">
            Create Character
          </Link>
          <Link className="btn" href="/company">
            All Characters
          </Link>
          <form action={leavePlayer}>
            <button type="submit" className="btn">
              Switch player
            </button>
          </form>
        </div>
      </header>
      {owned.length === 0 ? (
        <section className="panel empty-state">
          <h2>No characters yet</h2>
          <p>Add a character sheet or a portrait to begin.</p>
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
                      alt={`Portrait of ${entry.character.name}`}
                    />
                  ) : (
                    <PortraitMark name={entry.character.name} />
                  )}
                </span>
                <span className="roster-copy">
                  <span className="eyebrow">Level {entry.character.level}</span>
                  <span className="roster-name">{entry.character.name}</span>
                  <span>
                    {entry.character.ancestry} {entry.character.className}
                    {entry.character.subclass ? ` · ${entry.character.subclass}` : ""}
                  </span>
                  <span className="btn btn-primary">Open character</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <section className="panel">
        <h2>Sample</h2>
        <ul className="roster">
          {sample.map((character) => (
            <li key={character.id}>
              <Link href={`/characters/${character.id}`} className="roster-card">
                <span className="roster-portrait">
                  <RangerPortrait />
                </span>
                <span className="roster-copy">
                  <span className="eyebrow">Level {character.level}</span>
                  <span className="roster-name">{character.name}</span>
                  <span>
                    {character.ancestry} {character.className}
                  </span>
                  <span className="btn">Open sample</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
