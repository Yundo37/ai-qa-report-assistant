import { normalizeTargetVersion } from "@/lib/report/versionHelpers";
import type { CsvRecord } from "@/types/report";

const JIRA_TARGET_VERSION_FIELDS = [
  "Version",
  "Versions",
  "Fix Version",
  "Fix versions",
  "Fix Version/s",
  "FixVersions",
  "Fix version",
  "Fix version/s",
  "Affects Version",
  "Affects versions",
  "Affects Version/s",
  "Affected Version",
  "Affected versions",
  "버전",
  "대상 버전",
  "대상버전",
  "수정 버전",
  "수정버전",
  "영향 버전",
  "영향버전",
  "릴리즈",
  "릴리즈 버전",
  "RC",
  "RC Version",
  "RC 버전",
  "RC 버전",
  "Target Version",
  "Target version",
  "Release",
  "Release Version",
  "릴리즈",
  "릴리즈 버전",
  "버전",
  "대상 버전",
  "대상버전",
  "수정 버전",
  "수정버전",
  "영향 버전",
  "영향버전",
];

export function inferTargetVersionFromJiraIssues(records: CsvRecord[]) {
  const counts = new Map<string, number>();

  records.forEach((record) => {
    JIRA_TARGET_VERSION_FIELDS.forEach((fieldName) => {
      const rawValue = record[fieldName]?.trim();

      if (!rawValue) return;

      rawValue
        .split(/[,/|]/)
        .map(normalizeTargetVersion)
        .filter(Boolean)
        .forEach((version) => {
          counts.set(version, (counts.get(version) ?? 0) + 1);
        });
    });
  });

  return (
    Array.from(counts.entries()).sort(
      (first, second) =>
        second[1] - first[1] || first[0].localeCompare(second[0])
    )[0]?.[0] ?? ""
  );
}

export function getJiraTargetVersionValues(record: CsvRecord) {
  return JIRA_TARGET_VERSION_FIELDS.flatMap((fieldName) =>
    (record[fieldName] ?? "")
      .split(/[,/|]/)
      .map(normalizeTargetVersion)
      .filter(Boolean)
  );
}
