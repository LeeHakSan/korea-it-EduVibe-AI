import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type ChatRequestBody = {
  messages?: ChatMessage[];
};

function extractPrompt(messages: ChatMessage[]) {
  const koreanPolicy = [
    '중요 규칙:',
    '- 답변은 반드시 한국어(ko-KR)로만 작성하세요.',
    '- 영어 문장으로 답하지 마세요.',
    '- 한국인 학습자를 위한 친절한 존댓말로 답변하세요.',
  ].join('\n');

  const system = messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n\n');
  const conversation = messages
    .filter((m) => m.role !== 'system')
    .map((m) => `${m.role === 'assistant' ? 'assistant' : 'user'}: ${m.content}`)
    .join('\n');

  if (system) {
    return `${koreanPolicy}\n\n${system}\n\n${conversation}`;
  }
  return `${koreanPolicy}\n\n${conversation}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ChatRequestBody;
    const messages = Array.isArray(body.messages) ? body.messages : [];

    if (messages.length === 0) {
      return NextResponse.json({ error: 'messages가 비어 있습니다.' }, { status: 400 });
    }

    const apiKey =
      process.env.GEMINI_API_KEY ??
      process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI API 키가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    const prompt = extractPrompt(messages);

    type ModelItem = {
      name?: string;
      supportedGenerationMethods?: string[];
    };

    const preferredOrder = [
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite',
      'gemini-1.5-flash-latest',
      'gemini-1.5-flash',
      'gemini-1.5-pro-latest',
      'gemini-1.5-pro',
    ];

    const apiVersions = ['v1', 'v1beta'];
    let lastError = 'Gemini API 호출에 실패했습니다.';

    for (const version of apiVersions) {
      const modelsRes = await fetch(
        `https://generativelanguage.googleapis.com/${version}/models?key=${apiKey}`,
        { method: 'GET' }
      );
      const modelsJson = await modelsRes.json();

      if (!modelsRes.ok) {
        lastError = modelsJson?.error?.message ?? lastError;
        continue;
      }

      const models = (modelsJson?.models ?? []) as ModelItem[];
      const generatable = models
        .filter((m) => (m.supportedGenerationMethods ?? []).includes('generateContent'))
        .map((m) => (m.name ?? '').replace(/^models\//, ''))
        .filter(Boolean);

      const selectedModel =
        preferredOrder.find((p) => generatable.includes(p)) ??
        generatable.find((m) => m.includes('gemini') && !m.includes('vision') && !m.includes('embedding')) ??
        generatable[0];

      if (!selectedModel) {
        lastError = 'generateContent를 지원하는 사용 가능한 모델이 없습니다.';
        continue;
      }

      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/${version}/models/${selectedModel}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
          }),
        }
      );

      const geminiJson = await geminiRes.json();
      if (!geminiRes.ok) {
        lastError = geminiJson?.error?.message ?? lastError;
        continue;
      }

      const content =
        geminiJson?.candidates?.[0]?.content?.parts
          ?.map((part: { text?: string }) => part.text ?? '')
          .join('')
          .trim() || '답변을 생성하지 못했습니다.';

      return NextResponse.json({ content, model: selectedModel, apiVersion: version });
    }

    return NextResponse.json({ error: lastError }, { status: 502 });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

