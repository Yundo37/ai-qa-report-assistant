import type {
  CountSummary,
  CsvRecord,
  LabelMatchMode,
  QaIssueOverviewSummary,
  RcPrioritySummary,
  RcProgressItem,
  RcProgressSummary,
  RemainingIssue,
} from "@/types/report";

const REMAINING_JIRA_STATUSES = new Set([
  "열림",
  "진행",
  "작업완료",
  "배포완료",
  "QA대기",
  "QA확인",
  "다시열림",
  "미해결",
  "수정보류",
  "수정불가",
  "재현불가",
]);
const RESOLVED_JIRA_STATUSES = new Set(["완료", "닫음", "QA승인"]);
const EXCLUDED_JIRA_STATUSES = new Set(["기획의도", "버그아님", "중복이슈"]);

export const JIRA_STATUS_FIELDS = ["상태", "Status", "상태값", "이슈 상태"];
export const JIRA_PRIORITY_FIELDS = ["우선 순위", "Priority", "우선순위"];
const JIRA_SUMMARY_FIELDS = ["Summary", "요약", "제목"];
const JIRA_KEY_FIELDS = ["Key", "키", "이슈 키", "Issue key"];
const JIRA_VERSION_FIELDS = [
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
  "RC",
  "RC Version",
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
export const JIRA_CREATED_FIELDS = [
  "만듦",
  "Created",
  "Created At",
  "생성일",
  "생성 일시",
  "등록일",
];
const JIRA_UPDATED_FIELDS = [
  "Updated",
  "Updated At",
  "수정일",
  "수정 일시",
  "업데이트일",
  "업데이트",
  "변경일",
  "갱신일",
];
export const JIRA_LABEL_FIELDS = ["Label", "Labels", "라벨", "레이블"];

type RcProgressOptions = {
  reportTitle?: string;
  startDateTime?: string;
  endDateTime?: string | null;
};

export const normalizeJiraStatus = (status: string) =>
  status.trim().replace(/\s+/g, "");

const NORMALIZED_REMAINING_JIRA_STATUSES = new Set(
  Array.from(REMAINING_JIRA_STATUSES).map(normalizeJiraStatus)
);
const NORMALIZED_RESOLVED_JIRA_STATUSES = new Set(
  Array.from(RESOLVED_JIRA_STATUSES).map(normalizeJiraStatus)
);
const NORMALIZED_EXCLUDED_JIRA_STATUSES = new Set(
  Array.from(EXCLUDED_JIRA_STATUSES).map(normalizeJiraStatus)
);

export function getRecordValue(record: CsvRecord, fieldNames: string[]) {
  for (const fieldName of fieldNames) {
    const value = record[fieldName]?.trim();

    if (value) {
      return value;
    }
  }

  return "";
}

export function getJiraStatus(record: CsvRecord) {
  return getRecordValue(record, JIRA_STATUS_FIELDS);
}

function getNormalizedJiraStatus(record: CsvRecord) {
  const status = getJiraStatus(record);
  return status ? normalizeJiraStatus(status) : "";
}

function getJiraVersion(record: CsvRecord) {
  return getRecordValue(record, JIRA_VERSION_FIELDS);
}

function getJiraVersionValues(record: CsvRecord) {
  return JIRA_VERSION_FIELDS.flatMap((fieldName) =>
    (record[fieldName] ?? "")
      .split(/[;,\n]/)
      .map((value) => value.trim())
      .filter(Boolean)
  );
}

function normalizeRcValue(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/_/g, "")
    .replace(/-/g, "");
}

function extractRcCandidate(value: string) {
  const versionRcMatch = value.match(/\b\d+(?:\.\d+)*(?:\s*)rc\s*\d+\b/i);

  if (versionRcMatch) {
    return versionRcMatch[0];
  }

  const rcMatch = value.match(/\brc\s*\d+\b/i);

  return rcMatch?.[0] ?? "";
}

function isSameRcValue(left: string, right: string) {
  const normalizedLeft = normalizeRcValue(left);
  const normalizedRight = normalizeRcValue(right);

  if (!normalizedLeft || !normalizedRight) {
    return false;
  }

  return (
    normalizedLeft === normalizedRight ||
    normalizedLeft.includes(normalizedRight) ||
    normalizedRight.includes(normalizedLeft)
  );
}

function getRcSortScore(value: string) {
  const normalized = normalizeRcValue(value);
  const versionNumbers =
    normalized
      .match(/\d+(?:\.\d+)*/)?.[0]
      ?.split(".")
      .map(Number) ?? [];
  const rcNumber = Number(normalized.match(/rc(\d+)/)?.[1] ?? 0);

  return versionNumbers.reduce((score, number) => score * 100 + number, 0) * 100 + rcNumber;
}

function extractRcNumber(value: string) {
  const normalized = normalizeRcValue(value);
  return normalized.match(/rc(\d+)/)?.[1] ?? "";
}

function createRcDisplayLabel(value: string) {
  const rcNumber = extractRcNumber(value);

  if (rcNumber) {
    return `RC${rcNumber}`;
  }

  return value.trim() || "기타";
}

function createEmptyPrioritySummary(): RcPrioritySummary {
  return {
    Highest: 0,
    High: 0,
    Medium: 0,
    Low: 0,
    Lowest: 0,
  };
}

function addPriorityCount(summary: RcPrioritySummary, priority: string) {
  if (priority in summary) {
    summary[priority as keyof RcPrioritySummary] += 1;
  }
}

function createEmptyRcProgressItem(rc: string): RcProgressItem {
  return {
    rc,
    newIssues: 0,
    fixedIssues: 0,
    resolvedIssues: 0,
    remainingIssues: 0,
    reopenedIssues: 0,
    prioritySummary: createEmptyPrioritySummary(),
  };
}

function isDateInPeriod(
  value: string,
  startDateTime?: string,
  endDateTime?: string | null
) {
  const parsedDate = parseDateTimeValue(value);
  const startDate = startDateTime ? parseDateTimeValue(startDateTime) : null;
  const endDate = endDateTime ? parseDateTimeValue(endDateTime) : new Date();

  if (!parsedDate) {
    return null;
  }

  if (!startDate || !endDate) {
    return true;
  }

  return parsedDate >= startDate && parsedDate <= endDate;
}

function createCandidateValueSample(record: CsvRecord, fieldNames: string[]) {
  return fieldNames.reduce<CsvRecord>((sample, fieldName) => {
    sample[fieldName] = record[fieldName] ?? "";
    return sample;
  }, {});
}

function getVersionDebugRows(records: CsvRecord[]) {
  return records.slice(0, 50).map((record) => {
    const versionValues = getJiraVersionValues(record);
    const versionValue = versionValues.join(" | ");
    const normalizedValues = versionValues.map(normalizeRcValue);

    return {
      key: getRecordValue(record, JIRA_KEY_FIELDS),
      status: getJiraStatus(record),
      priority: getRecordValue(record, JIRA_PRIORITY_FIELDS),
      versionCandidates: createCandidateValueSample(record, JIRA_VERSION_FIELDS),
      versionValue,
      normalizedVersionValue: normalizedValues.join(" | "),
      rcGroup: versionValues.map(createRcDisplayLabel).join(" | "),
      headers: Object.keys(record).join(" | "),
    };
  });
}

function isRemainingJiraIssue(record: CsvRecord) {
  const normalizedStatus = getNormalizedJiraStatus(record);

  return Boolean(
    normalizedStatus &&
      NORMALIZED_REMAINING_JIRA_STATUSES.has(normalizedStatus)
  );
}

function isExcludedJiraIssue(record: CsvRecord) {
  const normalizedStatus = getNormalizedJiraStatus(record);

  return Boolean(
    normalizedStatus &&
      NORMALIZED_EXCLUDED_JIRA_STATUSES.has(normalizedStatus)
  );
}

export function createJiraFilteredSummary(records: CsvRecord[]): CountSummary {
  const summary: CountSummary = {
    Total: 0,
    Remaining: 0,
    Resolved: 0,
    "Excluded / Non-Bug": 0,
    "High / Highest Remaining": 0,
  };

  records.forEach((record) => {
    const normalizedStatus = getNormalizedJiraStatus(record);
    const priority = getRecordValue(record, JIRA_PRIORITY_FIELDS);

    if (normalizedStatus === normalizeJiraStatus("진행 중")) {
      return;
    }

    if (isRemainingJiraIssue(record)) {
      summary.Total += 1;
      summary.Remaining += 1;

      if (priority === "High" || priority === "Highest") {
        summary["High / Highest Remaining"] += 1;
      }

      return;
    }

    if (
      normalizedStatus &&
      NORMALIZED_RESOLVED_JIRA_STATUSES.has(normalizedStatus)
    ) {
      summary.Total += 1;
      summary.Resolved += 1;
      return;
    }

    if (
      normalizedStatus &&
      NORMALIZED_EXCLUDED_JIRA_STATUSES.has(normalizedStatus)
    ) {
      summary.Total += 1;
      summary["Excluded / Non-Bug"] += 1;
    }
  });

  return summary;
}

function parseDateTimeValue(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const normalizedValue = trimmedValue
    .replace(/\./g, "-")
    .replace("T", " ")
    .replace(/\s+/g, " ");
  const dateTimeMatch = normalizedValue.match(
    /^(\d{4})-(\d{1,2})-(\d{1,2})(?:\s+(\d{1,2}):(\d{1,2}))?/
  );

  if (dateTimeMatch) {
    const [, year, month, day, hour = "0", minute = "0"] = dateTimeMatch;
    const parsedDate = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute)
    );

    if (!Number.isNaN(parsedDate.getTime())) {
      return parsedDate;
    }
  }

  const parsedTime = Date.parse(trimmedValue);

  if (Number.isNaN(parsedTime)) {
    return null;
  }

  return new Date(parsedTime);
}

export function filterJiraIssuesByPeriod(
  records: CsvRecord[],
  startDateTime: string,
  endDateTime: string | null
) {
  const startDate = parseDateTimeValue(startDateTime);
  const endDate = endDateTime ? parseDateTimeValue(endDateTime) : new Date();

  if (!startDate || !endDate) {
    return [];
  }

  return records.filter((record) => {
    const createdDate = parseDateTimeValue(
      getRecordValue(record, JIRA_CREATED_FIELDS)
    );

    if (!createdDate) {
      return false;
    }

    return createdDate >= startDate && createdDate <= endDate;
  });
}

export function filterJiraIssuesByLabels(
  records: CsvRecord[],
  labels: string[],
  matchMode: LabelMatchMode
) {
  const normalizedLabels = labels.map((label) => label.trim().toLowerCase());

  return records.filter((record) => {
    const issueLabels = getRecordValue(record, JIRA_LABEL_FIELDS)
      .split(/[;,]/)
      .map((label) => label.trim().toLowerCase())
      .filter(Boolean);

    if (matchMode === "ALL") {
      return normalizedLabels.every((label) => issueLabels.includes(label));
    }

    return normalizedLabels.some((label) => issueLabels.includes(label));
  });
}

export function createFieldValueSample(
  records: CsvRecord[],
  fieldNames: string[]
) {
  return records.slice(0, 10).map((record) =>
    fieldNames.reduce<CsvRecord>((sample, fieldName) => {
      sample[fieldName] = record[fieldName] ?? "";
      return sample;
    }, {})
  );
}

export function createRemainingIssues(records: CsvRecord[]): RemainingIssue[] {
  const priorityOrder: Record<string, number> = {
    Highest: 0,
    High: 1,
    Medium: 2,
    Low: 3,
    Lowest: 4,
  };

  return records
    .filter(isRemainingJiraIssue)
    .map((record) => ({
      priority: getRecordValue(record, JIRA_PRIORITY_FIELDS),
      key: getRecordValue(record, JIRA_KEY_FIELDS),
      summary: getRecordValue(record, JIRA_SUMMARY_FIELDS),
      status: getJiraStatus(record),
      version: getRecordValue(record, JIRA_VERSION_FIELDS),
    }))
    .sort(
      (firstIssue, secondIssue) =>
        (priorityOrder[firstIssue.priority] ?? 99) -
        (priorityOrder[secondIssue.priority] ?? 99)
    );
}

function createIssueOverviewSection(records: CsvRecord[]) {
  const prioritySummary = createEmptyPrioritySummary();

  records.forEach((record) => {
    addPriorityCount(
      prioritySummary,
      getRecordValue(record, JIRA_PRIORITY_FIELDS)
    );
  });

  return {
    total: records.length,
    prioritySummary,
  };
}

export function createQaIssueOverviewSummary(
  records: CsvRecord[]
): QaIssueOverviewSummary {
  const activeIssueRecords = records.filter(
    (record) => !isExcludedJiraIssue(record)
  );
  const resolvedRecords = records.filter((record) => {
    const normalizedStatus = getNormalizedJiraStatus(record);

    return Boolean(
      normalizedStatus &&
        NORMALIZED_RESOLVED_JIRA_STATUSES.has(normalizedStatus)
    );
  });
  const remainingRecords = records.filter(isRemainingJiraIssue);
  const summary = {
    created: createIssueOverviewSection(activeIssueRecords),
    resolved: createIssueOverviewSection(resolvedRecords),
    remaining: createIssueOverviewSection(remainingRecords),
  };

  console.log("QA Issue Overview Summary:", summary);

  return summary;
}

export function createRcProgressSummary(
  records: CsvRecord[],
  options: RcProgressOptions = {}
): RcProgressSummary {
  const reportTitleRc = options.reportTitle
    ? createRcDisplayLabel(extractRcCandidate(options.reportTitle))
    : "";
  console.log("RC Progress Version/RC Candidate Fields:", JIRA_VERSION_FIELDS);
  console.log("RC Progress All Headers:", Object.keys(records[0] ?? {}));
  console.table(getVersionDebugRows(records));
  console.log(
    "RC Progress Row Samples:",
    records.slice(0, 20).map((record) => ({
      key: getRecordValue(record, JIRA_KEY_FIELDS),
      status: getJiraStatus(record),
      priority: getRecordValue(record, JIRA_PRIORITY_FIELDS),
      version: getJiraVersion(record),
      versionCandidates: createCandidateValueSample(record, JIRA_VERSION_FIELDS),
      created: getRecordValue(record, JIRA_CREATED_FIELDS),
      updated: getRecordValue(record, JIRA_UPDATED_FIELDS),
    }))
  );

  const versionCounts = records.reduce<Record<string, number>>((counts, record) => {
    const labels = getJiraVersionValues(record)
      .map(createRcDisplayLabel)
      .filter(Boolean);

    if (labels.length === 0) {
      counts["기타"] = (counts["기타"] ?? 0) + 1;
      return counts;
    }

    labels.forEach((label) => {
      counts[label] = (counts[label] ?? 0) + 1;
    });

    return counts;
  }, {});
  const inferredRcLabel =
    Object.entries(versionCounts)
      .filter(([label]) => label !== "기타")
      .sort(
        (first, second) =>
          second[1] - first[1] ||
          getRcSortScore(second[0]) - getRcSortScore(first[0])
      )[0]?.[0] ?? "";
  const currentRc = reportTitleRc || inferredRcLabel || "기타";
  const groupedItems = new Map<string, RcProgressItem>();
  const createdParseFailedSamples: Array<{
    key: string;
    created: string;
  }> = [];
  const updatedParseFailedSamples: Array<{
    key: string;
    updated: string;
  }> = [];
  const statusSamples = records.slice(0, 20).map((record) => ({
    key: getRecordValue(record, JIRA_KEY_FIELDS),
    status: getJiraStatus(record),
    normalizedStatus: getNormalizedJiraStatus(record),
  }));

  console.log("RC Progress filteredJiraIssues count:", records.length);
  console.log("RC Progress version candidate fields:", JIRA_VERSION_FIELDS);
  console.log(
    "RC Progress version value samples:",
    records.slice(0, 20).map((record) => ({
      key: getRecordValue(record, JIRA_KEY_FIELDS),
      values: getJiraVersionValues(record),
      candidates: createCandidateValueSample(record, JIRA_VERSION_FIELDS),
    }))
  );
  console.log("RC Progress version normalized counts:", versionCounts);
  console.log("RC Progress reportTitle RC candidate:", reportTitleRc);
  console.log("RC Progress Inferred Current RC:", currentRc);
  console.log("RC Progress fallback used:", versionCounts["기타"] === records.length);
  console.log("RC Progress Effective Rows:", records.length);

  records.forEach((record) => {
    const versionLabels = getJiraVersionValues(record)
      .map(createRcDisplayLabel)
      .filter(Boolean);
    const rcLabels = versionLabels.length > 0 ? Array.from(new Set(versionLabels)) : ["기타"];
    const normalizedStatus = getNormalizedJiraStatus(record);
    const key = getRecordValue(record, JIRA_KEY_FIELDS);
    const priority = getRecordValue(record, JIRA_PRIORITY_FIELDS);
    const createdValue = getRecordValue(record, JIRA_CREATED_FIELDS);
    const updatedValue = getRecordValue(record, JIRA_UPDATED_FIELDS);
    const createdInPeriod = isDateInPeriod(
      createdValue,
      options.startDateTime,
      options.endDateTime
    );
    const updatedInPeriod = isDateInPeriod(
      updatedValue,
      options.startDateTime,
      options.endDateTime
    );

    if (createdValue && createdInPeriod === null) {
      createdParseFailedSamples.push({ key, created: createdValue });
    }

    if (updatedValue && updatedInPeriod === null) {
      updatedParseFailedSamples.push({ key, updated: updatedValue });
    }

    rcLabels.forEach((rcLabel) => {
      const item =
        groupedItems.get(rcLabel) ?? createEmptyRcProgressItem(rcLabel);

      item.newIssues += 1;

      if (
        normalizedStatus &&
        NORMALIZED_RESOLVED_JIRA_STATUSES.has(normalizedStatus) &&
        (updatedInPeriod === true || updatedInPeriod === null)
      ) {
        item.fixedIssues += 1;
        item.resolvedIssues += 1;
      }

      if (isRemainingJiraIssue(record)) {
        item.remainingIssues += 1;
      }

      if (normalizedStatus === normalizeJiraStatus("다시열림")) {
        item.reopenedIssues += 1;
      }

      addPriorityCount(item.prioritySummary, priority);

      groupedItems.set(rcLabel, item);
    });
  });

  const items = Array.from(groupedItems.values()).sort((first, second) => {
    if (first.rc === "기타") return 1;
    if (second.rc === "기타") return -1;
    return getRcSortScore(first.rc) - getRcSortScore(second.rc);
  });
  const currentItem =
    items.find((item) => isSameRcValue(item.rc, currentRc)) ??
    items.filter((item) => item.rc !== "기타").at(-1) ??
    items[0] ??
    createEmptyRcProgressItem("기타");
  const summary: RcProgressSummary = {
    rcLabel: currentItem.rc,
    newIssues: currentItem.newIssues,
    fixedIssues: currentItem.fixedIssues,
    resolvedIssues: currentItem.resolvedIssues,
    remainingIssues: currentItem.remainingIssues,
    reopenedIssues: currentItem.reopenedIssues,
    items,
  };

  console.log("RC Progress newIssues:", summary.newIssues);
  console.log("RC Progress resolvedIssues:", summary.resolvedIssues);
  console.log("RC Progress remainingIssues:", summary.remainingIssues);
  console.log("RC Progress reopenedIssues:", summary.reopenedIssues);
  console.log(
    "RC Progress created parse failed samples:",
    createdParseFailedSamples.slice(0, 10)
  );
  console.log(
    "RC Progress updated parse failed samples:",
    updatedParseFailedSamples.slice(0, 10)
  );
  console.log("RC Progress status samples:", statusSamples);
  console.log("RC Progress items:", items);

  return summary;
}
