import { NextResponse } from "next/server";

type SpreadsheetInfoRequest = {
  spreadsheetId?: string;
};

type GoogleSheetProperties = {
  sheetId?: number;
  title?: string;
};

type GoogleSheetsApiResponse = {
  properties?: {
    title?: string;
  };
  sheets?: Array<{
    properties?: GoogleSheetProperties;
  }>;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SpreadsheetInfoRequest;
    const spreadsheetId = body.spreadsheetId?.trim();

    if (!spreadsheetId) {
      return NextResponse.json(
        { error: "spreadsheetId is required." },
        { status: 400 }
      );
    }

    const apiUrl = new URL(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`
    );
    apiUrl.searchParams.set(
      "fields",
      "properties.title,sheets.properties(sheetId,title)"
    );

    if (process.env.GOOGLE_API_KEY) {
      apiUrl.searchParams.set("key", process.env.GOOGLE_API_KEY);
    }

    const response = await fetch(apiUrl.toString(), {
      cache: "no-store",
    });

    if (!response.ok) {
      const errorBody = await response.text();

      return NextResponse.json(
        {
          error: "Google Sheets metadata request failed.",
          status: response.status,
          details: errorBody,
          hint: "Public sheet metadata may require GOOGLE_API_KEY.",
        },
        { status: 502 }
      );
    }

    const data = (await response.json()) as GoogleSheetsApiResponse;

    return NextResponse.json({
      title: data.properties?.title ?? "",
      sheets:
        data.sheets?.map((sheet) => ({
          title: sheet.properties?.title ?? "",
          gid:
            typeof sheet.properties?.sheetId === "number"
              ? String(sheet.properties.sheetId)
              : "",
        })) ?? [],
    });
  } catch (error) {
    console.error("Spreadsheet info route error:", error);

    return NextResponse.json(
      {
        error: "Spreadsheet info route failed.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
