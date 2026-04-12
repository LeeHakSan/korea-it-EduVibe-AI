import { NextResponse } from "next/server";

type QuizItem = {
  id: number;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
  unit: string;
};

function extractJsonArray(text: string) {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("JSON 배열을 찾지 못했습니다.");
  }
  return text.slice(start, end + 1);
}

function sanitizeQuiz(data: any): QuizItem[] {
  if (!Array.isArray(data)) {
    throw new Error("응답이 배열 형식이 아닙니다.");
  }

  return data.slice(0, 5).map((item, index) => {
    const options = Array.isArray(item?.options) ? item.options.slice(0, 4) : [];

    if (options.length !== 4) {
      throw new Error(`${index + 1}번 문제의 보기 개수가 4개가 아닙니다.`);
    }

    const answer =
      typeof item?.answer === "number" && item.answer >= 0 && item.answer <= 3
        ? item.answer
        : 0;

    return {
      id: index + 1,
      question: String(item?.question ?? `문제 ${index + 1}`),
      options: options.map((opt: any) => String(opt)),
      answer,
      explanation: String(item?.explanation ?? "해설이 제공되지 않았습니다."),
      unit: String(item?.unit ?? "학습 자료"),
    };
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const content = String(body?.content ?? "").trim();
    const title = String(body?.title ?? "학습 자료").trim();

    if (!content) {
      return NextResponse.json(
        { error: "문제 생성을 위한 자료 내용이 없습니다." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY가 설정되어 있지 않습니다." },
        { status: 500 }
      );
    }

    const prompt = `
너는 학원 수업용 쪽지시험 생성기다.
아래 학습 자료를 바탕으로 학생용 객관식 문제 5개를 만들어라.

반드시 지켜라:
- 총 5문항
- 각 문항은 4지선다
- answer는 정답 보기의 인덱스 번호(0~3)
- explanation은 학생이 이해하기 쉽게 1~2문장
- unit은 문제가 속한 단원명
- 출력은 JSON 배열만 출력
- 코드블록 마크다운(\`\`\`) 절대 쓰지 마라
- 배열 외의 설명 문장 절대 쓰지 마라

출력 형식 예시:
[
  {
    "question": "문제 내용",
    "options": ["보기1", "보기2", "보기3", "보기4"],
    "answer": 0,
    "explanation": "해설",
    "unit": "단원명"
  }
]

자료 제목:
${title}

학습 자료:
${content.slice(0, 12000)}
`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    );

    const geminiData = await geminiRes.json();

    if (!geminiRes.ok) {
      return NextResponse.json(
        {
          error:
            geminiData?.error?.message ??
            `Gemini 호출 실패 (${geminiRes.status})`,
        },
        { status: 500 }
      );
    }

    const rawText =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!rawText) {
      return NextResponse.json(
        { error: "AI가 문제를 생성하지 못했습니다." },
        { status: 500 }
      );
    }

    const jsonText = extractJsonArray(rawText);
    const parsed = JSON.parse(jsonText);
    const quiz = sanitizeQuiz(parsed);

    return NextResponse.json({ quiz });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "문제 생성 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}