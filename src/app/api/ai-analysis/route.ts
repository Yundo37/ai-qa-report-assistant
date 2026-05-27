import { NextResponse } from "next/server";

type CountSummary = Record<string, number>;

type AiAnalysisRequest = {
  qaSummary?: CountSummary;
  jiraFilteredSummary?: CountSummary;
  jiraStatusSummary?: CountSummary;
  jiraPrioritySummary?: CountSummary;
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
    const summaryPayload = {
      qaSummary: body.qaSummary ?? {},
      jiraFilteredSummary: body.jiraFilteredSummary ?? {},
      jiraStatusSummary: body.jiraStatusSummary ?? {},
      jiraPrioritySummary: body.jiraPrioritySummary ?? {},
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
              "You are a concise QA lead. Write 3-5 short Korean lines based only on the provided summary numbers. Do not invent raw issue details.",
          },
          {
            role: "user",
            content: [
              "다음 QA/Jira summary만 기반으로 짧은 QA 분석 문장 3~5줄을 작성해주세요.",
              "Remaining 상태, High/Highest Remaining 여부, 배포완료 Remaining 존재 가능성, Remaining 상태 특징을 중심으로 간결하게 작성해주세요.",
              "",
              JSON.stringify(summaryPayload, null, 2),
            ].join("\n"),
          },
        ],
        max_output_tokens: 400,
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
