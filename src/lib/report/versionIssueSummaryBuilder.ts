import { getJiraTargetVersionValues } from "@/lib/report/versionInference";
import {
  getRecordValue,
  JIRA_CREATED_FIELDS,
  JIRA_PRIORITY_FIELDS,
} from "@/lib/jira";
import type { CsvRecord, VersionIssueSummaryItem } from "@/types/report";

export function getVersionIssueSortScore(version: string) {
  if (version === "기타 / 버전 없음") {
    return Number.MAX_SAFE_INTEGER;
  }

  const normalizedVersion = version.toLowerCase().replace(/\s+/g, "");
  const versionScore =
    normalizedVersion
      .match(/\d+(?:\.\d+)*/)?.[0]
      ?.split(".")
      .map(Number)
      .reduce((score, number) => score * 100 + number, 0) ?? 0;
  const rcScore = Number(normalizedVersion.match(/rc(\d+)/)?.[1] ?? 0);

  return versionScore * 100 + rcScore;
}

export function extractBaseVersion(value: string) {
  return value.match(/\d+(?:\.\d+)+/)?.[0] ?? "";
}

export function createEmptyVersionIssueSummaryItem(
  version: string
): VersionIssueSummaryItem {
  return {
    version,
    highHighest: 0,
    medium: 0,
    low: 0,
    total: 0,
  };
}

export function addPriorityToVersionIssueSummary(
  item: VersionIssueSummaryItem,
  priority: string
) {
  item.total += 1;

  if (priority === "Highest" || priority === "High") {
    item.highHighest += 1;
  } else if (priority === "Medium") {
    item.medium += 1;
  } else if (priority === "Low" || priority === "Lowest") {
    item.low += 1;
  }
}

export function createVersionIssueSummary(
  records: CsvRecord[]
): VersionIssueSummaryItem[] {
  const groupedSummary = new Map<string, VersionIssueSummaryItem>();

  records.forEach((record) => {
    const versionValues = Array.from(new Set(getJiraTargetVersionValues(record)));
    const targetVersions =
      versionValues.length > 0 ? versionValues : ["기타 / 버전 없음"];
    const priority = getRecordValue(record, JIRA_PRIORITY_FIELDS);

    targetVersions.forEach((version) => {
      const item =
        groupedSummary.get(version) ?? createEmptyVersionIssueSummaryItem(version);

      addPriorityToVersionIssueSummary(item, priority);
      groupedSummary.set(version, item);
    });
  });

  return Array.from(groupedSummary.values()).sort(
    (first, second) =>
      getVersionIssueSortScore(first.version) -
        getVersionIssueSortScore(second.version) ||
      first.version.localeCompare(second.version)
  );
}

export function createBaseVersionIssueSummary(
  records: CsvRecord[]
): VersionIssueSummaryItem[] {
  const groupedSummary = new Map<string, VersionIssueSummaryItem>();
  const debugVersionSamples: Array<{
    rawValues: string[];
    normalizedBaseVersions: string[];
  }> = [];

  records.forEach((record) => {
    const createdValue = getRecordValue(record, JIRA_CREATED_FIELDS);

    if (!createdValue) return;

    const rawVersionValues = getJiraTargetVersionValues(record);
    const baseVersions = Array.from(
      new Set(rawVersionValues.map(extractBaseVersion).filter(Boolean))
    );

    if (debugVersionSamples.length < 20 && rawVersionValues.length > 0) {
      debugVersionSamples.push({
        rawValues: rawVersionValues,
        normalizedBaseVersions: baseVersions,
      });
    }

    if (baseVersions.length === 0) return;

    const priority = getRecordValue(record, JIRA_PRIORITY_FIELDS);

    baseVersions.forEach((version) => {
      const item =
        groupedSummary.get(version) ?? createEmptyVersionIssueSummaryItem(version);

      addPriorityToVersionIssueSummary(item, priority);
      groupedSummary.set(version, item);
    });
  });

  console.log("Overall Version Summary parsedJiraIssueData count:", records.length);
  console.log(
    "Overall Version Summary raw version values sample:",
    debugVersionSamples.map((sample) => sample.rawValues)
  );
  console.log(
    "Overall Version Summary normalized base version values sample:",
    debugVersionSamples.flatMap((sample) =>
      sample.rawValues.map((rawValue) => ({
        rawValue,
        baseVersion: extractBaseVersion(rawValue) || "No parsed base version",
      }))
    )
  );
  console.log(
    "Overall Version Summary grouped version summary:",
    Array.from(groupedSummary.values())
  );

  return Array.from(groupedSummary.values())
    .sort(
      (first, second) =>
        getVersionIssueSortScore(first.version) -
          getVersionIssueSortScore(second.version) ||
        first.version.localeCompare(second.version)
    )
    .slice(-5);
}
