import { readFile } from "node:fs/promises";
import { sheetImageMime, type SheetImageKind } from "@/domain/image-kind";
import { characterOwnsFile, getStoredCharacter, sheetFilePath } from "@/server/library-store";

export async function GET(
  _request: Request,
  context: { params: Promise<{ characterId: string; fileName: string }> },
) {
  const { characterId, fileName } = await context.params;
  const entry = await getStoredCharacter(characterId);
  if (!entry || !characterOwnsFile(entry, fileName)) {
    return new Response("The picture is missing.", { status: 404 });
  }
  const kind = fileName.slice(fileName.lastIndexOf(".") + 1) as SheetImageKind;
  const bytes = await readFile(sheetFilePath(fileName));
  return new Response(bytes, {
    headers: {
      "Content-Type": sheetImageMime(kind),
      "Content-Disposition": "inline",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
