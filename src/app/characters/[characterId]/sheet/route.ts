import { readFile } from "node:fs/promises";
import { sheetImageMime, type SheetImageKind } from "@/domain/image-kind";
import { sheetFilePath } from "@/server/library-store";
import { visibleSheetFile } from "@/server/visible-character";

export async function GET(
  _request: Request,
  context: { params: Promise<{ characterId: string }> },
) {
  const { characterId } = await context.params;
  const fileName = await visibleSheetFile(characterId);
  if (!fileName) {
    return new Response("Bladet finns inte.", { status: 404 });
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
