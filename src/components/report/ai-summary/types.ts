import type { CSSProperties } from "react";

export type SignalTone = "stable" | "attention" | "risk" | "neutral";
export type InsightTone = "stable" | "caution" | "risk" | "neutral";

export type SummaryMetricStripItem = {
  label: string;
  value: number;
  slotType:
    | "metric-test-cases"
    | "metric-jira-issues"
    | "metric-rc-versions"
    | "follow-up"
    | "risk";
};

export type SummaryRiskSignal = {
  title: string;
  value?: string | number;
  description: string;
  tone: SignalTone;
};

export type SummaryPatternItem = {
  label: string;
  value?: string | number;
};

export type SummaryInsightCard = {
  tone?: InsightTone;
  headline?: string;
  description?: string;
};

export type SummaryViewModel = {
  releaseJudgment: {
    title: string;
    description: string;
  };
  riskSignals: SummaryRiskSignal[];
  patternInsight: {
    title: string;
    description: string;
    patterns: SummaryPatternItem[];
  };
  qaCheckpoints: string[];
};

export type SummaryAnalysisSection = {
  title: string;
  body: string;
};

export type SummaryPriorityCheckItem = {
  title: string;
  reason: string;
  evidence?: string;
  priority?: "high" | "medium" | "low";
};

export type PassRateDonutStyle = CSSProperties;
