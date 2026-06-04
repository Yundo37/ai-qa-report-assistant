import { logQaSummary } from "@/lib/report/logging";
import { createQaAnalysisContext } from "@/lib/report/qaAnalysisContext";
import { createQaSummary, extractQaFollowUps } from "@/lib/qaSummary";
import type { CsvRecord } from "@/types/report";

type SelectedTestSheet = {
  title: string;
};

export function createQaSummaryBundle(
  allParsedTestSheetData: CsvRecord[],
  parsedTestSheetDataList: CsvRecord[][],
  selectedTestSheets: SelectedTestSheet[]
) {
  const qaTotalSummary = createQaSummary(allParsedTestSheetData);
  const qaFollowUps = extractQaFollowUps(allParsedTestSheetData);
  const qaAnalysisContext = createQaAnalysisContext(
    allParsedTestSheetData,
    selectedTestSheets.map((sheet) => sheet.title)
  );
  const testSheetSummaries = parsedTestSheetDataList.map(
    (parsedTestSheetData, index) => ({
      title: selectedTestSheets[index].title,
      rows: parsedTestSheetData.length,
      summary: createQaSummary(parsedTestSheetData),
    })
  );

  logQaSummary("QA Summary - Total", allParsedTestSheetData);
  parsedTestSheetDataList.forEach((parsedTestSheetData, index) => {
    logQaSummary(
      `QA Summary - Test Sheet ${index + 1}`,
      parsedTestSheetData,
      true
    );
  });

  return {
    qaTotalSummary,
    qaFollowUps,
    qaAnalysisContext,
    testSheetSummaries,
  };
}
