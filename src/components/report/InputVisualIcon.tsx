import Image from "next/image";
import { Rocket } from "lucide-react";

export type InputVisualIconVariant =
  | "brand"
  | "report-overall"
  | "report-feature"
  | "test-sheet"
  | "jira-sheet"
  | "ai-sparkle"
  | "loading"
  | "generate"
  | "privacy";

type InputVisualIconProps = {
  variant: InputVisualIconVariant;
  className?: string;
  imageClassName?: string;
};

const assetByVariant = {
  brand: "/assets/input/input-brand-mark.svg",
  "report-overall": "/assets/input/recent-overall-report.svg",
  "report-feature": "/assets/input/recent-feature-report.svg",
  "test-sheet": "/assets/input/source-test-sheet.svg",
  "jira-sheet": "/assets/input/source-jira-sheet.svg",
  "ai-sparkle": "/assets/input/cta-ai-sparkle.svg",
  loading: "/assets/input/state-loading.svg",
  privacy: "/assets/input/privacy-shield.svg",
} satisfies Partial<Record<InputVisualIconVariant, string>>;

export function InputVisualIcon({
  variant,
  className = "",
  imageClassName = "",
}: InputVisualIconProps) {
  if (variant === "generate") {
    return (
      <span
        className={`inline-grid size-8 shrink-0 place-items-center rounded-xl border border-indigo-400/40 bg-white/15 text-white shadow-sm shadow-indigo-900/10 ${className}`}
        aria-hidden="true"
      >
        <Rocket className="size-4" />
      </span>
    );
  }

  const assetSrc = assetByVariant[variant];

  return (
    <span
      className={`inline-grid size-8 shrink-0 place-items-center ${className}`}
      aria-hidden="true"
    >
      {/* DESIGN_RESOURCE: public asset path, replace file in /public/assets/input when final art changes. */}
      <Image
        src={assetSrc}
        alt=""
        width={32}
        height={32}
        className={`size-full object-contain ${imageClassName}`}
      />
    </span>
  );
}
