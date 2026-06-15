import { createRcProgressSummary } from "@/lib/jira";
import type {
  CsvRecord,
  RcPrioritySummary,
  RcProgressItem,
  RcProgressSummary,
} from "@/types/report";

type CreateRcProgressBundleParams = {
  filteredJiraIssues: CsvRecord[];
  reportTitle: string;
  targetRcVersion?: string;
  startDateTime: string;
  endDateTime: string | null;
};

function normalizeRcLabel(value?: string | null) {
  const trimmedValue = (value ?? "").trim();
  const matchedRc = trimmedValue.match(/(?:^|\b)rc\s*0*(\d+)\b/i);
  const matchedNumber = trimmedValue.match(/^0*(\d+)$/);
  const rcNumberText = matchedRc?.[1] ?? matchedNumber?.[1];

  if (!rcNumberText) {
    return "";
  }

  const rcNumber = Number(rcNumberText);
  return Number.isFinite(rcNumber) && rcNumber > 0 ? `RC${rcNumber}` : "";
}

function getRcNumber(rcLabel: string) {
  const normalizedLabel = normalizeRcLabel(rcLabel);
  const rcNumber = normalizedLabel.match(/\d+/)?.[0];
  return rcNumber ? Number(rcNumber) : 0;
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

function sumRcProgressItems(
  items: RcProgressItem[],
  key: keyof Pick<
    RcProgressItem,
    | "newIssues"
    | "fixedIssues"
    | "resolvedIssues"
    | "remainingIssues"
    | "reopenedIssues"
  >
) {
  return items.reduce((sum, item) => sum + item[key], 0);
}

function fillTargetRcProgressRows(
  rcProgress: RcProgressSummary,
  targetRcVersion?: string
): RcProgressSummary {
  const targetRcLabel = normalizeRcLabel(targetRcVersion);
  const targetRcNumber = getRcNumber(targetRcLabel);

  if (!targetRcNumber) {
    return rcProgress;
  }

  const itemsByRc = new Map<string, RcProgressItem>();

  rcProgress.items.forEach((item) => {
    const normalizedRc = normalizeRcLabel(item.rc) || item.rc;
    itemsByRc.set(normalizedRc, {
      ...item,
      rc: normalizedRc,
    });
  });

  for (let rcNumber = 1; rcNumber <= targetRcNumber; rcNumber += 1) {
    const rcLabel = `RC${rcNumber}`;
    if (!itemsByRc.has(rcLabel)) {
      itemsByRc.set(rcLabel, createEmptyRcProgressItem(rcLabel));
    }
  }

  const items = Array.from(itemsByRc.values()).sort((firstItem, secondItem) => {
    const firstRcNumber = getRcNumber(firstItem.rc);
    const secondRcNumber = getRcNumber(secondItem.rc);
    return (
      firstRcNumber - secondRcNumber ||
      firstItem.rc.localeCompare(secondItem.rc)
    );
  });

  return {
    ...rcProgress,
    rcLabel: `RC1~${targetRcLabel}`,
    newIssues: sumRcProgressItems(items, "newIssues"),
    fixedIssues: sumRcProgressItems(items, "fixedIssues"),
    resolvedIssues: sumRcProgressItems(items, "resolvedIssues"),
    remainingIssues: sumRcProgressItems(items, "remainingIssues"),
    reopenedIssues: sumRcProgressItems(items, "reopenedIssues"),
    items,
  };
}

export function createRcProgressBundle({
  filteredJiraIssues,
  reportTitle,
  targetRcVersion,
  startDateTime,
  endDateTime,
}: CreateRcProgressBundleParams) {
  const rcProgress = createRcProgressSummary(filteredJiraIssues, {
    reportTitle,
    startDateTime,
    endDateTime,
  });

  return {
    rcProgress: fillTargetRcProgressRows(rcProgress, targetRcVersion),
  };
}
