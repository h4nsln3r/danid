const MAX_SHEET_BYTES = 8 * 1024 * 1024;

export type SheetImageKind = "jpg" | "png" | "webp";

export function sheetImageKind(bytes: Uint8Array): SheetImageKind | null {
  if (bytes.byteLength < 12 || bytes.byteLength > MAX_SHEET_BYTES) {
    return null;
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "jpg";
  }
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "png";
  }
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "webp";
  }
  return null;
}

export function sheetImageMime(kind: SheetImageKind): string {
  if (kind === "jpg") {
    return "image/jpeg";
  }
  if (kind === "png") {
    return "image/png";
  }
  return "image/webp";
}
