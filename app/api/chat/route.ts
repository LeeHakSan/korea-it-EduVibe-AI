import { GoogleGenAI } from "@google/genai";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY가 설정되지 않았습니다.");
}

const ai = new GoogleGenAI({ apiKey });

async function getEmbedding(text: string) {
  const response = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: text,
  });

  const values = response.embeddings?.[0]?.values;

  if (!values || !Array.isArray(values)) {
    throw new Error("임베딩 생성 실패");
  }

  return values;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const message = String(body?.message ?? "").trim();

    if (!message) {
      return Response.json(
        { ok: false, error: "메시지를 입력하세요." },
        { status: 400 }
      );
    }

    // 1. 새 질문 임베딩 만들기
    const embedding = await getEmbedding(message);

    // 2. 비슷한 질문 찾기
    const { data: matches, error: matchError } = await supabaseAdmin.rpc(
      "match_qa_cache",
      {
        query_embedding: embedding,
        match_threshold: 0.9,
        match_count: 1,
      }
    );

    if (matchError) {
      console.error("RPC error:", matchError);
      throw new Error(matchError.message);
    }

    // 3. 캐시 히트면 기존 답변 재사용
    if (matches && matches.length > 0) {
      return Response.json({
        ok: true,
        reply: matches[0].answer,
        cached: true,
      });
    }

    // 4. 없으면 Gemini 호출
    const aiResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: message,
      config: {
        systemInstruction:
          "너는 한국어 학습 도우미 AI 튜터다. 짧고 쉽게 설명하고, 필요하면 간단한 예시를 1개 들어라.",
        temperature: 0.7,
        maxOutputTokens: 400,
      },
    });

    const reply = aiResponse.text?.trim();

    if (!reply) {
      return Response.json(
        { ok: false, error: "모델 응답이 비어 있습니다." },
        { status: 502 }
      );
    }

    // 5. 새 질문/답변/임베딩 저장
    const { error: insertError } = await supabaseAdmin.from("qa_cache").insert({
      question: message,
      answer: reply,
      embedding,
    });

    if (insertError) {
      console.error("Insert error:", insertError);
    }

    return Response.json({
      ok: true,
      reply,
      cached: false,
    });
  } catch (error) {
    console.error("API ERROR:", error);

    return Response.json(
      {
        ok: false,
        error: "처리 중 오류가 발생했습니다.",
        detail: error instanceof Error ? error.message : "알 수 없는 오류",
      },
      { status: 500 }
    );
  }
}