import { sheetImageMime, type SheetImageKind } from "@/domain/image-kind";
import { sheetFromModelText, type SheetReading } from "@/domain/sheet";

const PROMPT = `You read one photographed or scanned Dungeons & Dragons 5th edition character sheet.
Use the 2014 Player's Handbook sheet, which may be printed or handwritten, in Swedish or English.
Return only JSON with exactly these keys:
{
  "name": string | null,
  "ancestry": string | null,
  "className": string | null,
  "subclass": string | null,
  "level": number | null,
  "background": string | null,
  "alignment": string | null,
  "experiencePoints": number | null,
  "abilities": {
    "strength": number | null,
    "dexterity": number | null,
    "constitution": number | null,
    "intelligence": number | null,
    "wisdom": number | null,
    "charisma": number | null
  },
  "maxHitPoints": number | null,
  "currentHitPoints": number | null,
  "speed": number | null,
  "armorClass": number | null,
  "hitDie": number | null,
  "skills": string[],
  "languages": string[],
  "armorName": string | null,
  "shield": boolean | null,
  "weapons": string[],
  "uncertainties": string[]
}
Copy only values that are visible. Use null when a value is missing, covered, or unclear.
Do not invent class features, spells, equipment, or numbers.
Keep names in the language written on the sheet.
skills lists the names of the checked skills.
weapons lists one weapon name per entry.
uncertainties is a short list, written in Swedish, of fields you could not read confidently.`;

export class SheetReaderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SheetReaderError";
  }
}

export async function readCharacterSheet(
  bytes: Uint8Array,
  kind: SheetImageKind,
): Promise<SheetReading> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new SheetReaderError(
      "Ingen GEMINI_API_KEY finns i .env.local. Lägg in en nyckel från Google AI Studio och starta om servern, eller fyll i bladet själv.",
    );
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": key,
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: PROMPT },
              {
                inlineData: {
                  mimeType: sheetImageMime(kind),
                  data: Buffer.from(bytes).toString("base64"),
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0,
          responseMimeType: "application/json",
        },
      }),
      signal: AbortSignal.timeout(45_000),
    });
  } catch {
    throw new SheetReaderError(
      "Gemini svarade inte i tid. Kontrollera nätverket och försök igen, eller fyll i bladet själv.",
    );
  }

  if (!response.ok) {
    throw new SheetReaderError(
      `Gemini avvisade bilden (${response.status}). Kontrollera nyckeln och modellnamnet, eller fyll i bladet själv.`,
    );
  }

  const body = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = body.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
  if (!text) {
    throw new SheetReaderError(
      "Gemini skickade ingen läsning. Fyll i bladet själv medan bilden ligger kvar.",
    );
  }
  return sheetFromModelText(text);
}
