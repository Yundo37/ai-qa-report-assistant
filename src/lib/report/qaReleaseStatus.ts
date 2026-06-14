export type QaReleaseStatusTone = "stable" | "caution" | "risk";

export type QaReleasePrioritySummary = {
  Highest?: number;
  High?: number;
  Medium?: number;
  Low?: number;
  Lowest?: number;
};

function getCount(value: number | undefined) {
  return typeof value === "number" ? value : 0;
}

export function getQaReleaseStatusTone({
  totalTc,
  blockedCount,
  remainingPriority,
}: {
  totalTc: number;
  blockedCount: number;
  remainingPriority: QaReleasePrioritySummary;
}): QaReleaseStatusTone {
  const highHighestRemainingCount =
    getCount(remainingPriority.Highest) + getCount(remainingPriority.High);
  const mediumRemainingCount = getCount(remainingPriority.Medium);
  const blockedRate = totalTc > 0 ? blockedCount / totalTc : 0;

  if (highHighestRemainingCount > 0 || blockedRate >= 0.2) {
    return "risk";
  }

  if (mediumRemainingCount > 0 || blockedRate >= 0.1) {
    return "caution";
  }

  return "stable";
}

export function createEmptyPrioritySummary(): Required<QaReleasePrioritySummary> {
  return {
    Highest: 0,
    High: 0,
    Medium: 0,
    Low: 0,
    Lowest: 0,
  };
}
