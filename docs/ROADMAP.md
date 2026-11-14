# Roadmap

The default ruleset is the 2014 Player's Handbook. The app now starts by asking who is playing and lets that person create characters from a paper sheet.

## Current phase

Character creation from a photographed sheet. Status: implemented and checked, except a live call to Gemini. A key is configured. The reader uses `gemini-3.8-flash` and falls back to `gemini-3.5-flash-lite` when Google returns 503.

## Done

- Phase 1 folio remains: Mira Thorn, equipment slots, combat math, and the tested 2014 rules.
- The home page asks for a name. Each name on this computer has its own list of characters. This is not a password account.
- A new character starts by adding a character sheet or a portrait. The sheet is read and fills the form. The portrait is stored on this computer and shown in the figure frame. A gold meter advances while the work runs and reaches the end only when that work is finished.
- The image is stored under `data/sheets/`. Character records are stored in `data/library.json`.
- When `GEMINI_API_KEY` is set, the image is sent to Google Gemini and the reply fills the review form. The player corrects the values before the character is saved.
- If the key is missing or the call fails, the same form stays empty and can be filled by hand. The image is still saved.
- Known 2014 weapons and armor get their book values. Unknown names are stored without invented damage. Class features and spells are not invented.
- `npm test` (29), `npm run lint`, `npm run typecheck`, and `npm run build` succeeded on 2026-10-23.
- The pages are in English and use the 2014 Player's Handbook phrases: Ability Scores, Armor Class, Hit Points, Hit Dice, Saving Throws, Skills, Spellcasting, and Equipment. A photographed sheet may still be written in Swedish. The reader keeps names as they are written and still recognizes Swedish skill and weapon names. `npm test` (29), `npm run lint`, and `npm run typecheck` succeeded again on 2026-11-14.

## Explicitly not done

- Password accounts, permissions, and campaign membership. Names on one computer can be switched by anyone at that computer.
- PostgreSQL and Prisma. The JSON file does not replace that plan.
- A successful live reading of a real sheet. Add a Gemini key before treating the reader as proven.
- Editing hit points, spell slots, level up, or saving equipment changes. Slot changes still reset on refresh.
- The assistant, local Ollama, and 3D viewing.

## Blockers

A Gemini key is in `.env.local`. Phone pictures are reduced before they are sent. The reader calls `gemini-3.8-flash` for at most 20 seconds and then tries `gemini-3.5-flash-lite`. A live reading of a real sheet is still unconfirmed. Docker is not installed, so PostgreSQL is not running here.

## Next step

Read one real character sheet with **Read the sheet**. After that reading is confirmed, move the same character records into local PostgreSQL.
