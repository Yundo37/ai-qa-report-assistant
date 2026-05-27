import type { ParsedSheetUrl, SpreadsheetInfo } from "@/types/report";

export function parseGoogleSheetUrl(url: string): ParsedSheetUrl {
  const spreadsheetIdMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  const gidMatch = url.match(/[?&#]gid=([0-9]+)/);

  return {
    url,
    spreadsheetId: spreadsheetIdMatch ? spreadsheetIdMatch[1] : null,
    gid: gidMatch ? gidMatch[1] : null,
  };
}

export function isGoogleSpreadsheetUrl(url: string) {
  return /^https:\/\/docs\.google\.com\/spreadsheets\/d\//.test(url.trim());
}

export function buildGoogleSheetCsvUrl(spreadsheetId: string, gid: string) {
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;
}

export async function fetchGoogleSheetCsv(
  spreadsheetId: string,
  gid: string
) {
  const csvUrl = buildGoogleSheetCsvUrl(spreadsheetId, gid);

  const response = await fetch(csvUrl);

  if (!response.ok) {
    throw new Error("Google Sheet fetch failed");
  }

  const csvText = await response.text();

  return csvText;
}

export async function fetchSpreadsheetInfo(spreadsheetId: string) {
  const response = await fetch("/api/spreadsheet-info", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ spreadsheetId }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Spreadsheet Info Response Body:", errorBody);
    throw new Error("Spreadsheet info fetch failed");
  }

  return (await response.json()) as SpreadsheetInfo;
}
