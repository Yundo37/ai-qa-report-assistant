"use client";

import Image from "next/image";
import { useState } from "react";

type ReportAssetSlotType =
  | "ai-hero"
  | "ai-summary"
  | "risk"
  | "recommendation"
  | "evidence"
  | "pattern"
  | "status"
  | "follow-up"
  | "metric-test-cases"
  | "metric-jira-issues"
  | "metric-features"
  | "metric-rc-versions"
  | "metric-data-sources"
  | "risk-blocked"
  | "risk-next-event"
  | "risk-note";

type ReportAssetSlotProps = {
  type: ReportAssetSlotType;
  label?: string;
  className?: string;
  imageClassName?: string;
  useAsset?: boolean;
};

const REPORT_ASSET_SRC: Record<ReportAssetSlotType, string> = {
  "ai-hero": "/assets/report/ai-hero-cube-v2.svg",
  "ai-summary": "/assets/report/icon-ai-summary.svg",
  risk: "/assets/report/icon-ai-risk.svg",
  recommendation: "/assets/report/icon-ai-recommendation.svg",
  evidence: "/assets/report/icon-evidence.svg",
  pattern: "/assets/report/pattern-chart-frame.svg",
  status: "/assets/report/status-hero-v2.svg",
  "follow-up": "/assets/report/icon-followup-action.svg",
  "metric-test-cases": "/assets/report/icon-total-test-cases.svg",
  "metric-jira-issues": "/assets/report/icon-jira-issues.svg",
  "metric-features": "/assets/report/icon-features.svg",
  "metric-rc-versions": "/assets/report/icon-rc-versions.svg",
  "metric-data-sources": "/assets/report/icon-data-sources.svg",
  "risk-blocked": "/assets/report/icon-risk-blocked.svg",
  "risk-next-event": "/assets/report/icon-risk-next-event.svg",
  "risk-note": "/assets/report/icon-risk-note.svg",
};

const SLOT_ACCENT: Record<Exclude<ReportAssetSlotType, "ai-hero">, string> = {
  "ai-summary": "from-indigo-500 to-violet-600 shadow-indigo-200",
  risk: "from-red-500 to-rose-600 shadow-red-100",
  recommendation: "from-indigo-500 to-sky-500 shadow-indigo-100",
  evidence: "from-violet-500 to-indigo-500 shadow-violet-100",
  pattern: "from-indigo-500 to-purple-600 shadow-indigo-100",
  status: "from-amber-400 to-orange-500 shadow-amber-100",
  "follow-up": "from-indigo-500 to-violet-500 shadow-indigo-100",
  "metric-test-cases": "from-indigo-500 to-violet-500 shadow-indigo-100",
  "metric-jira-issues": "from-sky-500 to-indigo-500 shadow-sky-100",
  "metric-features": "from-violet-500 to-fuchsia-500 shadow-violet-100",
  "metric-rc-versions": "from-indigo-500 to-blue-500 shadow-indigo-100",
  "metric-data-sources": "from-purple-500 to-indigo-500 shadow-purple-100",
  "risk-blocked": "from-orange-400 to-amber-500 shadow-orange-100",
  "risk-next-event": "from-indigo-500 to-blue-500 shadow-indigo-100",
  "risk-note": "from-violet-500 to-indigo-500 shadow-violet-100",
};

const SLOT_LABEL: Record<Exclude<ReportAssetSlotType, "ai-hero">, string> = {
  "ai-summary": "AI",
  risk: "!",
  recommendation: "GO",
  evidence: "EV",
  pattern: "PT",
  status: "ST",
  "follow-up": "FU",
  "metric-test-cases": "TC",
  "metric-jira-issues": "JI",
  "metric-features": "FE",
  "metric-rc-versions": "RC",
  "metric-data-sources": "DS",
  "risk-blocked": "BL",
  "risk-next-event": "NE",
  "risk-note": "NT",
};

function joinClassNames(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function ReportAssetSlot({
  type,
  label,
  className,
  imageClassName,
  useAsset = true,
}: ReportAssetSlotProps) {
  const [isAssetAvailable, setIsAssetAvailable] = useState(true);
  const assetSrc = useAsset ? REPORT_ASSET_SRC[type] : "";
  const shouldShowAsset = Boolean(assetSrc && isAssetAvailable);

  if (type === "ai-hero") {
    return (
      <div
        className={joinClassNames(
          "relative h-36 overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-100 via-violet-100 to-white",
          className
        )}
        aria-label={label ?? "AI visual resource slot"}
      >
        {shouldShowAsset ? (
          <Image
            src={assetSrc}
            alt={label ?? "AI visual"}
            fill
            sizes="320px"
            className={joinClassNames(
              "scale-125 object-contain p-2",
              imageClassName
            )}
            unoptimized
            onError={() => setIsAssetAvailable(false)}
          />
        ) : (
          <>
            <div className="absolute inset-4 rounded-full border border-indigo-200/70" />
            <div className="absolute inset-x-10 top-8 h-20 rounded-full border border-violet-200/70" />
            <div className="absolute left-1/2 top-1/2 grid size-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 text-2xl font-black text-white shadow-xl shadow-indigo-300/70">
              {label ?? "AI"}
            </div>
            <span className="absolute left-7 top-8 size-2 rounded-full bg-violet-500" />
            <span className="absolute right-9 top-10 size-2 rounded-full bg-indigo-400" />
            <span className="absolute bottom-9 left-12 size-1.5 rounded-full bg-indigo-300" />
            <span className="absolute bottom-8 right-12 size-1.5 rounded-full bg-violet-300" />
          </>
        )}
      </div>
    );
  }

  return (
    <span
      className={joinClassNames(
        `relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br text-[11px] font-black text-white shadow-lg ${SLOT_ACCENT[type]}`,
        className
      )}
      aria-hidden="true"
    >
      {shouldShowAsset ? (
        <Image
          src={assetSrc}
          alt=""
          width={28}
          height={28}
          className={joinClassNames(
            "relative size-5 object-contain",
            imageClassName
          )}
          unoptimized
          onError={() => setIsAssetAvailable(false)}
        />
      ) : (
        <>
          <span
            className={`absolute inset-0 bg-gradient-to-br ${SLOT_ACCENT[type]}`}
          />
          <span className="absolute -right-2 -top-2 size-5 rounded-full bg-white/25" />
          <span className="absolute -bottom-2 -left-1 size-4 rounded-full bg-white/20" />
          <span className="relative">{label ?? SLOT_LABEL[type]}</span>
        </>
      )}
    </span>
  );
}
