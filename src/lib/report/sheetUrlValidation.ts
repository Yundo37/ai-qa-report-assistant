import {
  isGoogleSpreadsheetUrl,
  parseGoogleSheetUrl,
} from "@/lib/googleSheet";

type CreateSheetUrlValidationParams = {
  validTestSheetUrls: string[];
  jiraIssueSheetUrl: string;
};

export function createSheetUrlValidation({
  validTestSheetUrls,
  jiraIssueSheetUrl,
}: CreateSheetUrlValidationParams) {
  const invalidFormatItems: string[] = [];
  validTestSheetUrls.forEach((url, index) => {
    if (!isGoogleSpreadsheetUrl(url)) {
      invalidFormatItems.push(
        `Test Sheet ${index + 1} URL이 Google Spreadsheet 형식이 아닙니다.`
      );
    }
  });
  if (!isGoogleSpreadsheetUrl(jiraIssueSheetUrl)) {
    invalidFormatItems.push(
      "Jira Issue Sheet URL이 Google Spreadsheet 형식이 아닙니다."
    );
  }

  const parsedTestSheets = validTestSheetUrls.map((url) =>
    parseGoogleSheetUrl(url)
  );
  const parsedJiraIssueSheet = parseGoogleSheetUrl(jiraIssueSheetUrl);
  const invalidParsedItems: string[] = [];

  parsedTestSheets.forEach((sheet, index) => {
    if (!sheet.spreadsheetId || !sheet.gid) {
      invalidParsedItems.push(
        `Test Sheet ${index + 1} URL에서 spreadsheetId 또는 gid를 찾을 수 없습니다.`
      );
    }
  });
  if (!parsedJiraIssueSheet.spreadsheetId || !parsedJiraIssueSheet.gid) {
    invalidParsedItems.push(
      "Jira Issue Sheet URL에서 spreadsheetId 또는 gid를 찾을 수 없습니다."
    );
  }

  return {
    invalidFormatItems,
    parsedTestSheets,
    parsedJiraIssueSheet,
    invalidParsedItems,
  };
}
