import { NextResponse } from "next/server";

type CountSummary = Record<string, number>;

type TestSheetSummary = {
  title: string;
  rows: number;
  summary: CountSummary;
};

type RemainingIssue = {
  priority: string;
  key: string;
  summary: string;
  status: string;
  version?: string;
};

type QaAnalysisContext = {
  testSheetTitles?: string[];
  scopeKeywords?: string[];
  failPatterns?: string[];
  blockedPatterns?: string[];
};

type AiAnalysisRequest = {
  reportTitle?: string;
  qaSummary?: CountSummary;
  jiraFilteredSummary?: CountSummary;
  jiraStatusSummary?: CountSummary;
  jiraPrioritySummary?: CountSummary;
  testSheets?: TestSheetSummary[];
  remainingIssues?: RemainingIssue[];
  qaFollowUps?: string[];
  qaAnalysisContext?: QaAnalysisContext;
};

type ResponseContent = {
  text?: string;
};

type ResponseOutput = {
  content?: ResponseContent[];
};

type ResponsesApiResult = {
  output_text?: string;
  output?: ResponseOutput[];
};

function extractResponseText(data: ResponsesApiResult) {
  if (data.output_text) {
    return data.output_text;
  }

  return (
    data.output
      ?.flatMap((item) => item.content ?? [])
      .map((content) => content.text)
      .filter(Boolean)
      .join("\n") ?? ""
  );
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured." },
      { status: 500 }
    );
  }

  try {
    const body = (await request.json()) as AiAnalysisRequest;
    const analysisPayload = {
      reportTitle: body.reportTitle ?? "",
      qaSummary: body.qaSummary ?? {},
      jiraFilteredSummary: body.jiraFilteredSummary ?? {},
      jiraStatusSummary: body.jiraStatusSummary ?? {},
      jiraPrioritySummary: body.jiraPrioritySummary ?? {},
      testSheets: (body.testSheets ?? []).map((sheet) => ({
        title: sheet.title,
        rows: sheet.rows,
        summary: sheet.summary,
      })),
      remainingIssues: (body.remainingIssues ?? []).slice(0, 12).map((issue) => ({
        priority: issue.priority,
        key: issue.key,
        summary: issue.summary,
        status: issue.status,
        version: issue.version,
      })),
      qaFollowUps: (body.qaFollowUps ?? []).slice(0, 8),
      qaAnalysisContext: {
        testSheetTitles: body.qaAnalysisContext?.testSheetTitles ?? [],
        scopeKeywords: body.qaAnalysisContext?.scopeKeywords ?? [],
        failPatterns: body.qaAnalysisContext?.failPatterns ?? [],
        blockedPatterns: body.qaAnalysisContext?.blockedPatterns ?? [],
      },
    };

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content:
              [
                "You are a Korean QA lead adding short practical comments to a Feature QA Result Report.",
                "Write like a real QA lead sharing findings, not like an AI report, consultant memo, or executive summary.",
                "Use a natural mixed structure: a short scope sentence, 1 to 3 risk bullets, an optional operational comment sentence, and a final reference sentence.",
                "Keep the whole answer to 3 to 6 short lines or bullets.",
                "Prioritize feature-specific evidence from reportTitle, testSheetTitles, scopeKeywords, failPatterns, remainingIssues, and qaFollowUps.",
                "Do not reuse safe generic keywords across every feature. Mention 운영툴 only when the provided data strongly supports it.",
                "Do not stop at restating issues. Interpret where issues are concentrated, what flow repeats, and what QA risk or operational characteristic it suggests.",
                "Group similar keywords instead of repeating them across lines.",
                "Avoid KPI recitation. Do not list Pass/Fail/Blocked counts unless absolutely necessary.",
                "Avoid stiff or consulting-style wording such as 진행되었음, 요구됨, 병행되어야 함, 필요성이 지속되고 있음, 대응이 요구됨, 위험을 내포함.",
                "Prefer practical QA wording such as 핵심 리스크로 보입니다, 주요 확인 포인트입니다, 후속 확인이 필요합니다, 협의 예정입니다.",
                "Do not use these phrases or meanings: 최종 릴리즈 승인, 서비스 오픈 가능, 프로덕션 배포 승인, 최종 Sign-Off, 전체 서비스 기준, 라이브 대응 완료.",
              ].join(" "),
          },
          {
            role: "user",
            content: [
              "다음 데이터를 기반으로 Feature QA Result Report용 AI Analysis를 작성해주세요.",
              "실제 QA 리드가 결과 리포트에 짧게 남기는 코멘트처럼 작성해주세요.",
              "",
              "출력 규칙:",
              "- 전체 3~6개 흐름으로 작성",
              "- 첫 줄은 bullet 없이 QA Scope 문장으로 작성",
              "- 가운데 1~3줄만 '-' bullet로 작성",
              "- bullet은 Risk Concentration / 반복 흐름 / QA Observation 중심",
              "- 이후 QA Comment / Follow-up이 있으면 bullet 없이 짧은 운영 코멘트로 작성",
              "- 마지막 줄은 bullet 없이 '자세한 내용은 하단 Remaining Issue 및 QA Comment 내용을 참고해주세요.'로 마무리",
              "- 피쳐명을 보고 실제 피쳐 특성이 드러나게 작성",
              "- reportTitle과 scopeKeywords를 우선 반영하고, generic template처럼 쓰지 말 것",
              "- 서브피쳐가 알림/우선순위/읽음/노출 정책이면 해당 특성이 드러나야 함",
              "- 메인피쳐가 이벤트/CTA/상태값/결과 알림이면 해당 특성이 드러나야 함",
              "- 운영툴은 실제 데이터에 반복될 때만 언급",
              "- 긴 복합 문장 사용 금지",
              "- 같은 영역명 반복 금지. 비슷한 키워드는 한 줄로 묶기",
              "- 전체 서비스 QA Sign-Off 또는 배포 승인처럼 쓰지 말 것",
              "- KPI 숫자 재낭독 금지",
              "- 단순히 '~이 반복 확인되었습니다'에서 끝내지 말고, QA 리스크나 운영 특성으로 해석",
              "",
              "출력 예시:",
              "이번 QA는 이벤트 상태값 / CTA / 결과 알림 흐름 중심으로 진행되었습니다.",
              "- Remaining 이슈가 상태 반영 흐름에 몰려 있어 동기화 안정성이 핵심 리스크로 보입니다.",
              "- 운영툴 저장 후 사용자 노출까지의 반영 지연이 주요 확인 포인트입니다.",
              "정책 협의 항목이 남아 있어 운영 기준 정리가 함께 필요한 피쳐로 보입니다.",
              "자세한 내용은 하단 Remaining Issue 및 QA Comment 내용을 참고해주세요.",
              "",
              JSON.stringify(analysisPayload, null, 2),
            ].join("\n"),
          },
        ],
        max_output_tokens: 450,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();

      return NextResponse.json(
        {
          error: "OpenAI Responses API request failed.",
          status: response.status,
          details: errorBody,
        },
        { status: 502 }
      );
    }

    const data = (await response.json()) as ResponsesApiResult;
    const analysis = extractResponseText(data).trim();

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("AI analysis route error:", error);

    return NextResponse.json(
      {
        error: "AI analysis route failed.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
