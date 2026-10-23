# Roadmap

The default ruleset is the 2014 Player's Handbook. The app now starts by asking who is playing and lets that person create characters from a paper sheet.

## Current phase

Character creation from a photographed sheet. Status: implemented and checked, except a live call to Gemini. No API key is configured on this machine, so the photo was not read by the model in this session.

## Done

- Phase 1 folio remains: Mira Thorn, equipment slots, combat math, and the tested 2014 rules.
- The home page asks for a name. Each name on this computer has its own list of characters. This is not a password account.
- A new character starts with a camera photo or an uploaded JPEG, PNG, or WebP, at most 8 MB.
- The image is stored under `data/sheets/`. Character records are stored in `data/library.json`.
- When `GEMINI_API_KEY` is set, the image is sent to Google Gemini and the reply fills the review form. The player corrects the values before the character is saved.
- If the key is missing or the call fails, the same form stays empty and can be filled by hand. The image is still saved.
- Known 2014 weapons and armor get their book values. Unknown names are stored without invented damage. Class features and spells are not invented.
- `npm test` (29), `npm run lint`, `npm run typecheck`, and `npm run build` succeeded on 2026-10-23.

## Explicitly not done

- Password accounts, permissions, and campaign membership. Names on one computer can be switched by anyone at that computer.
- PostgreSQL and Prisma. The JSON file does not replace that plan.
- A successful live reading of a real sheet. Add a Gemini key before treating the reader as proven.
- Editing hit points, spell slots, level up, or saving equipment changes. Slot changes still reset on refresh.
- The folio's rules text is still English. The entrance, creation form, and navigation are Swedish.
- The assistant, local Ollama, and 3D viewing.

## Blockers

Gemini cannot be called until `GEMINI_API_KEY` is present in `.env.local`. See `env.example`. Docker is not installed, so PostgreSQL is not running here.

## Next step

Put a Gemini key in `.env.local`, restart `npm run dev`, and read one real character sheet. After that reading is confirmed, move the same character records into local PostgreSQL.
