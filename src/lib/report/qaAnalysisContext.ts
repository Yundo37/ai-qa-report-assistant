import { createTopValues, getRecordValueByFields } from "@/lib/report/recordHelpers";
import type { CsvRecord, QaAnalysisContext } from "@/types/report";

export const QA_SCOPE_FIELDS = [
  "Title",
  "Feature",
  "Category_1",
  "Category_2",
  "Category_3",
  "Category 1",
  "Category 2",
  "Category 3",
  "대분류",
  "중분류",
  "소분류",
];
const QA_PATTERN_FIELDS = [
  "Summary",
  "Test Case",
  "TC",
  "Case",
  "Description",
  "Expected Result",
  "Category_1",
  "Category_2",
  "Category_3",
  "대분류",
  "중분류",
  "소분류",
];

export function createQaAnalysisContext(
  records: CsvRecord[],
  testSheetTitles: string[]
): QaAnalysisContext {
  const scopeKeywords = records.flatMap((record) =>
    QA_SCOPE_FIELDS.map((fieldName) => record[fieldName]?.trim() ?? "").filter(
      Boolean
    )
  );
  const failPatternValues = records
    .filter((record) => record["QA Check"]?.trim().toLowerCase() === "fail")
    .map((record) => getRecordValueByFields(record, QA_PATTERN_FIELDS))
    .filter(Boolean);
  const blockedPatternValues = records
    .filter((record) => record["QA Check"]?.trim().toLowerCase() === "blocked")
    .map((record) => getRecordValueByFields(record, QA_PATTERN_FIELDS))
    .filter(Boolean);

  return {
    testSheetTitles,
    scopeKeywords: createTopValues(scopeKeywords, 8),
    failPatterns: createTopValues(failPatternValues, 8),
    blockedPatterns: createTopValues(blockedPatternValues, 5),
  };
}
