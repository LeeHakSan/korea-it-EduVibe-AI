"use client"

import { useEffect, useState } from "react"
import {
  Lock, Check, ChevronRight, BookOpen, MessageCircle,
  Loader2, X, CheckCircle2, RotateCcw, Trophy, AlertCircle,
} from "lucide-react"
import { learningPath as BASE_PATH, type Unit, type UnitStatus } from "@/lib/dashboard/data"

// ── localStorage 키 ──────────────────────────────────────
const COMPLETED_KEY = "eduvibe_completed_units"

function getCompletedIds(): number[] {
  if (typeof window === "undefined") return []
  return JSON.parse(localStorage.getItem(COMPLETED_KEY) ?? "[]")
}
function saveCompletedIds(ids: number[]) {
  localStorage.setItem(COMPLETED_KEY, JSON.stringify(ids))
}

function computeUnits(completedIds: number[]): Unit[] {
  let foundCurrent = false
  return BASE_PATH.map((u, i) => {
    if (completedIds.includes(u.id)) return { ...u, status: "completed" as UnitStatus }
    if (!foundCurrent) {
      const prevAllDone = BASE_PATH.slice(0, i).every(
        (prev) => completedIds.includes(prev.id) || prev.status === "completed"
      )
      if (prevAllDone) { foundCurrent = true; return { ...u, status: "current" as UnitStatus } }
    }
    return { ...u, status: "locked" as UnitStatus }
  })
}

function getUnitSteps(unit: Unit) {
  if (unit.status === "current")   return ["핵심 개념 잡기", "예제 1~2개 따라 하기", "문제 풀기", "오답 복습"]
  if (unit.status === "locked")    return ["관련 배경 지식 예습", "다음 단원 감 잡기", "용어 확인", "현재 단원 복습 먼저"]
  return ["복습(요약) 다시 보기", "비슷한 유형 2~3개 풀기", "응용 질문 챗봇에 요청"]
}

// ── 퀴즈 타입 ─────────────────────────────────────────────
interface QuizQuestion {
  question:    string
  options:     string[]   // ["A. ...", "B. ...", "C. ...", "D. ..."]
  correct:     string     // "A" | "B" | "C" | "D"
  explanation: string
}

// ── 언어별 폴백 퀴즈 (Gemini 실패 시 사용) ──────────────
const FALLBACK_QUIZZES: Record<string, QuizQuestion[]> = {
  Java: [
    {
      question: "Java에서 정수형 변수를 선언하는 올바른 방법은?",
      options: ["A. x = 10", "B. var x = 10", "C. int x = 10;", "D. let x = 10;"],
      correct: "C", explanation: "Java는 정적 타입 언어로 int x = 10; 처럼 자료형을 명시해야 합니다.",
    },
    {
      question: "Java에서 화면에 출력하는 메서드는?",
      options: ["A. print()", "B. console.log()", "C. System.out.println()", "D. echo()"],
      correct: "C", explanation: "Java는 System.out.println()으로 콘솔에 값을 출력합니다.",
    },
    {
      question: "Java에서 모든 프로그램의 시작점(진입점) 메서드 시그니처는?",
      options: [
        "A. public void main()",
        "B. public static void main(String[] args)",
        "C. static main(String args)",
        "D. void main(String args[])"
      ],
      correct: "B", explanation: "public static void main(String[] args)가 Java 프로그램의 진입점입니다.",
    },
    {
      question: "Java에서 한 줄 주석을 작성하는 기호는?",
      options: ["A. #", "B. --", "C. /* */", "D. //"],
      correct: "D", explanation: "Java에서는 //로 한 줄 주석, /* */로 여러 줄 주석을 작성합니다.",
    },
    {
      question: "Java ArrayList에 요소를 추가하는 메서드는?",
      options: ["A. append()", "B. push()", "C. add()", "D. insert()"],
      correct: "C", explanation: "ArrayList에서는 list.add(value)로 요소를 추가합니다.",
    },
  ],
  Python: [
    {
      question: "Python에서 변수를 선언하는 올바른 방법은?",
      options: ["A. var x = 10", "B. x = 10", "C. int x = 10", "D. let x = 10"],
      correct: "B", explanation: "Python은 타입 선언 없이 x = 10 으로 변수를 선언합니다.",
    },
    {
      question: "Python에서 print() 함수의 역할은?",
      options: ["A. 입력을 받는다", "B. 파일을 저장한다", "C. 화면에 출력한다", "D. 변수를 삭제한다"],
      correct: "C", explanation: "print()는 괄호 안의 값을 콘솔에 출력하는 함수입니다.",
    },
    {
      question: "Python에서 주석을 작성하는 기호는?",
      options: ["A. //", "B. /* */", "C. #", "D. --"],
      correct: "C", explanation: "Python은 # 기호로 한 줄 주석을 작성합니다.",
    },
    {
      question: "Python 리스트에 요소를 추가하는 메서드는?",
      options: ["A. add()", "B. push()", "C. insert()", "D. append()"],
      correct: "D", explanation: "list.append(value)로 리스트 맨 끝에 요소를 추가합니다.",
    },
    {
      question: "Python에서 반복문의 올바른 문법은?",
      options: ["A. for i = 0; i < 5; i++", "B. for i in range(5):", "C. foreach (i in range(5))", "D. loop i from 0 to 5"],
      correct: "B", explanation: "Python은 for i in range(5): 형태로 반복문을 작성합니다.",
    },
  ],
  JavaScript: [
    {
      question: "JavaScript에서 변수를 선언하는 현대적인 방법은?",
      options: ["A. int x = 10", "B. x = 10", "C. const x = 10 또는 let x = 10", "D. var x: number = 10"],
      correct: "C", explanation: "ES6 이후 const(불변)와 let(가변)을 사용합니다. var는 구식 방식입니다.",
    },
    {
      question: "JavaScript에서 화면에 출력하는 방법은?",
      options: ["A. print()", "B. System.out.println()", "C. console.log()", "D. echo()"],
      correct: "C", explanation: "JavaScript는 console.log()로 콘솔에 값을 출력합니다.",
    },
    {
      question: "JavaScript 화살표 함수(arrow function)의 올바른 표현은?",
      options: ["A. function => () {}", "B. (x) => x * 2", "C. def (x): x * 2", "D. func(x) { x * 2 }"],
      correct: "B", explanation: "(x) => x * 2는 x를 받아 2를 곱해 반환하는 화살표 함수입니다.",
    },
    {
      question: "배열에 요소를 추가하는 메서드는?",
      options: ["A. add()", "B. append()", "C. push()", "D. insert()"],
      correct: "C", explanation: "array.push(value)로 배열 끝에 요소를 추가합니다.",
    },
    {
      question: "JavaScript에서 한 줄 주석은?",
      options: ["A. #", "B. //", "C. --", "D. /* */"],
      correct: "B", explanation: "JavaScript에서는 //로 한 줄, /* */로 여러 줄 주석을 작성합니다.",
    },
  ],
  default: [
    {
      question: "Java에서 정수형 변수를 선언하는 올바른 방법은?",
      options: ["A. x = 10", "B. var x = 10", "C. int x = 10;", "D. let x = 10;"],
      correct: "C", explanation: "Java는 정적 타입 언어로 int x = 10; 처럼 자료형을 명시해야 합니다.",
    },
    {
      question: "Java에서 화면에 출력하는 메서드는?",
      options: ["A. print()", "B. console.log()", "C. System.out.println()", "D. echo()"],
      correct: "C", explanation: "Java는 System.out.println()으로 콘솔에 값을 출력합니다.",
    },
    {
      question: "Java에서 모든 프로그램의 시작점(진입점) 메서드 시그니처는?",
      options: [
        "A. public void main()",
        "B. public static void main(String[] args)",
        "C. static main(String args)",
        "D. void main(String args[])"
      ],
      correct: "B", explanation: "public static void main(String[] args)가 Java 프로그램의 진입점입니다.",
    },
    {
      question: "Java에서 한 줄 주석을 작성하는 기호는?",
      options: ["A. #", "B. --", "C. /* */", "D. //"],
      correct: "D", explanation: "Java에서는 //로 한 줄 주석, /* */로 여러 줄 주석을 작성합니다.",
    },
    {
      question: "Java ArrayList에 요소를 추가하는 메서드는?",
      options: ["A. append()", "B. push()", "C. add()", "D. insert()"],
      correct: "C", explanation: "ArrayList에서는 list.add(value)로 요소를 추가합니다.",
    },
  ],
}

// ── 강사가 설정한 수업 언어 읽기 ─────────────────────────
function getCourseLanguage(): string {
  if (typeof window === "undefined") return "Java"
  return localStorage.getItem("eduvibe_course_language") ?? "Java"
}

// 단원 타이틀 + 수업 언어 → 폴백 선택
function getFallback(title: string): QuizQuestion[] {
  const lang = getCourseLanguage()
  // 지원 언어: Java, Python, JavaScript
  if (FALLBACK_QUIZZES[lang]) return FALLBACK_QUIZZES[lang]
  // 단원 타이틀에서 언어 감지 시도
  const key = Object.keys(FALLBACK_QUIZZES).find((k) =>
    k !== "default" && title.toLowerCase().includes(k.toLowerCase())
  )
  return FALLBACK_QUIZZES[key ?? "default"]
}

// ── Gemini 퀴즈 생성 ─────────────────────────────────────
async function generateQuiz(unitTitle: string): Promise<QuizQuestion[]> {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
  if (!apiKey) throw new Error("GEMINI_API_KEY 미설정")

  const language = getCourseLanguage()

  const prompt = `당신은 코딩 교육 전문가입니다. "${unitTitle}" 주제에 대한 ${language} 프로그래밍 초보자용 객관식 퀴즈 5문제를 만들어주세요.
언어는 반드시 ${language}에 관한 문제여야 합니다.

각 문제는 4지선다(A/B/C/D)이고 정답은 1개입니다.
반드시 아래 JSON 배열 형식만 출력하세요 (마크다운 없이):
[{"question":"문제","options":["A. 선택1","B. 선택2","C. 선택3","D. 선택4"],"correct":"A","explanation":"정답 이유"},...]`

  const MODELS = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"]
  const VERSIONS = ["v1beta", "v1"]

  for (const version of VERSIONS) {
    for (const model of MODELS) {
      try {
        const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${apiKey}`
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
          }),
        })
        if (!res.ok) continue
        const json = await res.json()
        const raw: string = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? ""
        const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
        // JSON 배열 부분만 추출
        const match = cleaned.match(/\[[\s\S]*\]/)
        if (!match) continue
        const parsed = JSON.parse(match[0]) as QuizQuestion[]
        if (Array.isArray(parsed) && parsed.length >= 5) return parsed.slice(0, 5)
      } catch {
        continue
      }
    }
  }
  throw new Error("Gemini 퀴즈 생성 실패")
}

// ── 퀴즈 모달 ─────────────────────────────────────────────
function QuizModal({ unit, onClose, onComplete }: {
  unit: Unit; onClose: () => void; onComplete: () => void
}) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [loading,   setLoading]   = useState(true)
  const [genError,  setGenError]  = useState<string | null>(null)
  const [current,   setCurrent]   = useState(0)
  const [selected,  setSelected]  = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [language,  setLanguage]  = useState("Java")
  const [scores,    setScores]    = useState<boolean[]>([])
  const [finished,  setFinished]  = useState(false)

  const loadQuiz = async () => {
    setLoading(true); setGenError(null)
    setCurrent(0); setSelected(null); setConfirmed(false); setScores([]); setFinished(false)
    setLanguage(getCourseLanguage())
    try {
      const qs = await generateQuiz(unit.title)
      setQuestions(qs)
    } catch {
      // Gemini 실패 → 폴백 문제 사용
      setQuestions(getFallback(unit.title))
      setGenError("AI 연결 오류로 기본 문제가 제공됩니다.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadQuiz() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const q            = questions[current]
  const correctCount = scores.filter(Boolean).length
  const pct          = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0
  const passed       = pct >= 80
  const KEYS         = ["A", "B", "C", "D"]

  const handleConfirm = () => {
    if (!selected || confirmed) return
    setConfirmed(true)
    setScores((prev) => [...prev, selected === q.correct])
  }

  const handleNext = () => {
    if (current + 1 >= questions.length) { setFinished(true) }
    else { setCurrent((c) => c + 1); setSelected(null); setConfirmed(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-3xl border-2 border-[#e5e5e5] w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-[#f7f7f7] shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold text-[#afafaf]">{unit.title} 퀴즈</p>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#1cb0f6]/10 text-[#1cb0f6]">
                {language}
              </span>
            </div>
            {!finished && !loading && (
              <p className="text-sm font-black text-[#3c3c3c]">{current + 1} / {questions.length} 문제</p>
            )}
          </div>
          <button type="button" onClick={onClose} className="text-[#afafaf] hover:text-[#3c3c3c]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {/* 로딩 */}
          {loading && (
            <div className="flex flex-col items-center gap-3 py-12">
              <Loader2 className="w-10 h-10 animate-spin text-[#58cc02]" />
              <p className="text-sm font-bold text-[#777]">AI가 퀴즈를 생성 중이에요...</p>
            </div>
          )}

          {/* 에러 알림 (폴백 사용 중) */}
          {genError && !loading && (
            <div className="flex items-center gap-2 p-3 bg-[#fff9e6] border border-[#ffc800]/30 rounded-xl mb-4 text-sm">
              <AlertCircle className="w-4 h-4 text-[#ff9600] shrink-0" />
              <span className="text-[#777] font-semibold">{genError}</span>
            </div>
          )}

          {/* 퀴즈 진행 */}
          {!loading && !finished && q && (
            <>
              {/* 진행률 */}
              <div className="h-2 bg-[#f7f7f7] rounded-full mb-5 overflow-hidden">
                <div
                  className="h-full bg-[#58cc02] rounded-full transition-all duration-500"
                  style={{ width: `${(current / questions.length) * 100}%` }}
                />
              </div>

              {/* 문제 */}
              <p className="font-bold text-[#3c3c3c] text-base leading-relaxed mb-5">
                Q{current + 1}. {q.question}
              </p>

              {/* 선택지 */}
              <div className="space-y-2.5 mb-5">
                {q.options.map((opt, i) => {
                  const key       = KEYS[i]
                  const isCorrect = key === q.correct
                  const isChosen  = selected === key

                  let cls = "border-[#e5e5e5] bg-[#f7f7f7] hover:border-[#1cb0f6] hover:bg-[#eaf7ff]"
                  let iconEl: React.ReactNode = null
                  let circleClass = "bg-white border border-[#e5e5e5] text-[#777]"
                  let textClass = "text-[#3c3c3c]"

                  if (!confirmed && isChosen) {
                    cls = "border-[#1cb0f6] bg-[#eaf7ff]"
                    circleClass = "bg-[#1cb0f6] text-white"
                    textClass = "text-[#1cb0f6] font-bold"
                  }
                  if (confirmed && isCorrect) {
                    cls = "border-[#58cc02] bg-[#f0fff0]"
                    circleClass = "bg-[#58cc02] text-white"
                    textClass = "text-[#3c3c3c] font-bold"
                    iconEl = <CheckCircle2 className="w-5 h-5 text-[#58cc02] shrink-0" />
                  }
                  if (confirmed && isChosen && !isCorrect) {
                    cls = "border-[#ff4b4b] bg-[#fff0f0]"
                    circleClass = "bg-[#ff4b4b] text-white"
                    textClass = "text-[#ff4b4b] font-bold"
                    iconEl = <X className="w-5 h-5 text-[#ff4b4b] shrink-0" />
                  }

                  return (
                    <button
                      key={key}
                      type="button"
                      disabled={confirmed}
                      onClick={() => setSelected(key)}
                      className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 text-left transition-all ${cls}`}
                    >
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${circleClass}`}>
                        {key}
                      </span>
                      <span className={`flex-1 text-sm ${textClass}`}>
                        {opt.replace(/^[A-D]\.\s*/, "")}
                      </span>
                      {iconEl}
                    </button>
                  )
                })}
              </div>

              {/* 오답/정답 해설 */}
              {confirmed && selected !== q.correct && (
                <div className="p-3 bg-[#fff0f0] border border-[#ff4b4b]/20 rounded-xl mb-4">
                  <p className="text-xs font-bold text-[#ff4b4b] mb-1">
                    ✗ 오답! 정답은 <strong className="underline">{q.correct}</strong>
                  </p>
                  <p className="text-sm text-[#3c3c3c] font-semibold leading-relaxed">{q.explanation}</p>
                </div>
              )}
              {confirmed && selected === q.correct && (
                <div className="p-3 bg-[#f0fff0] border border-[#58cc02]/20 rounded-xl mb-4">
                  <p className="text-xs font-bold text-[#58cc02] mb-1">✓ 정답!</p>
                  <p className="text-sm text-[#3c3c3c] font-semibold leading-relaxed">{q.explanation}</p>
                </div>
              )}

              {!confirmed ? (
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={!selected}
                  className="w-full py-3 bg-[#1cb0f6] text-white font-bold rounded-2xl border-b-4 border-[#1899d6] hover:bg-[#1cb0f6]/90 active:border-b-0 transition-all disabled:opacity-50"
                >
                  제출하기
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full py-3 bg-[#58cc02] text-white font-bold rounded-2xl border-b-4 border-[#46a302] hover:bg-[#58cc02]/90 active:border-b-0 transition-all"
                >
                  {current + 1 >= questions.length ? "결과 보기 →" : "다음 문제 →"}
                </button>
              )}
            </>
          )}

          {/* 결과 */}
          {finished && (
            <div className="text-center py-2">
              <div className={`w-24 h-24 rounded-full mx-auto mb-4 flex flex-col items-center justify-center ${
                passed ? "bg-[#58cc02]/10" : "bg-[#ff4b4b]/10"
              }`}>
                <span className={`text-3xl font-black ${passed ? "text-[#58cc02]" : "text-[#ff4b4b]"}`}>{pct}%</span>
                {passed ? <Trophy className="w-6 h-6 text-[#58cc02] mt-1" /> : <RotateCcw className="w-5 h-5 text-[#ff4b4b] mt-1" />}
              </div>

              <p className="font-black text-[#3c3c3c] text-lg mb-1">
                {passed ? "🎉 합격!" : "😢 불합격"}
              </p>
              <p className="text-sm font-semibold text-[#777] mb-4">
                {questions.length}문제 중 {correctCount}문제 정답
              </p>

              {/* 문제별 결과 */}
              <div className="flex justify-center gap-2 mb-6">
                {scores.map((ok, i) => (
                  <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white ${ok ? "bg-[#58cc02]" : "bg-[#ff4b4b]"}`}>
                    {ok ? "✓" : "✗"}
                  </div>
                ))}
              </div>

              {passed ? (
                <div className="space-y-3">
                  <p className="text-sm font-bold text-[#58cc02] bg-[#f0fff0] rounded-xl p-3">
                    80% 이상 달성! 학습 완료 처리 후 다음 단원이 열려요.
                  </p>
                  <button
                    type="button"
                    onClick={() => { onComplete(); onClose() }}
                    className="w-full py-3 bg-[#58cc02] text-white font-bold rounded-2xl border-b-4 border-[#46a302] hover:bg-[#58cc02]/90 active:border-b-0 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    학습 완료 처리하기
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm font-bold text-[#ff4b4b] bg-[#fff0f0] rounded-xl p-3">
                    80% 이상이어야 학습 완료가 돼요. 다시 도전해보세요!
                  </p>
                  <button
                    type="button"
                    onClick={loadQuiz}
                    className="w-full py-3 bg-[#ff9600] text-white font-bold rounded-2xl border-b-4 border-[#e08000] hover:bg-[#ff9600]/90 active:border-b-0 transition-all flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-5 h-5" />
                    재응시하기 (새 문제)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── 메인 페이지 ───────────────────────────────────────────
export default function LearnPage() {
  const [completedIds, setCompletedIds] = useState<number[]>([])
  const [units,        setUnits]        = useState<Unit[]>(BASE_PATH)
  const [selectedUnit, setSelectedUnit] = useState<Unit>(
    BASE_PATH.find((u) => u.status === "current") ?? BASE_PATH[0]
  )
  const [showQuiz, setShowQuiz] = useState(false)

  useEffect(() => {
    const ids = getCompletedIds()
    setCompletedIds(ids)
    const computed = computeUnits(ids)
    setUnits(computed)
    const cur = computed.find((u) => u.status === "current") ?? computed[0]
    setSelectedUnit(cur)
  }, [])

  const openTutor = () => {
    window.dispatchEvent(
      new CustomEvent("open-chatbot", {
        detail: {
          unitTitle:      selectedFromUnits.title,
          initialMessage: `📖 '${selectedFromUnits.title}'의 어떤 부분이 궁금하신가요?\n편하게 질문해주세요!`,
        },
      })
    )
  }

  const handleUnitComplete = () => {
    const newIds = completedIds.includes(selectedUnit.id)
      ? completedIds
      : [...completedIds, selectedUnit.id]
    saveCompletedIds(newIds)
    setCompletedIds(newIds)
    const newUnits = computeUnits(newIds)
    setUnits(newUnits)
    const next = newUnits.find((u) => u.status === "current")
    setSelectedUnit(next ?? newUnits.find((u) => u.id === selectedUnit.id) ?? selectedUnit)
  }

  const selectedFromUnits = units.find((u) => u.id === selectedUnit.id) ?? selectedUnit

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <h1 className="text-2xl font-black text-[#3c3c3c] mb-2">배우기</h1>
      <p className="text-[#777] font-semibold mb-8">학습 경로를 따라 단계별로 배워요.</p>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* 학습 경로 트리 */}
        <div className="lg:w-64 shrink-0">
          <div className="relative">
            <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-[#e5e5e5]" />
            <div className="space-y-3">
              {units.map((unit) => {
                const isActive = selectedFromUnits.id === unit.id
                return (
                  <button
                    key={unit.id}
                    type="button"
                    onClick={() => unit.status !== "locked" && setSelectedUnit(unit)}
                    disabled={unit.status === "locked"}
                    className={`relative w-full flex items-center gap-4 p-3 rounded-2xl text-left transition-all ${
                      isActive
                        ? "bg-[#58cc02] text-white shadow-md"
                        : unit.status === "locked"
                        ? "opacity-50 cursor-not-allowed bg-white border-2 border-[#e5e5e5]"
                        : "bg-white border-2 border-[#e5e5e5] hover:border-[#58cc02]"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 ${
                      unit.status === "completed"
                        ? "bg-[#58cc02]"
                        : unit.status === "current"
                        ? isActive ? "bg-white/20" : "bg-[#1cb0f6]"
                        : "bg-[#e5e5e5]"
                    }`}>
                      {unit.status === "completed" ? (
                        <Check className="w-5 h-5 text-white" />
                      ) : unit.status === "locked" ? (
                        <Lock className="w-4 h-4 text-[#afafaf]" />
                      ) : (
                        <BookOpen className="w-5 h-5 text-white" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-sm truncate ${
                        isActive ? "text-white" : unit.status === "locked" ? "text-[#afafaf]" : "text-[#3c3c3c]"
                      }`}>{unit.title}</p>
                      <p className={`text-xs font-semibold ${isActive ? "text-white/80" : "text-[#afafaf]"}`}>
                        +{unit.xp} XP {unit.status === "completed" && "✓"}
                      </p>
                    </div>
                    {!isActive && unit.status !== "locked" && (
                      <ChevronRight className="w-4 h-4 text-[#afafaf] shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* 단원 상세 */}
        <div className="flex-1">
          <div className="bg-white rounded-3xl p-6 border-2 border-[#e5e5e5]">
            <div className="mb-6">
              <span className={`text-xs font-bold px-3 py-1 rounded-full inline-block ${
                selectedFromUnits.status === "completed"
                  ? "bg-[#58cc02]/10 text-[#58cc02]"
                  : selectedFromUnits.status === "current"
                  ? "bg-[#1cb0f6]/10 text-[#1cb0f6]"
                  : "bg-[#e5e5e5] text-[#afafaf]"
              }`}>
                {selectedFromUnits.status === "completed" ? "✓ 완료" :
                 selectedFromUnits.status === "current"   ? "학습 중" : "잠김"}
              </span>
              <h2 className="text-xl font-black text-[#3c3c3c] mt-2">{selectedFromUnits.title}</h2>
              <p className="text-[#777] font-semibold text-sm mt-1">+{selectedFromUnits.xp} XP 획득 가능</p>
            </div>

            {/* 학습 단계 */}
            <div className="mb-6">
              <p className="text-sm font-bold text-[#3c3c3c] mb-3">학습 단계</p>
              <div className="space-y-2">
                {getUnitSteps(selectedFromUnits).map((step, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-[#f7f7f7] rounded-xl">
                    <div className="w-6 h-6 rounded-full bg-[#1cb0f6] text-white flex items-center justify-center text-xs font-black shrink-0">{i + 1}</div>
                    <p className="text-sm font-semibold text-[#3c3c3c]">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 액션 버튼 */}
            {selectedFromUnits.status !== "locked" && (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={openTutor}
                  className="flex-1 py-3 rounded-2xl bg-[#1cb0f6] text-white font-bold border-b-4 border-[#1899d6] hover:bg-[#1cb0f6]/90 active:border-b-0 transition-all flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  AI 튜터에게 질문
                </button>

                {selectedFromUnits.status === "current" && (
                  <button
                    type="button"
                    onClick={() => setShowQuiz(true)}
                    className="flex-1 py-3 rounded-2xl bg-[#58cc02] text-white font-bold border-b-4 border-[#46a302] hover:bg-[#58cc02]/90 active:border-b-0 transition-all flex items-center justify-center gap-2"
                  >
                    <Trophy className="w-5 h-5" />
                    퀴즈 풀기
                  </button>
                )}
                {selectedFromUnits.status === "completed" && (
                  <div className="flex-1 py-3 rounded-2xl bg-[#58cc02]/10 text-[#58cc02] font-bold border-2 border-[#58cc02]/20 flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    학습 완료
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showQuiz && (
        <QuizModal
          unit={selectedFromUnits}
          onClose={() => setShowQuiz(false)}
          onComplete={handleUnitComplete}
        />
      )}
    </div>
  )
}
