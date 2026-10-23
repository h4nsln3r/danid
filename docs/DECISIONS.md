# Architecture Decision Log

Record significant technical decisions here.

Do not change an accepted decision without explaining the reason and discussing material trade-offs with the user.

## ADR-001 — Full-stack framework

Status: Accepted

Decision: Use Next.js App Router with React and TypeScript.

Reason: One codebase can handle the web interface, server-side logic, and API endpoints. It supports local hosting and future production deployment.

## ADR-002 — Database

Status: Accepted

Decision: Use PostgreSQL with Prisma ORM.

Reason: Relational data, transactions, and migrations provide a reliable foundation for characters, equipment, users, and campaigns.

## ADR-003 — Local AI

Status: Planned

Decision: Use a replaceable local inference provider, initially evaluating Ollama.

Constraints:
- No external AI API calls.
- Manual character management must work without AI.
- Hardware requirements must be evaluated before choosing a model.

## ADR-004 — Character presentation

Status: Accepted

Decision: Use a portrait-centered character overview with interactive equipment slots.

Reason: Deliver the visual experience early without introducing the complexity of 3D rendering.

## ADR-005 — D&D ruleset

Status: Accepted

Decision: Default to the original 2014 D&D 5th Edition Player's Handbook.

Constraints:
- Do not mix the 2024 revision silently.
- Keep rules calculations deterministic and testable.
- Identify missing source material and ask when rules are uncertain.

## ADR-006 — Phase 1 persistence boundary

Date: 2026-10-23

Status: Accepted

Context: The overview needs a real character and working equipment interactions before users, authentication, or PostgreSQL exist.

Options considered:

1. Wait for Prisma and Docker before building the folio.
2. Draw the sheet with numbers hard-coded in components.
3. Keep one validated sample character in TypeScript and apply equipment changes in browser memory.

Decision: Option 3. Zod validates the sample. Combat and equipment rules are pure functions with unit tests. The browser holds edits until refresh or until the player restores the sample.

This does not replace ADR-002. PostgreSQL and Prisma remain the persistence plan. The character shape from this phase is what that later schema should store.

Consequences: The folio resets on refresh. There is one sample character. Manual play does not require AI or a database.

## ADR-007 — Sheet images may be sent to Gemini

Date: 2026-10-23

Status: Accepted

Context: Creating a character starts from a photo or upload of a paper sheet. Handwriting is not reliable with local OCR, and Ollama is not installed. The project rule is that character sheets are not sent to an external service unless the user explicitly allows it.

Options considered:

1. Install a local vision model first.
2. Show the photo beside a blank form and type every value.
3. Send only the sheet image to a vision API, then require the player to confirm every field.

Decision: Option 3, approved by the user on 2026-10-23. The provider is Google Gemini, called from the server with `GEMINI_API_KEY`. The request contains the image and a fixed extraction prompt. Nothing else from the library is sent.

This does not replace ADR-003. The later assistant is still planned as local. Gemini is limited to reading a sheet the player just submitted.

Consequences: Reading a sheet needs a network connection and a Google key. The key stays in `.env.local` and is not committed. A failed or missing key leaves the form usable by hand. Unreadable values stay empty instead of being invented.

## ADR-008 — Local names and a JSON library

Date: 2026-10-23

Status: Accepted

Context: Each player needs more than one character, and a created character has to survive a refresh. Docker and PostgreSQL are not available on this machine yet.

Options considered:

1. Wait for PostgreSQL before creation works.
2. Keep new characters in browser memory.
3. Store players and characters in a local JSON file, with an httpOnly cookie naming the current player.

Decision: Option 3. `data/library.json` holds the players and characters. `data/sheets/` holds the images. A player is a display name, not an account.

This does not replace ADR-002. PostgreSQL and Prisma remain the persistence plan. The character shape is unchanged.

Consequences: Anyone at this computer can switch names. There are no passwords. Equipment edits in the folio still reset on refresh. The saved character itself does not.

## Future decisions

Add new entries with:
- Decision identifier and date.
- Context and problem.
- Options considered.
- Chosen solution and rationale.
- Consequences and trade-offs.
- Whether the decision supersedes an earlier entry.