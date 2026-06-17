"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import {
  FileImage,
  FileText,
  Menu,
  Plus,
  Sheet,
} from "lucide-react";

type ReportActionRailProps = {
  reportCanvasRef: RefObject<HTMLDivElement | null>;
  reportVersionText: string;
  reportRcText: string;
  reportFileNamePrefix?: string;
  onStartNewReport: () => void;
  onCreateResultSheet: () => void;
  isCreatingResultSheet: boolean;
};

type ExportFormat = "png" | "pdf";

const REPORT_CAPTURE_BACKGROUND = "#f8fafc";

function createReportFileName(
  extension: ExportFormat,
  reportVersionText: string,
  reportRcText: string,
  reportFileNamePrefix: string
) {
  const versionParts = [reportVersionText, reportRcText]
    .map((value) => value.trim())
    .filter(Boolean)
    .join("-");
  const safeVersion = versionParts
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const dateText = new Date().toISOString().slice(0, 10);

  return [
    reportFileNamePrefix,
    safeVersion || dateText,
    safeVersion ? dateText : "",
  ]
    .filter(Boolean)
    .join("-")
    .concat(`.${extension}`);
}

function downloadDataUrl(dataUrl: string, fileName: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = fileName;
  link.click();
}

async function captureReportCanvas(reportCanvas: HTMLElement) {
  const ignoredElements = Array.from(
    reportCanvas.querySelectorAll<HTMLElement>('[data-export-ignore="true"]')
  );
  const previousDisplayValues = ignoredElements.map(
    (element) => element.style.display
  );

  ignoredElements.forEach((element) => {
    element.style.display = "none";
  });

  try {
    return await toPng(reportCanvas, {
      backgroundColor: REPORT_CAPTURE_BACKGROUND,
      cacheBust: true,
      pixelRatio: 2,
      width: reportCanvas.scrollWidth,
      height: reportCanvas.scrollHeight,
      style: {
        width: `${reportCanvas.scrollWidth}px`,
        height: `${reportCanvas.scrollHeight}px`,
      },
    });
  } finally {
    ignoredElements.forEach((element, index) => {
      element.style.display = previousDisplayValues[index];
    });
  }
}

async function getImageSize(dataUrl: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      reject(new Error("Report image could not be prepared for PDF export."));
    };
    image.src = dataUrl;
  });
}

export function ReportActionRail({
  reportCanvasRef,
  reportVersionText,
  reportRcText,
  reportFileNamePrefix = "overall-qa-report",
  onStartNewReport,
  onCreateResultSheet,
  isCreatingResultSheet,
}: ReportActionRailProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [isPinned, setIsPinned] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isSavingImage, setIsSavingImage] = useState(false);
  const [isSavingPdf, setIsSavingPdf] = useState(false);

  const isExporting = isCreatingResultSheet || isSavingImage || isSavingPdf;
  const isMenuOpen = isPinned || isHovered;

  useEffect(() => {
    if (!isMenuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsPinned(false);
      }
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) {
        setIsPinned(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isMenuOpen]);

  const handleSaveImage = async () => {
    if (isSavingImage) return;

    const reportCanvas = reportCanvasRef.current;
    if (!reportCanvas) {
      window.alert("저장할 리포트 캔버스를 찾을 수 없습니다.");
      return;
    }

    setIsSavingImage(true);
    try {
      const dataUrl = await captureReportCanvas(reportCanvas);
      downloadDataUrl(
        dataUrl,
        createReportFileName(
          "png",
          reportVersionText,
          reportRcText,
          reportFileNamePrefix
        )
      );
    } catch (error) {
      console.error("Report image export failed:", error);
      window.alert("이미지 저장에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsSavingImage(false);
    }
  };

  const handleSavePdf = async () => {
    if (isSavingPdf) return;

    const reportCanvas = reportCanvasRef.current;
    if (!reportCanvas) {
      window.alert("저장할 리포트 캔버스를 찾을 수 없습니다.");
      return;
    }

    setIsSavingPdf(true);
    try {
      const dataUrl = await captureReportCanvas(reportCanvas);
      const imageSize = await getImageSize(dataUrl);
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 8;
      const contentWidth = pageWidth - margin * 2;
      const contentHeight = pageHeight - margin * 2;
      const imageHeight = (imageSize.height * contentWidth) / imageSize.width;
      let position = margin;
      let remainingHeight = imageHeight;

      pdf.addImage(dataUrl, "PNG", margin, position, contentWidth, imageHeight);
      remainingHeight -= contentHeight;

      while (remainingHeight > 0) {
        position -= contentHeight;
        pdf.addPage();
        pdf.addImage(dataUrl, "PNG", margin, position, contentWidth, imageHeight);
        remainingHeight -= contentHeight;
      }

      pdf.save(
        createReportFileName(
          "pdf",
          reportVersionText,
          reportRcText,
          reportFileNamePrefix
        )
      );
    } catch (error) {
      console.error("Report PDF export failed:", error);
      window.alert("PDF 저장에 실패했습니다. 이미지 저장을 먼저 이용해주세요.");
    } finally {
      setIsSavingPdf(false);
    }
  };

  const mainButtonClass =
    "flex size-14 items-center justify-center rounded-2xl border border-violet-300/40 bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-indigo-300/45 backdrop-blur transition hover:from-violet-400 hover:to-indigo-500";
  const panelButtonClass =
    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div
      ref={panelRef}
      data-report-action-rail="true"
      className="fixed bottom-24 left-2 z-40 flex max-w-[calc(100vw-1rem)] flex-col-reverse items-start gap-3 xl:bottom-28"
      aria-label="Report actions"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        type="button"
        className={mainButtonClass}
        onClick={() => setIsPinned((value) => !value)}
        aria-label={isPinned ? "리포트 액션 고정 해제" : "리포트 액션 고정"}
        aria-expanded={isMenuOpen}
        title={isPinned ? "리포트 액션 고정 해제" : "리포트 액션 고정"}
      >
        <Menu className="size-6 text-white" aria-hidden="true" />
      </button>

      {isMenuOpen && (
        <aside className="w-[calc(100vw-2rem)] max-w-72 rounded-2xl border border-indigo-100 bg-white/90 p-3 shadow-2xl shadow-indigo-200/40 backdrop-blur sm:w-72">
          <div className="border-b border-indigo-50 px-2 pb-3">
            <p className="text-xs font-bold uppercase tracking-wide text-indigo-500">
              Report Actions
            </p>
          </div>
          <div className="py-2">
            <button
              type="button"
              className={panelButtonClass}
              onClick={onStartNewReport}
              title="새 리포트"
            >
              <Plus className="size-4 text-indigo-500" aria-hidden="true" />
              <span>새 리포트</span>
            </button>
          </div>
          <div className="border-t border-indigo-50 pt-2">
            <p className="px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">
              Export
            </p>
            <button
              type="button"
              className={panelButtonClass}
              onClick={onCreateResultSheet}
              disabled={isCreatingResultSheet}
              title="Google Sheet"
            >
              <Sheet className="size-4 text-indigo-500" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                {isCreatingResultSheet ? "내보내는 중..." : "Google Sheet"}
              </span>
              <span className="rounded-full border border-indigo-100 bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-indigo-600">
                Beta
              </span>
            </button>
            <button
              type="button"
              className={panelButtonClass}
              onClick={handleSaveImage}
              disabled={isExporting}
              title="이미지 저장"
            >
              <FileImage className="size-4 text-indigo-500" aria-hidden="true" />
              <span>{isSavingImage ? "저장 중..." : "이미지 저장"}</span>
            </button>
            <button
              type="button"
              className={panelButtonClass}
              onClick={handleSavePdf}
              disabled={isExporting}
              title="PDF 저장"
            >
              <FileText className="size-4 text-indigo-500" aria-hidden="true" />
              <span>{isSavingPdf ? "저장 중..." : "PDF 저장"}</span>
            </button>
          </div>
        </aside>
      )}
    </div>
  );
}
