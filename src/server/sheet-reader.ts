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
uncertainties is a short list, written in English and using 2014 Player's Handbook names, of fields you could not read confidently.`;

const PRIMARY_MODEL = "gemini-3.8-flash";
const FALLBACK_MODEL = "gemini-3.5-flash-lite";

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
      "No GEMINI_API_KEY is set in .env.local. Add a key from Google AI Studio and restart the server, or fill in the character sheet yourself.",
    );
  }

  const configured = process.env.GEMINI_MODEL || PRIMARY_MODEL;
  const models = configured === FALLBACK_MODEL ? [configured] : [configured, FALLBACK_MODEL];

  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      let response: Response;
      try {
        response = await requestReading(key, model, bytes, kind);
      } catch (error) {
        if (!(error instanceof AttemptFailed)) {
          throw error;
        }
        console.warn(`Sheet reader: ${model} did not answer.`);
        break;
      }
      if (response.ok) {
        return readingFromResponse(response);
      }
      if (response.status !== 503 && response.status !== 429) {
        throw new SheetReaderError(rejectionMessage(response.status, await errorMessage(response)));
      }
      await response.body?.cancel();
      console.warn(`Sheet reader: ${model} returned ${response.status}.`);
      if (attempt === 0) {
        await delay(800);
        continue;
      }
      break;
    }
  }

  throw new SheetReaderError(
    "Gemini did not finish reading the picture. It is saved. Press Read the sheet again in a moment, or fill in the sheet yourself.",
  );
}

class AttemptFailed extends Error {
  constructor() {
    super("Gemini attempt failed");
    this.name = "AttemptFailed";
  }
}

async function requestReading(
  key: string,
  model: string,
  bytes: Uint8Array,
  kind: SheetImageKind,
): Promise<Response> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  try {
    return await fetch(url, {
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
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    throw new AttemptFailed();
  }
}

async function readingFromResponse(response: Response): Promise<SheetReading> {
  const body = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = body.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
  if (!text) {
    throw new SheetReaderError(
      "Gemini sent no reading. Fill in the character sheet yourself while the picture stays here.",
    );
  }
  return sheetFromModelText(text);
}

async function errorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: { message?: string } };
    return body.error?.message?.slice(0, 180) ?? "";
  } catch {
    return "";
  }
}

function rejectionMessage(status: number, detail: string): string {
  if (status === 401 || status === 403) {
    return "Gemini rejected the key. Check GEMINI_API_KEY in .env.local and restart the server, or fill in the character sheet yourself.";
  }
  if (status === 404) {
    return "Gemini does not recognize the model name. Check GEMINI_MODEL in .env.local, or fill in the character sheet yourself.";
  }
  const suffix = detail ? ` ${detail}` : "";
  return `Gemini rejected the picture (${status}).${suffix} Fill in the character sheet yourself, or try again.`;
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}
