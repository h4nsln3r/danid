# Följeslagare

Lokalt sällskap för D&D, femte utgåvan (Player's Handbook 2014).

## Kör lokalt

```bash
npm install
npm run dev
```

Öppna [http://localhost:3000](http://localhost:3000). Skriv ditt namn, skapa en karaktär och välj **Ta kort** eller **Ladda upp bild**.

## Läsa pappersbladet

Kopiera `env.example` till `.env.local` och sätt `GEMINI_API_KEY` till en nyckel från Google AI Studio. Starta om `npm run dev`.

Utan nyckel kan du fortfarande fylla i bladet för hand. Bilden sparas på den här datorn i mappen `data/`, och skickas till Gemini bara när du ber appen läsa den.

## Kontroller

```bash
npm run lint
npm run typecheck
npm test
npm run build
```
