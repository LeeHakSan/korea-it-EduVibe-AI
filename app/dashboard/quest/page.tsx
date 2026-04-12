"use client"

import { useEffect, useRef, useState } from "react"
import {
  Lock, CheckCircle2, Sparkles,
  Upload, Loader2, Code2, Play,
  AlertCircle, ChevronDown, ChevronUp, RotateCcw,
  Terminal,
} from "lucide-react"
import { getRoleFromUser, type UserRole } from "@/lib/auth"
import { getSupabaseBrowser } from "@/lib/supabase-browser"

// ── 타입 ──────────────────────────────────────────────
type MissionLevel  = "basic" | "applied" | "advanced"
type MissionStatus = "locked" | "active" | "done"

interface CodingProblem {
  prompt:         string   // 풀어야 할 문제 설명
  starterCode:    string   // 시작 코드 (힌트용 뼈대)
  expectedOutput: string   // 예상 출력 예시
  language:       string   // 언어 표시 (python, java 등)
}

interface Mission {
  id: string
  no: number
  level: MissionLevel
  title: string
  description: string
  status: MissionStatus
  problem: CodingProblem
}

// ── 구체적인 문제 있는 기본 미션 (Java 기본값) ───────────
const DEFAULT_MISSIONS: Omit<Mission, "status">[] = [
  {
    id: "m1", no: 1, level: "basic",
    title: "Hello, Java!",
    description: "Java의 기본 출력 메서드를 사용해보세요.",
    problem: {
      language: "java",
      prompt:
        `아래 조건을 만족하는 Java 코드를 작성하세요.\n\n` +
        `✅ 조건\n` +
        `1. "Hello, Java!" 를 출력하세요.\n` +
        `2. 다음 줄에 "학습을 시작합니다!" 를 출력하세요.`,
      starterCode:
        `public class Main {\n` +
        `    public static void main(String[] args) {\n` +
        `        System.out.println(...);\n` +
        `        System.out.println(...);\n` +
        `    }\n` +
        `}`,
      expectedOutput: `Hello, Java!\n학습을 시작합니다!`,
    },
  },
  {
    id: "m2", no: 2, level: "basic",
    title: "변수 선언 연습",
    description: "정수·문자열·실수 변수를 각각 선언하고 출력하세요.",
    problem: {
      language: "java",
      prompt:
        `아래 변수를 선언하고 각각 출력하는 Java 코드를 작성하세요.\n\n` +
        `✅ 조건\n` +
        `1. 정수 변수 age = 20\n` +
        `2. 문자열 변수 name = "홍길동"\n` +
        `3. 실수 변수 height = 175.5\n` +
        `4. 세 변수를 각각 System.out.println()으로 출력`,
      starterCode:
        `public class Main {\n` +
        `    public static void main(String[] args) {\n` +
        `        int age = ...;\n` +
        `        String name = ...;\n` +
        `        double height = ...;\n` +
        `        System.out.println(age);\n` +
        `        System.out.println(name);\n` +
        `        System.out.println(height);\n` +
        `    }\n` +
        `}`,
      expectedOutput: `20\n홍길동\n175.5`,
    },
  },
  {
    id: "m3", no: 3, level: "basic",
    title: "자료형 확인",
    description: "getClass().getSimpleName()으로 변수의 자료형을 확인하세요.",
    problem: {
      language: "java",
      prompt:
        `아래 3개 변수의 자료형 이름을 출력하세요.\n\n` +
        `✅ 조건\n` +
        `1. Integer x = 42  → "Integer" 출력\n` +
        `2. String y = "hello"  → "String" 출력\n` +
        `3. Double z = 3.14  → "Double" 출력\n` +
        `힌트: x.getClass().getSimpleName() 사용`,
      starterCode:
        `public class Main {\n` +
        `    public static void main(String[] args) {\n` +
        `        Integer x = 42;\n` +
        `        String y = "hello";\n` +
        `        Double z = 3.14;\n` +
        `        System.out.println(x.getClass().getSimpleName());\n` +
        `        System.out.println(y.getClass()...);\n` +
        `        System.out.println(z.getClass()...);\n` +
        `    }\n` +
        `}`,
      expectedOutput: `Integer\nString\nDouble`,
    },
  },
  {
    id: "m4", no: 4, level: "basic",
    title: "점수 등급 판별",
    description: "if / else if / else 로 점수에 따라 등급을 출력하세요.",
    problem: {
      language: "java",
      prompt:
        `score 변수에 따라 등급을 출력하세요.\n\n` +
        `✅ 조건 (score = 85 기준)\n` +
        `- 90 이상 → "A등급"\n` +
        `- 80 이상 90 미만 → "B등급"\n` +
        `- 70 이상 80 미만 → "C등급"\n` +
        `- 70 미만 → "F등급"`,
      starterCode:
        `public class Main {\n` +
        `    public static void main(String[] args) {\n` +
        `        int score = 85;\n` +
        `        if (score >= 90) {\n` +
        `            System.out.println("A등급");\n` +
        `        } else if (...) {\n` +
        `            ...\n` +
        `        } else if (...) {\n` +
        `            ...\n` +
        `        } else {\n` +
        `            ...\n` +
        `        }\n` +
        `    }\n` +
        `}`,
      expectedOutput: `B등급`,
    },
  },
  {
    id: "m5", no: 5, level: "basic",
    title: "1~10 합계 구하기",
    description: "for 반복문으로 1부터 10까지의 합계를 구하세요.",
    problem: {
      language: "java",
      prompt:
        `for 문을 사용해 1부터 10까지 더한 결과를 출력하세요.\n\n` +
        `✅ 조건\n` +
        `- for (int i = 1; i <= 10; i++) 형식 사용\n` +
        `- 합계를 total 변수에 저장\n` +
        `- "1부터 10까지의 합: 55" 형식으로 출력`,
      starterCode:
        `public class Main {\n` +
        `    public static void main(String[] args) {\n` +
        `        int total = 0;\n` +
        `        for (int i = ...; i <= ...; i++) {\n` +
        `            total += i;\n` +
        `        }\n` +
        `        System.out.println("1부터 10까지의 합: " + total);\n` +
        `    }\n` +
        `}`,
      expectedOutput: `1부터 10까지의 합: 55`,
    },
  },
  {
    id: "m6", no: 6, level: "basic",
    title: "ArrayList 다루기",
    description: "ArrayList를 생성하고 추가·삭제·조회를 실습하세요.",
    problem: {
      language: "java",
      prompt:
        `아래 순서대로 ArrayList를 조작하고 각 단계의 결과를 출력하세요.\n\n` +
        `✅ 순서\n` +
        `1. fruits에 "사과", "바나나", "포도" 추가 후 출력\n` +
        `2. "딸기" 를 추가(add) 후 출력\n` +
        `3. "바나나" 를 삭제(remove) 후 출력`,
      starterCode:
        `import java.util.ArrayList;\n\n` +
        `public class Main {\n` +
        `    public static void main(String[] args) {\n` +
        `        ArrayList<String> fruits = new ArrayList<>();\n` +
        `        fruits.add("사과");\n` +
        `        fruits.add("바나나");\n` +
        `        fruits.add("포도");\n` +
        `        System.out.println(fruits);\n` +
        `        fruits.add(...);\n` +
        `        System.out.println(fruits);\n` +
        `        fruits.remove(...);\n` +
        `        System.out.println(fruits);\n` +
        `    }\n` +
        `}`,
      expectedOutput: `[사과, 바나나, 포도]\n[사과, 바나나, 포도, 딸기]\n[사과, 포도, 딸기]`,
    },
  },
  {
    id: "m7", no: 7, level: "basic",
    title: "두 수를 더하는 메서드",
    description: "두 인수를 받아 합계를 반환하는 메서드를 만드세요.",
    problem: {
      language: "java",
      prompt:
        `add() 메서드를 정의하고 호출하세요.\n\n` +
        `✅ 조건\n` +
        `- static int add(int a, int b): a와 b를 더한 값을 return\n` +
        `- add(3, 7) 호출 결과 출력 → 10\n` +
        `- add(100, 200) 호출 결과 출력 → 300`,
      starterCode:
        `public class Main {\n` +
        `    static int add(int a, int b) {\n` +
        `        return ...;\n` +
        `    }\n` +
        `    public static void main(String[] args) {\n` +
        `        System.out.println(add(3, 7));\n` +
        `        System.out.println(add(100, 200));\n` +
        `    }\n` +
        `}`,
      expectedOutput: `10\n300`,
    },
  },
  {
    id: "m8", no: 8, level: "basic",
    title: "문자열 반복 출력",
    description: "while 문으로 문자열을 3번 반복 출력하세요.",
    problem: {
      language: "java",
      prompt:
        `while 반복문을 사용해 "자바 화이팅!"을 3번 출력하세요.\n\n` +
        `✅ 조건\n` +
        `- while 문 사용 (for 사용 불가)\n` +
        `- count 변수로 반복 횟수 제어`,
      starterCode:
        `public class Main {\n` +
        `    public static void main(String[] args) {\n` +
        `        int count = 0;\n` +
        `        while (count < ...) {\n` +
        `            System.out.println("자바 화이팅!");\n` +
        `            count++;\n` +
        `        }\n` +
        `    }\n` +
        `}`,
      expectedOutput: `자바 화이팅!\n자바 화이팅!\n자바 화이팅!`,
    },
  },
  {
    id: "m9", no: 9, level: "applied",
    title: "간단한 계산기 프로그램",
    description: "사칙연산 메서드들을 구현해 계산기를 만드세요.",
    problem: {
      language: "java",
      prompt:
        `사칙연산 메서드를 각각 정의하고 결과를 출력하세요.\n\n` +
        `✅ 조건\n` +
        `- add, subtract, multiply, divide 메서드 구현\n` +
        `- divide는 b=0 이면 "0으로 나눌 수 없습니다" 반환\n` +
        `- 각 메서드로 10, 4 계산 후 출력`,
      starterCode:
        `public class Main {\n` +
        `    static int add(int a, int b) { return a + b; }\n` +
        `    static int subtract(int a, int b) { return ...; }\n` +
        `    static int multiply(int a, int b) { return ...; }\n` +
        `    static String divide(int a, int b) {\n` +
        `        if (b == 0) return "0으로 나눌 수 없습니다";\n` +
        `        return String.valueOf((double) a / b);\n` +
        `    }\n` +
        `    public static void main(String[] args) {\n` +
        `        System.out.println(add(10, 4));\n` +
        `        System.out.println(subtract(10, 4));\n` +
        `        System.out.println(multiply(10, 4));\n` +
        `        System.out.println(divide(10, 4));\n` +
        `    }\n` +
        `}`,
      expectedOutput: `14\n6\n40\n2.5`,
    },
  },
  {
    id: "m10", no: 10, level: "advanced",
    title: "피보나치 수열 (재귀)",
    description: "재귀 메서드로 피보나치 수열의 n번째 값을 구하세요.",
    problem: {
      language: "java",
      prompt:
        `재귀 메서드 fib(n)을 구현하고 fib(0)~fib(7)을 출력하세요.\n\n` +
        `✅ 조건\n` +
        `- fib(0) = 0, fib(1) = 1\n` +
        `- fib(n) = fib(n-1) + fib(n-2)\n` +
        `- 0부터 7까지 for 문으로 순서대로 출력`,
      starterCode:
        `public class Main {\n` +
        `    static int fib(int n) {\n` +
        `        if (n <= 1) return n;\n` +
        `        return fib(...) + fib(...);\n` +
        `    }\n` +
        `    public static void main(String[] args) {\n` +
        `        for (int i = 0; i < 8; i++) {\n` +
        `            System.out.println(fib(i));\n` +
        `        }\n` +
        `    }\n` +
        `}`,
      expectedOutput: `0\n1\n1\n2\n3\n5\n8\n13`,
    },
  },
]

const LEVEL_LABEL: Record<MissionLevel, string> = { basic: "기본", applied: "응용", advanced: "심화" }
const LEVEL_COLOR: Record<MissionLevel, string> = {
  basic:    "bg-[#1cb0f6]/10 text-[#1cb0f6]",
  applied:  "bg-[#ff9600]/10 text-[#ff9600]",
  advanced: "bg-[#ff4b4b]/10 text-[#ff4b4b]",
}

interface CodeEvalResult {
  score: number
  feedback: string
  passable: boolean
}

// ── 메인 ─────────────────────────────────────────────────
export default function QuestPage() {
  const [role,         setRole]         = useState<UserRole>("student")
  const [missions,     setMissions]     = useState<Mission[]>([])
  const [activeMissionId, setActiveMissionId] = useState<string | null>(null)
  const [uploading,    setUploading]    = useState(false)
  const [uploadMsg,    setUploadMsg]    = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [expandedId,   setExpandedId]   = useState<string | null>(null)
  const [courseLanguage, setCourseLanguage] = useState("Java")

  useEffect(() => {
    const supabase = getSupabaseBrowser()
    supabase.auth.getUser().then(async ({ data }: { data: { user: import("@supabase/supabase-js").User | null } }) => {
      const user = data.user
      if (!user) return
      const userRole = getRoleFromUser(user)
      setRole(userRole)

      // 학생: API에서 강사 미션 로드
      if (userRole === "student") {
        const courseCode = (user.user_metadata?.course_code as string) ?? ""
        if (courseCode) {
          try {
            const res = await fetch(`/api/course/data?code=${courseCode}`)
            if (res.ok) {
              const json = await res.json()
              const courseData = json.courseData
              if (courseData?.missions && Array.isArray(courseData.missions)) {
                const loaded = (courseData.missions as Omit<Mission, "status">[]).map((m, i) => ({
                  ...m,
                  status: i === 0 ? ("active" as MissionStatus) : ("locked" as MissionStatus),
                }))
                // 기존 학습 진행 상태 유지 (localStorage에 저장된 게 있으면)
                const stored = localStorage.getItem(`eduvibe_missions_${courseCode}`)
                if (stored) {
                  const progress: Record<string, MissionStatus> = JSON.parse(stored)
                  const merged = loaded.map((m) => ({ ...m, status: progress[m.id] ?? m.status }))
                  setMissions(merged)
                  setActiveMissionId(merged.find((m) => m.status === "active")?.id ?? null)
                } else {
                  setMissions(loaded)
                  setActiveMissionId(loaded[0]?.id ?? null)
                }
                if (courseData.language) {
                  localStorage.setItem("eduvibe_course_language", courseData.language)
                  setCourseLanguage(courseData.language)
                }
                return
              }
            }
          } catch { /* API 실패시 기본값 사용 */ }
        }
      }

      // 강사/기본: localStorage에서 로드
      const stored = localStorage.getItem("eduvibe_missions_v3")
      if (stored) {
        const parsed: Mission[] = JSON.parse(stored)
        const merged = parsed.map((m) => {
          const def = DEFAULT_MISSIONS.find((d) => d.id === m.id)
          return { ...m, problem: m.problem ?? def?.problem ?? DEFAULT_MISSIONS[0].problem }
        })
        setMissions(merged)
        setActiveMissionId(merged.find((m) => m.status === "active")?.id ?? null)
      } else {
        const init = DEFAULT_MISSIONS.map((m, i) => ({
          ...m,
          status: i === 0 ? ("active" as MissionStatus) : ("locked" as MissionStatus),
        }))
        setMissions(init)
        setActiveMissionId(init[0].id)
        localStorage.setItem("eduvibe_missions_v3", JSON.stringify(init))
      }

      // 코스 언어 설정 로드
      const lang = localStorage.getItem("eduvibe_course_language") ?? "Java"
      setCourseLanguage(lang)
    })
  }, [])

  const completeMission = (id: string) => {
    setMissions((prev) => {
      const idx = prev.findIndex((m) => m.id === id)
      if (idx === -1 || prev[idx].status !== "active") return prev
      const updated = prev.map((m, i) => {
        if (i === idx)     return { ...m, status: "done"   as MissionStatus }
        if (i === idx + 1 && m.status === "locked") return { ...m, status: "active" as MissionStatus }
        return m
      })
      localStorage.setItem("eduvibe_missions_v3", JSON.stringify(updated))
      const next = updated.find((m) => m.status === "active")
      setActiveMissionId(next?.id ?? null)
      return updated
    })
    setExpandedId(null)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true); setUploadMsg(null)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/generate-missions", { method: "POST", body: formData })
      if (!res.ok) throw new Error(await res.text())
      const { missions: generated, language }: {
        missions: Omit<Mission, "status">[]
        language: string
      } = await res.json()

      // 감지된 언어 저장 (배우기 퀴즈 + 퀘스트에서 공유)
      if (language) {
        localStorage.setItem("eduvibe_course_language", language)
        setCourseLanguage(language)
      }

      const init = generated.map((m, i) => ({
        ...m,
        problem: m.problem ?? DEFAULT_MISSIONS[i % DEFAULT_MISSIONS.length].problem,
        status: i === 0 ? ("active" as MissionStatus) : ("locked" as MissionStatus),
      }))
      setMissions(init)
      setActiveMissionId(init[0].id)
      localStorage.setItem("eduvibe_missions_v3", JSON.stringify(init))

      // 강사: 생성된 미션을 서버에 저장 (수강생들이 불러올 수 있도록)
      try {
        const supabase = getSupabaseBrowser()
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          await fetch("/api/course/update", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ missions: init, language: language ?? "Java" }),
          })
        }
      } catch { /* 저장 실패해도 로컬에는 저장됨 */ }

      setUploadMsg(`✅ ${file.name} 기반으로 미션 ${init.length}개 생성됐어요! (언어: ${language ?? "Java"})`)
    } catch {
      setUploadMsg("❌ 파일 처리 중 오류가 발생했어요.")
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  const doneCount = missions.filter((m) => m.status === "done").length
  const progress  = missions.length > 0 ? Math.round((doneCount / missions.length) * 100) : 0

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8">
      <h1 className="text-2xl font-black text-[#3c3c3c] mb-1">퀘스트</h1>
      <p className="text-[#777] font-semibold mb-6">코딩 문제를 풀고 AI 평가를 받아 미션을 완료하세요!</p>

      {/* 진행률 */}
      <div className="bg-white rounded-2xl p-5 border-2 border-[#e5e5e5] mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="font-bold text-[#3c3c3c] text-sm">오늘의 진행률</p>
          <p className="font-black text-[#58cc02]">{doneCount}/{missions.length}</p>
        </div>
        <div className="h-4 bg-[#f7f7f7] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#58cc02] rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-[#afafaf] font-semibold mt-1 text-right">{progress}% 완료</p>
      </div>

      {/* 강사 전용: AI 미션 생성 */}
      {role === "instructor" && (
        <div className="bg-[#f0fff0] border-2 border-[#58cc02]/30 rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#58cc02]" />
              <p className="font-bold text-[#3c3c3c]">AI 미션 자동 생성</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#1cb0f6]/10 text-[#1cb0f6]">
              현재 언어: {courseLanguage}
            </span>
          </div>
          <p className="text-sm text-[#777] font-semibold mb-4">
            PDF·TXT 파일을 업로드하면 Gemini AI가 자동으로 미션을 만들고, 수업 언어도 자동으로 감지돼요.
          </p>
          <input ref={fileRef} type="file" accept=".pdf,.txt" className="hidden" onChange={handleFileUpload} />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-5 py-3 bg-[#58cc02] text-white font-bold rounded-2xl border-b-4 border-[#46a302] hover:bg-[#58cc02]/90 active:border-b-0 transition-all disabled:opacity-60"
          >
            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
            {uploading ? "생성 중..." : "파일 업로드"}
          </button>
          {uploadMsg && <p className="mt-3 text-sm font-semibold text-[#3c3c3c]">{uploadMsg}</p>}
        </div>
      )}

      {/* 미션 목록 */}
      <div className="space-y-3">
        {missions.map((mission) => (
          <MissionCard
            key={mission.id}
            mission={mission}
            isExpanded={expandedId === mission.id}
            onToggleExpand={() => {
              if (mission.status === "active") {
                setExpandedId((prev) => (prev === mission.id ? null : mission.id))
              }
            }}
            onComplete={() => completeMission(mission.id)}
          />
        ))}
      </div>

      {doneCount === missions.length && missions.length > 0 && (
        <div className="mt-8 text-center">
          <div className="w-20 h-20 bg-[#58cc02]/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-10 h-10 text-[#58cc02]" />
          </div>
          <p className="text-xl font-black text-[#58cc02]">오늘 미션 완료! 🎉</p>
          <p className="text-[#777] font-semibold mt-1">내일도 함께해요!</p>
        </div>
      )}
    </div>
  )
}

// ── MissionCard ───────────────────────────────────────────
function MissionCard({
  mission,
  isExpanded,
  onToggleExpand,
  onComplete,
}: {
  mission: Mission
  isExpanded: boolean
  onToggleExpand: () => void
  onComplete: () => void
}) {
  const isDone   = mission.status === "done"
  const isLocked = mission.status === "locked"
  const isActive = mission.status === "active"

  const [code,       setCode]       = useState(mission.problem.starterCode)
  const [evaluating, setEvaluating] = useState(false)
  const [evalResult, setEvalResult] = useState<CodeEvalResult | null>(null)
  const [evalError,  setEvalError]  = useState<string | null>(null)
  const textareaRef                 = useRef<HTMLTextAreaElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault()
      const ta = textareaRef.current!
      const start = ta.selectionStart
      const end   = ta.selectionEnd
      const newVal = code.slice(0, start) + "    " + code.slice(end)
      setCode(newVal)
      setTimeout(() => { ta.selectionStart = ta.selectionEnd = start + 4 }, 0)
    }
  }

  const evaluateCode = async () => {
    if (!code.trim()) { setEvalError("코드를 입력해주세요."); return }
    setEvaluating(true); setEvalResult(null); setEvalError(null)

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
    if (!apiKey) { setEvalError("GEMINI_API_KEY가 설정되지 않았습니다."); setEvaluating(false); return }

    const prompt = `
당신은 코딩 교육 AI 튜터입니다. 아래 [문제]와 [예상 출력]을 기준으로 [학생 코드]를 평가해주세요.

[문제 제목]
${mission.title}

[문제 요구사항]
${mission.problem.prompt}

[예상 출력]
${mission.problem.expectedOutput}

[학생 코드 (${mission.problem.language})]
\`\`\`
${code}
\`\`\`

[평가 기준]
1. 예상 출력과 동일한 결과를 내는가? (0~50점) — 가장 중요
2. 문제 요구사항을 모두 충족했는가? (0~30점)
3. 코드가 문법적으로 올바른가? (0~20점)

[출력 형식] JSON만 반환하세요. 다른 텍스트 없이:
{
  "score": 85,
  "feedback": "잘 작성했습니다! 단, ~부분에서 예상 출력과 다를 수 있어요.",
  "passable": true
}
passable은 score가 70 이상이면 true, 미만이면 false.
`

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 512 },
        }),
      })
      const json = await res.json()
      const raw: string = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? ""
      const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
      setEvalResult(JSON.parse(cleaned) as CodeEvalResult)
    } catch {
      setEvalError("AI 평가 중 오류가 발생했습니다. 다시 시도해주세요.")
    } finally {
      setEvaluating(false)
    }
  }

  const scoreColor = (s: number) =>
    s >= 80 ? "#58cc02" : s >= 60 ? "#ffc800" : "#ff4b4b"

  return (
    <div className={`rounded-2xl border-2 transition-all ${
      isDone   ? "bg-[#f0fff0] border-[#58cc02]/30" :
      isActive ? "bg-white border-[#1cb0f6] shadow-md" :
                 "bg-white border-[#e5e5e5] opacity-60"
    }`}>
      {/* 미션 헤더 */}
      <div
        className={`flex items-start gap-4 p-5 ${isActive ? "cursor-pointer" : ""}`}
        onClick={isActive ? onToggleExpand : undefined}
      >
        <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${
          isDone ? "bg-[#58cc02]" : isActive ? "bg-[#1cb0f6]" : "bg-[#e5e5e5]"
        }`}>
          {isDone   ? <CheckCircle2 className="w-6 h-6 text-white" /> :
           isLocked ? <Lock         className="w-5 h-5 text-[#afafaf]" /> :
                      <Code2        className="w-5 h-5 text-white" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${LEVEL_COLOR[mission.level]}`}>
              {LEVEL_LABEL[mission.level]}
            </span>
            <span className="text-xs text-[#afafaf] font-semibold">#{mission.no}</span>
          </div>
          <p className={`font-bold ${isDone ? "text-[#58cc02] line-through" : isLocked ? "text-[#afafaf]" : "text-[#3c3c3c]"}`}>
            {mission.title}
          </p>
          <p className="text-sm text-[#777] font-semibold mt-0.5">{mission.description}</p>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          {isDone && <span className="text-[#58cc02] text-sm font-bold">✓ 완료!</span>}
          {isLocked && <span className="text-[#afafaf] text-xs font-semibold">이전 미션 완료 후 해제</span>}
          {isActive && (
            isExpanded
              ? <ChevronUp   className="w-5 h-5 text-[#1cb0f6]" />
              : <ChevronDown className="w-5 h-5 text-[#1cb0f6]" />
          )}
        </div>
      </div>

      {/* 코드 에디터 영역 */}
      {isActive && isExpanded && (
        <div className="px-5 pb-5 border-t border-[#e5e5e5] pt-4">
          {/* 문제 설명 */}
          <div className="bg-[#f7f7f7] rounded-2xl p-4 mb-4">
            <p className="text-xs font-bold text-[#1cb0f6] mb-2 flex items-center gap-1">
              📋 문제
            </p>
            <p className="text-sm text-[#3c3c3c] font-semibold whitespace-pre-wrap leading-relaxed">
              {mission.problem.prompt}
            </p>
          </div>

          {/* 예상 출력 */}
          <div className="bg-[#1e1e1e] rounded-xl p-3 mb-4">
            <p className="text-xs font-bold text-[#afafaf] mb-1.5 flex items-center gap-1">
              <Terminal className="w-3.5 h-3.5" /> 예상 출력
            </p>
            <pre className="text-[#58cc02] text-sm font-mono whitespace-pre-wrap">
              {mission.problem.expectedOutput}
            </pre>
          </div>

          {/* 코드 에디터 */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-[#afafaf]" />
              <span className="text-xs font-bold text-[#777]">
                코드 작성 ({mission.problem.language})
              </span>
            </div>
            <button
              type="button"
              onClick={() => { setCode(mission.problem.starterCode); setEvalResult(null); setEvalError(null) }}
              className="flex items-center gap-1 text-xs font-bold text-[#afafaf] hover:text-[#ff4b4b] transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> 초기화
            </button>
          </div>

          <div className="rounded-2xl overflow-hidden border-2 border-[#3c3c3c]/10 mb-3">
            <div className="flex items-center gap-1.5 px-4 py-2.5 bg-[#2d2d2d]">
              <div className="w-3 h-3 rounded-full bg-[#ff4b4b]" />
              <div className="w-3 h-3 rounded-full bg-[#ffc800]" />
              <div className="w-3 h-3 rounded-full bg-[#58cc02]" />
              <span className="ml-2 text-[#afafaf] text-xs font-mono">
                main.{mission.problem.language === "python" ? "py" : "java"}
              </span>
            </div>
            <div className="flex">
              <div className="bg-[#1e1e1e] text-[#555] text-xs font-mono px-3 pt-3 pb-3 select-none text-right min-w-[36px] leading-[22px]">
                {(code || " ").split("\n").map((_, i) => <div key={i}>{i + 1}</div>)}
              </div>
              <textarea
                ref={textareaRef}
                value={code}
                onChange={(e) => { setCode(e.target.value); setEvalResult(null); setEvalError(null) }}
                onKeyDown={handleKeyDown}
                spellCheck={false}
                className="flex-1 bg-[#1e1e1e] text-[#d4d4d4] text-sm font-mono px-4 py-3 outline-none resize-none leading-[22px] placeholder:text-[#555] min-h-[180px]"
                style={{ tabSize: 4 }}
              />
            </div>
          </div>

          {/* AI 평가 버튼 */}
          <button
            type="button"
            onClick={evaluateCode}
            disabled={evaluating || !code.trim()}
            className="w-full py-3 bg-[#9b59b6] text-white font-bold rounded-2xl border-b-4 border-[#7d3c98] hover:bg-[#9b59b6]/90 active:border-b-0 transition-all disabled:opacity-60 flex items-center justify-center gap-2 mb-3"
          >
            {evaluating
              ? <><Loader2 className="w-5 h-5 animate-spin" /> AI 분석 중...</>
              : <><Play    className="w-5 h-5" /> AI 코드 평가받기</>
            }
          </button>

          {/* 에러 */}
          {evalError && (
            <div className="flex items-center gap-2 p-3 bg-[#fff0f0] border border-[#ff4b4b]/20 rounded-xl mb-3">
              <AlertCircle className="w-4 h-4 text-[#ff4b4b] shrink-0" />
              <p className="text-sm text-[#ff4b4b] font-semibold">{evalError}</p>
            </div>
          )}

          {/* 평가 결과 */}
          {evalResult && (
            <div className={`p-4 rounded-2xl border-2 mb-3 ${
              evalResult.passable ? "bg-[#f0fff0] border-[#58cc02]/30" : "bg-[#fff9e6] border-[#ffc800]/40"
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-16 h-16 rounded-2xl flex flex-col items-center justify-center shrink-0 text-white font-black"
                  style={{ background: scoreColor(evalResult.score) }}
                >
                  <span className="text-2xl leading-none">{evalResult.score}</span>
                  <span className="text-[10px] font-bold opacity-80">/ 100</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-[#777]">완성도</span>
                    <span className="text-xs font-bold" style={{ color: scoreColor(evalResult.score) }}>
                      {evalResult.score}점
                    </span>
                  </div>
                  <div className="h-3 bg-[#f7f7f7] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${evalResult.score}%`, background: scoreColor(evalResult.score) }}
                    />
                  </div>
                  <p className="text-xs font-bold mt-1" style={{ color: scoreColor(evalResult.score) }}>
                    {evalResult.score >= 80 ? "🎉 훌륭해요!" :
                     evalResult.score >= 60 ? "💪 조금 더 수정해봐요!" :
                                              "📚 예상 출력을 다시 확인하세요."}
                  </p>
                </div>
              </div>

              <div className="bg-white/70 rounded-xl p-3">
                <p className="text-xs font-bold text-[#9b59b6] mb-1 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> AI 피드백
                </p>
                <p className="text-sm text-[#3c3c3c] font-semibold leading-relaxed">{evalResult.feedback}</p>
              </div>

              {evalResult.passable ? (
                <button
                  type="button"
                  onClick={onComplete}
                  className="w-full mt-3 py-3 bg-[#58cc02] text-white font-bold rounded-2xl border-b-4 border-[#46a302] hover:bg-[#58cc02]/90 active:border-b-0 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  미션 완료로 처리하기!
                </button>
              ) : (
                <div className="mt-3 p-3 bg-[#ffc800]/10 rounded-xl text-center">
                  <p className="text-xs font-bold text-[#ff9600]">
                    70점 이상이어야 완료할 수 있어요. 예상 출력과 비교해 코드를 수정해보세요!
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 접힌 상태 — 클릭 유도 */}
      {isActive && !isExpanded && (
        <div className="px-5 pb-4 cursor-pointer" onClick={onToggleExpand}>
          <div className="flex items-center gap-2 text-[#1cb0f6] text-xs font-bold">
            <Code2 className="w-3.5 h-3.5" />
            <span>클릭해서 문제 확인 & 코드 작성하기</span>
          </div>
        </div>
      )}
    </div>
  )
}
