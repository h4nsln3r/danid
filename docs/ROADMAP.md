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
- The header can switch the interface between English and Swedish. English stays on the 2014 Player's Handbook phrases. Swedish uses the same sheet words as the photographed pages: Grundegenskaper, Rustningsklass, Träffpoäng, Färdigheter, and the skill names already recognized when a sheet is read. The choice is saved on this computer. Names, notes, and item descriptions stay in the language they were written. `npm test` is 39 tests. `npm run lint` and `npm run typecheck` passed on 2026-11-15. Checked in the browser on Rocco's sheet, the equipment list, and the new-character form, including the phone-width header.
- On a narrow screen the header links sit in a menu that slides in from a hamburger button and closes with the same button, the dimmed page, Escape, or a chosen link. A round face sits at the top of the portrait, and the character list uses the same kind of circle. Checked in the browser at phone width and on a wide screen. `npm run typecheck` passed after that layout change.
- All Characters lists every character saved on this computer. Anyone can open a sheet and portrait. Equipment, Papers, and the photographed sheet can be changed only by the player who created that character.
- The top of a character page changes current hit points and arrow count with a typed number or plus and minus. Those two numbers are saved for the player who created the character. Other players can see them.
- The round portrait sits beside the name. Pressing it opens the pictures at full size, and Previous, Next, or the arrow keys move through every picture saved for that character. The figure frame shows the portrait. For Rocco Maserati it shows a painted forest scene made from his existing portrait. Mira Thorn still uses the ranger illustration.
- Each saved character has a Papers page. It holds one picture for page 1 and one each for pages 2, 3, and 4. Replacing a page replaces that page's picture. Page 1 is read as the character sheet and, after confirmation, replaces the front-page numbers while keeping later pages. Pages 2–4 are read for attacks, spells, features, and notes. Nothing is added until the player confirms the lines. A known 2014 weapon keeps its book damage. An unknown attack is stored with no invented damage. Up to eight pictures of the character can be saved, and one of them is the portrait shown on the sheet. The sample character has no Papers page. `npm test` is 33 tests, and `npm run typecheck` passed on 2026-11-14.

## Explicitly not done

- Password accounts, permissions, and campaign membership. Names on one computer can be switched by anyone at that computer.
- PostgreSQL and Prisma. The JSON file does not replace that plan.
- A successful live reading of a real sheet. Add a Gemini key before treating the reader as proven.
- Spell slots, level up, and saving equipment changes. Slot changes still reset on refresh. Current hit points and arrow count are saved for the character's player.
- The assistant and local Ollama.
- A 3D model. A local or cloud mesh from the portrait is too large for this app. The frame shows a picture instead.

## Blockers

A Gemini key is in `.env.local`. Phone pictures are reduced before they are sent. The reader calls `gemini-3.8-flash` for at most 20 seconds and then tries `gemini-3.5-flash-lite`. A live reading of a real sheet is still unconfirmed. Docker is not installed, so PostgreSQL is not running here.

## Next step

Open a saved character, add page 2, and confirm one attack. A live reading of a real sheet is still unconfirmed. After that reading is confirmed, move the same character records into local PostgreSQL.
