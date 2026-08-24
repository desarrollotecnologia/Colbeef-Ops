/** Solo hojas vigentes según sheetCount (evita hojas huérfanas tras reducir el catálogo). */
export function clipSheetsToFormatCount<T extends { sheetOrder: number }>(
  sheetCount: number,
  sheets: T[]
): T[] {
  if (!Number.isFinite(sheetCount) || sheetCount < 1) return sheets;
  return sheets.filter((s) => s.sheetOrder >= 1 && s.sheetOrder <= sheetCount);
}
