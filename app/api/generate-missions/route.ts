import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

// ── 타입 ─────────────────────────────────────────
type MissionLevel = "basic" | "applied" | "advanced"

interface MissionItem {
  id: string
  no: number
  level: MissionLevel
  title: string
  description: string
}

// ── PDF 텍스트 추출 (pdf-parse 사용 시도, 없으면 스킵) ──
async function extractText(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer())

  if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
    try {
      // pdf-parse가 설치돼 있으면 사용
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require("pdf-parse")
      const data = await pdfParse(buffer)
      return data.text ?? ""
    } catch {
      // pdf-parse 미설치 시 바이너리에서 텍스트 추출 시도
      return buffer.toString("utf-8").replace(/[^\x20-\x7E\uAC00-\uD7A3]/g, " ")
    }
  }

  // TXT 파일
  return buffer.toString("utf-8")
}

// ── Gemini API 호출 ─────────────────────────────────
async function generateMissionsWithGemini(text: string): Promise<MissionItem[]> {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
  if (!apiKey) throw new Error("GEMINI_API_KEY가 설정되지 않았습니다.")

  const prompt = `
당신은 교육 전문가입니다. 아래 학습 자료를 분석하여 학생이 수행할 수 있는 미션 10개를 만들어주세요.

[조건]
- 기본(basic) 미션 8개: 핵심 개념 확인, 간단한 실습
- 응용(applied) 미션 1개: 개념을 결합한 중간 수준
- 심화(advanced) 미션 1개: 창의적 응용이나 도전 과제

[출력 형식] JSON 배열만 반환하세요. 다른 텍스트 없이:
[
  { "no": 1, "level": "basic", "title": "미션 제목(10자 이내)", "description": "구체적 수행 방법(30자 이내)" },
  ...
]

[학습 자료]
${text.slice(0, 4000)}
`

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini API 오류: ${err}`)
  }

  const json = await res.json()
  const raw: string = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? ""

  // JSON 배열 추출 (마크다운 코드블록 제거)
  const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
  const parsed = JSON.parse(cleaned) as Omit<MissionItem, "id">[]

  return parsed.map((m, i) => ({
    id: `gen_${Date.now()}_${i}`,
    no: m.no ?? i + 1,
    level: m.level ?? (i < 8 ? "basic" : i === 8 ? "applied" : "advanced"),
    title: m.title ?? `미션 ${i + 1}`,
    description: m.description ?? "",
  }))
}

// ── PDF 텍스트에서 프로그래밍 언어 감지 ─────────────────
function detectLanguage(text: string): string {
  const scores: Record<string, number> = {
    java: 0, python: 0, javascript: 0, cpp: 0, csharp: 0,
  }

  // Java
  if (/public\s+static\s+void\s+main/.test(text)) scores.java += 5
  if (/System\.out\.println/.test(text)) scores.java += 3
  if (/import\s+java\./.test(text)) scores.java += 3
  if (/ArrayList|HashMap|interface\s+\w+/.test(text)) scores.java += 2
  if (/자바|JAVA/.test(text)) scores.java += 3

  // Python
  if (/def\s+\w+\s*\(/.test(text)) scores.python += 4
  if (/print\s*\(/.test(text)) scores.python += 2
  if (/elif|lambda|pip\s+install/.test(text)) scores.python += 3
  if (/import\s+(numpy|pandas|flask|django)/.test(text)) scores.python += 4
  if (/파이썬|PYTHON/.test(text)) scores.python += 3

  // JavaScript / TypeScript
  if (/const\s+\w+\s*=|let\s+\w+\s*=/.test(text)) scores.javascript += 3
  if (/=>\s*\{|=>\s*\w/.test(text)) scores.javascript += 3
  if (/require\(|import\s+.+from\s+['"]/.test(text)) scores.javascript += 2
  if (/node\.js|nodejs|react|vue|angular/i.test(text)) scores.javascript += 3

  // C++
  if (/#include\s*</.test(text)) scores.cpp += 4
  if (/std::|cout\s*<<|cin\s*>>/.test(text)) scores.cpp += 4

  // C#
  if (/Console\.WriteLine|namespace\s+\w+|using\s+System/.test(text)) scores.csharp += 4

  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0]
  if (!best || best[1] === 0) return "Java" // 기본값

  const names: Record<string, string> = {
    java: "Java", python: "Python", javascript: "JavaScript", cpp: "C++", csharp: "C#",
  }
  return names[best[0]] ?? "Java"
}

// ── 폴백: 기본 미션 템플릿 ─────────────────────────────
function generateFallbackMissions(text: string): MissionItem[] {
  // 학습 자료에서 키워드 추출
  const keywords = text
    .split(/[\s,.\n]+/)
    .filter((w) => w.length >= 2 && /[가-힣a-zA-Z]/.test(w))
    .slice(0, 5)

  const topic = keywords[0] ?? "학습"

  return [
    { id: "f1",  no: 1,  level: "basic",    title: `${topic} 개념 정리`,     description: "핵심 개념 3가지를 요약하여 적기" },
    { id: "f2",  no: 2,  level: "basic",    title: "용어 사전 만들기",       description: "자료에서 모르는 용어 5개 찾아 정의하기" },
    { id: "f3",  no: 3,  level: "basic",    title: "핵심 요약",              description: "한 문단으로 학습 자료 요약하기" },
    { id: "f4",  no: 4,  level: "basic",    title: "예시 찾기",              description: "자료의 개념에 해당하는 실생활 예시 3개 찾기" },
    { id: "f5",  no: 5,  level: "basic",    title: "복습 퀴즈",              description: "스스로 퀴즈 5문제 만들고 답 달기" },
    { id: "f6",  no: 6,  level: "basic",    title: "마인드맵 그리기",        description: "핵심 개념을 연결한 마인드맵 작성" },
    { id: "f7",  no: 7,  level: "basic",    title: "비교 분석",              description: "두 가지 개념의 공통점과 차이점 정리" },
    { id: "f8",  no: 8,  level: "basic",    title: "질문 3개 만들기",        description: "자료를 읽고 궁금한 점 3가지 적기" },
    { id: "f9",  no: 9,  level: "applied",  title: "응용 실습",              description: "배운 내용을 활용한 간단한 예제 해결하기" },
    { id: "f10", no: 10, level: "advanced", title: "창의 도전",              description: "자료의 내용을 다른 분야에 적용하는 아이디어 제안" },
  ]
}

// ── Route Handler ─────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "파일이 필요합니다." }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "파일 크기는 10MB 이하여야 합니다." }, { status: 400 })
    }

    // 텍스트 추출
    let text = ""
    try {
      text = await extractText(file)
    } catch {
      text = ""
    }

    if (!text.trim()) {
      return NextResponse.json({ error: "파일에서 텍스트를 추출할 수 없습니다." }, { status: 422 })
    }

    // Gemini로 미션 생성 시도 → 실패 시 폴백
    let missions: MissionItem[]
    try {
      missions = await generateMissionsWithGemini(text)
    } catch {
      missions = generateFallbackMissions(text)
    }

    // 정확히 10개 보정
    if (missions.length < 10) {
      const fallback = generateFallbackMissions(text)
      missions = [...missions, ...fallback].slice(0, 10)
    } else {
      missions = missions.slice(0, 10)
    }

    // 언어 감지
    const language = detectLanguage(text)

    return NextResponse.json({ missions, language })
  } catch (err) {
    console.error("[generate-missions]", err)
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
