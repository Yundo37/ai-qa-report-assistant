import type { CsvRecord } from "@/types/report";

export function parseCsvRows(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let isInsideQuotes = false;

  for (let index = 0; index < csvText.length; index += 1) {
    const char = csvText[index];
    const nextChar = csvText[index + 1];

    if (char === '"') {
      if (isInsideQuotes && nextChar === '"') {
        currentCell += '"';
        index += 1;
      } else {
        isInsideQuotes = !isInsideQuotes;
      }

      continue;
    }

    if (char === "," && !isInsideQuotes) {
      currentRow.push(currentCell);
      currentCell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !isInsideQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }

      currentRow.push(currentCell);
      rows.push(currentRow);
      currentRow = [];
      currentCell = "";
      continue;
    }

    currentCell += char;
  }

  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell);
    rows.push(currentRow);
  }

  return rows;
}

function normalizeHeader(header: string, index: number) {
  return header.trim() || `Column ${index + 1}`;
}

function rowsToObjects(rows: string[][], headerRowIndex: number): CsvRecord[] {
  const headers = rows[headerRowIndex]?.map(normalizeHeader) ?? [];

  return rows
    .slice(headerRowIndex + 1)
    .filter((row) => row.some((cell) => cell.trim()))
    .map((row) =>
      headers.reduce<CsvRecord>((record, header, index) => {
        record[header] = row[index]?.trim() ?? "";
        return record;
      }, {})
    );
}

export function parseTestSheetCsv(csvText: string): CsvRecord[] {
  const rows = parseCsvRows(csvText);
  const caseSectionIndex = rows.findIndex((row) =>
    row.some((cell) => cell.trim().toLowerCase() === "case")
  );

  if (caseSectionIndex === -1) {
    return [];
  }

  const headerRowIndex = rows.findIndex(
    (row, index) =>
      index > caseSectionIndex && row.some((cell) => cell.trim())
  );

  if (headerRowIndex === -1) {
    return [];
  }

  return rowsToObjects(rows, headerRowIndex);
}

export function parseJiraIssueSheetCsv(csvText: string): CsvRecord[] {
  return rowsToObjects(parseCsvRows(csvText), 0);
}
