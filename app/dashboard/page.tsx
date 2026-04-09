"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import ChatbotWidget from "@/components/chatbot-widget"
import {
  Home,
  BookOpen,
  Trophy,
  User,
  Flame,
  Star,
  Lock,
  ChevronRight,
  Users,
  MessageCircle,
  Menu,
  X,
  Check,
  FileText,
  Bell,
  CalendarCheck,
  NotebookPen,
  Sparkles,
  Plus,
} from "lucide-react"

import { supabase } from "@/lib/supabase"

// 임시 사용자 데이터 (실제로는 인증에서 가져옴)
const userData = {
  name: "학습자",
  role: "student" as "student" | "instructor", // "student" 또는 "instructor"로 변경 가능
  streak: 7,
  xp: 1250,
  dailyGoal: 50,
  dailyProgress: 35,
}

// 학습 경로 데이터
type UnitStatus = "completed" | "current" | "locked"
type Unit = {
  id: number
  title: string
  status: UnitStatus
  xp: number
}

const learningPath: Unit[] = [
  { id: 1, title: "파이썬 기초", status: "completed", xp: 100 },
  { id: 2, title: "변수와 자료형", status: "completed", xp: 150 },
  { id: 3, title: "조건문", status: "current", xp: 200 },
  { id: 4, title: "반복문", status: "locked", xp: 200 },
  { id: 5, title: "함수", status: "locked", xp: 250 },
  { id: 6, title: "리스트와 튜플", status: "locked", xp: 250 },
  { id: 7, title: "딕셔너리", status: "locked", xp: 300 },
  { id: 8, title: "클래스", status: "locked", xp: 350 },
]

const dailyMissions = [
  {
    id: "concept",
    title: "개념 10분 정리",
    detail: "핵심만 읽고, 키워드 3개만 적기",
  },
  {
    id: "practice",
    title: "연습 문제 5개",
    detail: "오답은 체크만 하고 다음으로 넘어가기",
  },
  {
    id: "review",
    title: "복습 5분",
    detail: "틀린 개념을 다시 한 번 훑기",
  },
]

function getUnitSteps(unit: Unit) {
  if (unit.status === "current") {
    return ["핵심 개념 잡기", "예제 1~2개 따라 하기", "문제 풀기", "오답 복습"]
  }
  if (unit.status === "locked") {
    return ["관련 배경 지식 예습", "다음에 올 문제 감 잡기", "용어 확인", "현재 단원 복습 먼저"]
  }
  return ["복습(요약) 다시 보기", "비슷한 유형 2~3개 풀기", "응용 질문 챗봇에 요청"]
}

type QuestionItem = {
  id: string
  text: string
  createdAt: number
}

type MaterialItem = {
  id: number
  class_id?: string | null
  filename: string
  content: string
}

type ReviewNote = {
  id: string
  title: string
  content: string
  createdAt: number
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
}

export default function DashboardPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const [role, setRole] = useState<"student" | "instructor">(() => {
    if (typeof window === "undefined") return "student"
    const r = new URLSearchParams(window.location.search).get("role")
    return r === "instructor" ? "instructor" : "student"
  })

  const scrollToId = (id: string) => {
    const el = document.getElementById(id)
    el?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const currentUnit =
    learningPath.find((u) => u.status === "current") ?? learningPath[0]
  const nextUnit =
    learningPath.find((u) => u.status === "locked") ??
    learningPath.find((u) => u.status === "current") ??
    learningPath[0]

  const [selectedUnit, setSelectedUnit] = useState<Unit>(currentUnit)

  const [chatOpen, setChatOpen] = useState(false)
  const [chatUnitContext, setChatUnitContext] = useState<string>(currentUnit.title)

  const [missionDone, setMissionDone] = useState<Record<string, boolean>>({
    concept: false,
    practice: false,
    review: false,
  })

  const missionsDoneCount = dailyMissions.reduce(
    (acc, m) => acc + (missionDone[m.id] ? 1 : 0),
    0,
  )

  const toggleMission = (id: string) => {
    setMissionDone((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const openChat = (unitTitle: string) => {
    setChatUnitContext(unitTitle)
    setChatOpen(true)
  }

  // ─────────────────────────────────────────
  // 학생 기능(로그인 없이) - 로컬 동작 우선
  // ─────────────────────────────────────────
  const todayKey = new Date().toISOString().slice(0, 10)
  const attendanceStorageKey = `eduvibe_attendance_${todayKey}`
  const [attendancePresent, setAttendancePresent] = useState(false)
  const [attendanceAt, setAttendanceAt] = useState<number | null>(null)

  const questionsStorageKey = `eduvibe_question_board_v1`
  const [questionInput, setQuestionInput] = useState("")
  const [questions, setQuestions] = useState<QuestionItem[]>([
    {
      id: "seed-1",
      text: "조건문에서 if / else 중 어떤 걸 먼저 써야 하나요?",
      createdAt: Date.now() - 1000 * 60 * 45,
    },
  ])

  const reviewNotesStorageKey = "eduvibe_review_notes_v1"
  const [reviewNotes, setReviewNotes] = useState<ReviewNote[]>([])
  const [noteTitle, setNoteTitle] = useState("")
  const [noteContent, setNoteContent] = useState("")

  const [materialsClassId, setMaterialsClassId] = useState<string>("1")
  const [materialsLoading, setMaterialsLoading] = useState(false)
  const [materialsError, setMaterialsError] = useState<string | null>(null)
  const [materials, setMaterials] = useState<MaterialItem[]>([])
  const [selectedMaterialId, setSelectedMaterialId] = useState<number | null>(null)
  const selectedMaterial = materials.find((m) => m.id === selectedMaterialId) ?? null

  const [aiSummaryLoading, setAiSummaryLoading] = useState(false)
  const [aiSummaryError, setAiSummaryError] = useState<string | null>(null)
  const [aiSummary, setAiSummary] = useState<string>("")
  const [aiSummaryMode, setAiSummaryMode] = useState<"material" | "unit">("material")

  // 간단 토스트 (로컬 UI)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const showToast = (msg: string) => {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2500)
  }

  // ─────────────────────────────────────────
  // 강사 기능(학생 데이터 기반, 로그인 없이 로컬/DB 혼합)
  // ─────────────────────────────────────────
  const [instructorAnswerLoadingId, setInstructorAnswerLoadingId] = useState<
    string | null
  >(null)
  const [instructorAnswerByQuestionId, setInstructorAnswerByQuestionId] =
    useState<Record<string, string>>({})
  const [instructorAnswerError, setInstructorAnswerError] = useState<string | null>(null)

  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadValidDays, setUploadValidDays] = useState<number>(30)

  const [supplementTopic, setSupplementTopic] = useState<string>("조건문")
  const [supplementEmail, setSupplementEmail] = useState<string>("")
  const [supplementLoading, setSupplementLoading] = useState(false)
  const [supplementText, setSupplementText] = useState<string>("")
  const [supplementError, setSupplementError] = useState<string | null>(null)

  useEffect(() => {
    // Attendance restore
    try {
      const raw = localStorage.getItem(attendanceStorageKey)
      if (raw) {
        const parsed = JSON.parse(raw) as { present: boolean; at: number | null }
        setAttendancePresent(!!parsed.present)
        setAttendanceAt(parsed.at ?? null)
      }
    } catch {
      // ignore
    }

    // Question board restore
    try {
      const raw = localStorage.getItem(questionsStorageKey)
      if (raw) {
        const parsed = JSON.parse(raw) as QuestionItem[]
        if (Array.isArray(parsed) && parsed.length > 0) setQuestions(parsed)
      }
    } catch {
      // ignore
    }

    // Review notes restore
    try {
      const raw = localStorage.getItem(reviewNotesStorageKey)
      if (raw) {
        const parsed = JSON.parse(raw) as ReviewNote[]
        if (Array.isArray(parsed)) setReviewNotes(parsed)
      }
    } catch {
      // ignore
    }
  }, [attendanceStorageKey, questionsStorageKey, reviewNotesStorageKey])

  useEffect(() => {
    // Persist attendance
    try {
      localStorage.setItem(
        attendanceStorageKey,
        JSON.stringify({ present: attendancePresent, at: attendanceAt }),
      )
    } catch {
      // ignore
    }
  }, [attendanceAt, attendancePresent, attendanceStorageKey])

  useEffect(() => {
    // Persist question board
    try {
      localStorage.setItem(questionsStorageKey, JSON.stringify(questions))
    } catch {
      // ignore
    }
  }, [questions, questionsStorageKey])

  useEffect(() => {
    // Persist review notes
    try {
      localStorage.setItem(reviewNotesStorageKey, JSON.stringify(reviewNotes))
    } catch {
      // ignore
    }
  }, [reviewNotes, reviewNotesStorageKey])

  useEffect(() => {
    async function loadMaterials() {
      setMaterialsLoading(true)
      setMaterialsError(null)
      try {
        const { data, error } = await supabase
          .from("materials")
          .select("id, class_id, filename, content")
          .eq("class_id", materialsClassId)

        if (error) {
          setMaterialsError(error.message)
          setMaterials([])
          setSelectedMaterialId(null)
          return
        }

        const safe = (data ?? []).filter(
          (x) => typeof x?.filename === "string" && typeof x?.content === "string",
        ) as MaterialItem[]
        const now = Date.now()
        const safeWithValidity = safe.filter((m) => {
          const rawUntil = localStorage.getItem(
            `eduvibe_material_valid_until_${m.id}`,
          )
          if (!rawUntil) return true
          const until = Number(rawUntil)
          return Number.isFinite(until) ? now <= until : true
        })
        setMaterials(safeWithValidity)
        setSelectedMaterialId(safeWithValidity[0]?.id ?? null)
      } catch {
        setMaterialsError("자료 불러오기에 실패했어요.")
        setMaterials([])
        setSelectedMaterialId(null)
      } finally {
        setMaterialsLoading(false)
      }
    }

    void loadMaterials()
  }, [materialsClassId])

  const truncate = (text: string, maxLen: number) => {
    if (!text) return ""
    if (text.length <= maxLen) return text
    return `${text.slice(0, maxLen)}...`
  }

  const requestAiSummary = async () => {
    setAiSummaryLoading(true)
    setAiSummaryError(null)
    setAiSummary("")

    try {
      const sourceText =
        aiSummaryMode === "material"
          ? selectedMaterial?.content ?? ""
          : `선택 단원: ${selectedUnit.title}`

      if (!sourceText || sourceText.trim().length === 0) {
        setAiSummaryError("요약할 내용이 없어요. 자료를 먼저 선택해 주세요.")
        return
      }

      const payload = {
        messages: [
          {
            role: "system" as const,
            content:
              "당신은 학생용 AI 튜터입니다. 아래 내용을 바탕으로 오늘 학습에 바로 도움이 되게 짧고 명확하게 요약해 주세요. 한국어로만 답하세요.",
          },
          {
            role: "user" as const,
            content: `아래 자료를 바탕으로 학생이 바로 복습할 수 있게 요약해 주세요.\n\n요약 형식:\n1) 핵심 개념 5개\n2) 자주 틀리는 포인트 3개\n3) 오늘 다음 단계(연습 3개)\n\n[내용]\n${truncate(sourceText, 6000)}`,
          },
        ],
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = (await res.json()) as { content?: string; error?: string }
      if (!res.ok) throw new Error(data.error ?? `요약 실패 (${res.status})`)

      setAiSummary(data.content ?? "요약을 가져올 수 없습니다.")
    } catch (e) {
      setAiSummaryError(e instanceof Error ? e.message : "요약 요청 중 오류가 발생했어요.")
    } finally {
      setAiSummaryLoading(false)
    }
  }

  const requestInstructorAnswer = async (q: QuestionItem) => {
    setInstructorAnswerLoadingId(q.id)
    setInstructorAnswerError(null)
    try {
      const payload = {
        messages: [
          {
            role: "system" as const,
            content:
              "당신은 Java 수업 강사입니다. 학생 질문에 대해 한국어로, 존댓말로, 단계적으로 설명해 주세요. 필요한 경우 예제 코드를 함께 제공하되, 설명이 먼저 오고 코드가 마지막에 오게 해주세요.",
          },
          {
            role: "user" as const,
            content: `학생 질문:\n${q.text}`,
          },
        ],
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = (await res.json()) as { content?: string; error?: string }
      if (!res.ok) throw new Error(data.error ?? `답변 실패 (${res.status})`)

      setInstructorAnswerByQuestionId((prev) => ({
        ...prev,
        [q.id]: data.content ?? "",
      }))
    } catch (e) {
      const msg = e instanceof Error ? e.message : "답변 생성 중 오류가 발생했어요."
      showToast(msg)
      setInstructorAnswerError(msg)
    } finally {
      setInstructorAnswerLoadingId(null)
    }
  }

  const materialValidUntilKey = (materialId: number) =>
    `eduvibe_material_valid_until_${materialId}`

  const loadMaterialsFresh = async (overrideClassId?: string) => {
    setMaterialsLoading(true)
    setMaterialsError(null)
    try {
      const { data, error } = await supabase
        .from("materials")
        .select("id, class_id, filename, content")
        .eq("class_id", overrideClassId ?? materialsClassId)

      if (error) {
        setMaterialsError(error.message)
        setMaterials([])
        setSelectedMaterialId(null)
        return
      }

      const safe = (data ?? []).filter(
        (x) => typeof x?.filename === "string" && typeof x?.content === "string",
      ) as MaterialItem[]

      const now = Date.now()
      const safeWithValidity = safe.filter((m) => {
        const rawUntil = localStorage.getItem(materialValidUntilKey(m.id))
        if (!rawUntil) return true
        const until = Number(rawUntil)
        return Number.isFinite(until) ? now <= until : true
      })

      setMaterials(safeWithValidity)
      setSelectedMaterialId(safeWithValidity[0]?.id ?? null)
    } catch {
      setMaterialsError("자료 불러오기에 실패했어요.")
      setMaterials([])
      setSelectedMaterialId(null)
    } finally {
      setMaterialsLoading(false)
    }
  }

  const handleInstructorUploadMaterial = async () => {
    if (!uploadFile) {
      showToast("PDF 파일을 선택해주세요.")
      return
    }

    setUploading(true)
    setAiSummaryError(null)
    try {
      const formData = new FormData()
      formData.append("file", uploadFile)
      formData.append("class_id", materialsClassId)

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const data = (await res.json()) as {
        success?: boolean
        material_id?: number
        error?: string
      }

      if (!res.ok || data.error) {
        throw new Error(data.error ?? `업로드 실패 (${res.status})`)
      }

      const materialId = data.material_id
      if (materialId) {
        const until = Date.now() + uploadValidDays * 24 * 60 * 60 * 1000
        localStorage.setItem(materialValidUntilKey(materialId), String(until))
      }

      showToast("수업 자료 업로드 완료!")
      setUploadFile(null)
      await loadMaterialsFresh(materialsClassId)
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "업로드 중 오류가 발생했어요. 다시 시도해주세요."
      showToast(msg)
    } finally {
      setUploading(false)
    }
  }

  const requestSupplement = async () => {
    setSupplementLoading(true)
    setSupplementError(null)
    setSupplementText("")
    try {
      const topic = supplementTopic.trim()
      if (!topic) {
        setSupplementError("보충자료 주제를 선택해주세요.")
        return
      }

      const relatedQuestions = questions.slice(0, 6).map((qq, i) => `${i + 1}. ${qq.text}`)

      const payload = {
        messages: [
          {
            role: "system" as const,
            content:
              "당신은 Java 수업 강사입니다. 학생용 보충자료를 생성해 주세요. 한국어로만, 존댓말로, 바로 학습에 쓸 수 있게 작성해 주세요.",
          },
          {
            role: "user" as const,
            content: `학생들이 "${topic}"에서 많이 막히고 있어요. 아래 학생 질문들을 참고해서 보충자료를 만들어 주세요.\n\n[필수 구성]\n1) 핵심 개념 정리(짧게)\n2) 자주 틀리는 포인트\n3) 예제 코드 1개 + 설명\n4) 연습 문제 3개(정답은 마지막에 따로)\n\n[학생 질문]\n${relatedQuestions.join("\n")}`,
          },
        ],
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = (await res.json()) as { content?: string; error?: string }
      if (!res.ok) throw new Error(data.error ?? `생성 실패 (${res.status})`)

      setSupplementText(data.content ?? "보충자료를 생성하지 못했습니다.")
    } catch (e) {
      const msg = e instanceof Error ? e.message : "보충자료 생성 중 오류가 발생했어요."
      setSupplementError(msg)
      showToast(msg)
    } finally {
      setSupplementLoading(false)
    }
  }

  const handleToggleAttendance = () => {
    if (attendancePresent) {
      setAttendancePresent(false)
      setAttendanceAt(null)
      return
    }
    setAttendancePresent(true)
    setAttendanceAt(Date.now())
  }

  const submitQuestion = () => {
    const trimmed = questionInput.trim()
    if (!trimmed) return

    const next: QuestionItem = {
      id: `q_${Date.now()}`,
      text: trimmed,
      createdAt: Date.now(),
    }

    setQuestions((prev) => [next, ...prev])
    setQuestionInput("")
  }

  const saveReviewNote = () => {
    const title = noteTitle.trim()
    const content = noteContent.trim()
    if (!title) {
      showToast("제목을 입력해주세요.")
      return
    }
    if (!content) {
      showToast("내용을 입력해주세요.")
      return
    }

    const next: ReviewNote = {
      id: `n_${Date.now()}`,
      title,
      content,
      createdAt: Date.now(),
    }

    setReviewNotes((prev) => [next, ...prev])
    setNoteTitle("")
    setNoteContent("")
  }

  const deleteReviewNote = (id: string) => {
    setReviewNotes((prev) => prev.filter((n) => n.id !== id))
  }

  return (
    <div className="min-h-screen bg-[#f7f7f7] flex">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] bg-[#ff3b3b] text-white font-bold px-4 py-2 rounded-2xl shadow-lg border-b-4 border-[#d12b2b]">
          {toast}
        </div>
      )}
      {/* Left Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r-2 border-[#e5e5e5] transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 lg:static`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b-2 border-[#e5e5e5]">
            <Link href="/dashboard" className="block">
              <h1 className="text-2xl font-black text-[#58cc02]">
                EduVibe<span className="text-[#1cb0f6]">-AI</span>
              </h1>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            <NavItem
              icon={Home}
              label="홈"
              active
              onClick={() => scrollToId("dashboard-home")}
            />
            <NavItem
              icon={BookOpen}
              label="배우기"
              onClick={() => scrollToId("learn-section")}
            />
            <NavItem
              icon={Trophy}
              label="퀘스트"
              onClick={() => scrollToId("quest-section")}
            />
            <NavItem
              icon={User}
              label="프로필"
              onClick={() => scrollToId("profile-section")}
            />
          </nav>

          {/* Close button for mobile */}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden absolute top-4 right-4 p-2 text-[#afafaf] hover:text-[#3c3c3c]"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </aside>

      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 min-w-0 lg:ml-64">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-30 bg-white border-b-2 border-[#e5e5e5] px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 text-[#3c3c3c]"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-black text-[#58cc02]">
            EduVibe<span className="text-[#1cb0f6]">-AI</span>
          </h1>
          <div className="w-10" />
        </header>

        {/* Student Banner */}
        {role === "student" && (
          <div className="bg-gradient-to-r from-[#58cc02] to-[#46a302] p-4 md:p-6">
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-white/80 text-sm font-semibold">
                    학생 모드
                  </p>
                  <p className="text-white font-bold">
                    오늘 미션만 딱 끝내볼까요?
                  </p>
                </div>
              </div>
              <div className="text-white/90 text-sm font-semibold">
                오늘 완료: <span className="text-white">{missionsDoneCount}</span>
                /{dailyMissions.length}
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
          <div
            id="dashboard-home"
            className="max-w-4xl mx-auto p-4 md:p-8"
          >
            <div className="mb-6 flex items-center justify-between gap-3">
              <div className="text-sm font-bold text-[#3c3c3c]">모드</div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRole("student")}
                  className={`px-4 py-2 rounded-2xl font-bold border-b-4 transition-all ${
                    role === "student"
                      ? "bg-[#1cb0f6] text-white border-[#1899d6] active:border-b-0"
                      : "bg-white text-[#1cb0f6] border-[#cdeeff] hover:bg-[#eaf7ff] border-b-4 active:border-b-0"
                  }`}
                >
                  학생
                </button>
                <button
                  type="button"
                  onClick={() => setRole("instructor")}
                  className={`px-4 py-2 rounded-2xl font-bold border-b-4 transition-all ${
                    role === "instructor"
                      ? "bg-[#58cc02] text-white border-[#46a302] active:border-b-0"
                      : "bg-white text-[#58cc02] border-[#d7f5b5] hover:bg-[#f0fff0] border-b-4 active:border-b-0"
                  }`}
                >
                  강사
                </button>
              </div>
            </div>
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-[#3c3c3c]">
              {userData.name}님, 오늘도 시작해요!
            </h2>
            <p className="text-[#777] font-semibold mt-1">
              지금은 {currentUnit.title} 단원을 학습 중이에요.
            </p>
          </div>

          {/* Learning Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-2xl p-4 border-2 border-[#e5e5e5]">
              <p className="text-[#3c3c3c] font-bold">현재 단원</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xl font-black text-[#1cb0f6]">
                    {currentUnit.title}
                  </p>
                  <p className="text-[#777] font-semibold text-sm mt-1">
                    +{currentUnit.xp} XP
                  </p>
                </div>
                  <button
                    type="button"
                    onClick={() => openChat(currentUnit.title)}
                    className="px-4 py-2 rounded-2xl bg-[#1cb0f6] text-white font-bold border-b-4 border-[#1899d6] hover:bg-[#1cb0f6]/90 active:border-b-0 active:translate-y-1 transition-all"
                  >
                    이 단원으로 질문
                  </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border-2 border-[#e5e5e5]">
              <p className="text-[#3c3c3c] font-bold">다음 단원</p>
              <div className="mt-2">
                <p className="text-xl font-black text-[#58cc02]">
                  {nextUnit.title}
                </p>
                <p className="text-[#777] font-semibold text-sm mt-1">
                  준비되면 자동으로 이어서 진행돼요
                </p>
              </div>
            </div>
          </div>

          {/* Daily Missions */}
          <div
            id="quest-section"
            className="bg-white rounded-2xl p-4 border-2 border-[#e5e5e5] mb-8"
          >
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[#3c3c3c] font-bold text-lg">오늘의 미션</p>
                <p className="text-[#777] font-semibold text-sm mt-1">
                  {missionsDoneCount} / {dailyMissions.length} 완료
                </p>
              </div>
              <div className="text-[#58cc02] font-black text-2xl">
                {Math.round((missionsDoneCount / dailyMissions.length) * 100)}%
              </div>
            </div>

            <div className="relative h-3 bg-[#e5e5e5] rounded-full overflow-hidden mt-3">
              <div
                className="absolute left-0 top-0 h-full bg-[#58cc02] rounded-full transition-all duration-500"
                style={{
                  width: `${(missionsDoneCount / dailyMissions.length) * 100}%`,
                }}
              />
            </div>

            <div className="mt-4 space-y-3">
              {dailyMissions.map((m) => {
                const checked = !!missionDone[m.id]
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleMission(m.id)}
                    className={`w-full text-left p-3 rounded-2xl border-2 transition-all ${
                      checked
                        ? "border-[#58cc02] bg-[#f0fff0]"
                        : "border-[#e5e5e5] hover:border-[#1cb0f6]"
                    }`}
                    aria-pressed={checked}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-[#3c3c3c]">{m.title}</p>
                        <p className="text-[#777] font-semibold text-sm mt-1">
                          {m.detail}
                        </p>
                      </div>
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          checked ? "bg-[#58cc02]" : "bg-[#e5e5e5]"
                        }`}
                      >
                        {checked ? (
                          <Check className="w-5 h-5 text-white" />
                        ) : (
                          <span className="w-5 h-5" />
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Learning Path */}
          <div id="learn-section" className="relative">
            {/* Path Line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-[#e5e5e5] -translate-x-1/2 z-0" />

            {/* Unit Nodes */}
            <div className="relative z-10 space-y-6">
              {learningPath.map((unit, index) => (
                <UnitNode
                  key={unit.id}
                  unit={unit}
                  isLeft={index % 2 === 0}
                  selected={selectedUnit.id === unit.id}
                  onSelect={setSelectedUnit}
                />
              ))}
            </div>
          </div>

          {/* Unit Detail */}
          <div className="mt-8 bg-white rounded-2xl border-2 border-[#e5e5e5] p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[#777] font-semibold text-sm">
                  선택 단원
                </p>
                <p className="text-2xl font-black text-[#3c3c3c]">
                  {selectedUnit.title}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-bold border-2 ${
                    selectedUnit.status === "current"
                      ? "text-[#1cb0f6] border-[#1899d6] bg-[#eaf7ff]"
                      : selectedUnit.status === "locked"
                        ? "text-[#afafaf] border-[#d0d0d0] bg-[#f7f7f7]"
                        : "text-[#58cc02] border-[#46a302] bg-[#f0fff0]"
                  }`}
                >
                  {selectedUnit.status === "current"
                    ? "현재"
                    : selectedUnit.status === "locked"
                      ? "예정"
                      : "완료"}
                </span>
                <span className="text-[#777] font-semibold text-sm">
                  +{selectedUnit.xp} XP
                </span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl bg-[#f7f7f7] p-4">
                <p className="font-bold text-[#3c3c3c]">추천 학습 흐름</p>
                <ul className="mt-3 space-y-2">
                  {getUnitSteps(selectedUnit).map((s, idx) => (
                    <li key={`${selectedUnit.id}-${idx}`} className="flex gap-2">
                      <span className="text-[#58cc02] font-black">
                        {idx + 1}.
                      </span>
                      <span className="text-[#777] font-semibold">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl bg-[#fff7f0] p-4 border-2 border-[#ffe7d2]">
                <p className="font-bold text-[#3c3c3c]">막히면 이렇게 물어봐요</p>
                <p className="text-[#777] font-semibold mt-2">
                  “{selectedUnit.title}에서 개념을 쉽게 설명해주시고,
                  예제를 1개만 같이 풀어주세요.”
                </p>
                <div className="mt-4 flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => openChat(selectedUnit.title)}
                    className="px-4 py-3 rounded-2xl bg-[#1cb0f6] text-white font-bold border-b-4 border-[#1899d6] hover:bg-[#1cb0f6]/90 active:border-b-0 active:translate-y-1 transition-all text-center"
                  >
                    챗봇에게 질문하기
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      // TODO: 실제 학습 페이지(단원별 라우트)가 생기면 여기 연결
                    }}
                    className="px-4 py-3 rounded-2xl bg-white text-[#1cb0f6] font-bold border-2 border-[#cdeeff] hover:bg-[#eaf7ff] transition-all text-center"
                  >
                    학습 시작(예정)
                  </button>
                </div>
              </div>
            </div>
          </div>
          {/* 학생 입장에서 필요한 것 */}
          <div
            id="profile-section"
            className="mt-10 bg-white rounded-2xl border-2 border-[#e5e5e5] p-5"
          >
            <div className="flex items-center justify-between gap-3 mb-4">
              <h3 className="text-lg font-black text-[#3c3c3c]">
                {role === "student"
                  ? "학생 입장에서 필요한 것"
                  : "강사 입장에서 필요한 것"}
              </h3>
              <span className="text-[#777] text-sm font-semibold">
                {role === "student"
                  ? "로그인 없이 로컬 동작"
                  : "로그인 없이 로컬 UI + DB(자료) 연동"}
              </span>
            </div>

            <div className={role === "student" ? "space-y-4" : "hidden"}>
              {/* 1) 실시간 질문 보드 */}
              <div className="grid md:grid-cols-12 gap-4 bg-[#fafafa] border border-[#e5e5e5] rounded-2xl p-4">
                <div className="md:col-span-4 font-black text-[#3c3c3c] flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-[#1cb0f6]" />
                  실시간 질문 보드
                </div>
                <div className="md:col-span-8">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      submitQuestion()
                    }}
                    className="flex items-start gap-2"
                  >
                    <textarea
                      value={questionInput}
                      onChange={(e) => setQuestionInput(e.target.value)}
                      placeholder="수업 중 궁금한 점을 입력하세요."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-2xl text-[13px] resize-none outline-none bg-white text-gray-800 leading-relaxed max-h-[120px] focus:border-blue-400"
                      rows={2}
                    />
                    <button
                      type="submit"
                      className="mt-1 w-11 h-11 rounded-2xl bg-[#1cb0f6] text-white font-bold border-b-4 border-[#1899d6] hover:bg-[#1cb0f6]/90 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center"
                      aria-label="질문 올리기"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </form>

                  <div className="mt-3 text-sm font-bold text-[#3c3c3c]">
                    오늘 질문 ({questions.length})
                  </div>
                  <div className="mt-2 max-h-44 overflow-auto space-y-2 pr-1">
                    {questions.length === 0 ? (
                      <p className="text-[#777] font-semibold text-sm">
                        아직 질문이 없어요.
                      </p>
                    ) : (
                      questions.slice(0, 8).map((q) => (
                        <div
                          key={q.id}
                          className="bg-white rounded-2xl border border-[#e5e5e5] p-3"
                        >
                          <p className="text-[#3c3c3c] font-bold text-sm">
                            {q.text}
                          </p>
                          <p className="text-[#777] text-xs font-semibold mt-1">
                            {formatTime(q.createdAt)}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* 2) 수업 자료 열람 */}
              <div className="grid md:grid-cols-12 gap-4 bg-[#fafafa] border border-[#e5e5e5] rounded-2xl p-4">
                <div className="md:col-span-4 font-black text-[#3c3c3c] flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#58cc02]" />
                  수업 자료 열람
                </div>
                <div className="md:col-span-8 space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="text-sm font-bold text-[#3c3c3c]">
                      class_id
                    </label>
                    <input
                      inputMode="numeric"
                      value={materialsClassId}
                      onChange={(e) => setMaterialsClassId(e.target.value)}
                      className="w-28 px-3 py-2 border border-gray-300 rounded-2xl text-[13px] outline-none bg-white text-gray-800 focus:border-blue-400"
                    />
                    <div className="text-[#777] text-sm font-semibold">
                      업로드된 PDF 텍스트 기준
                    </div>
                  </div>

                  {materialsError ? (
                    <p className="text-red-600 text-sm font-bold">
                      {materialsError}
                    </p>
                  ) : materialsLoading ? (
                    <p className="text-[#777] font-semibold text-sm">
                      자료 불러오는 중...
                    </p>
                  ) : materials.length === 0 ? (
                    <p className="text-[#777] font-semibold text-sm">
                      아직 자료가 없어요. (강사 업로드 후 표시)
                    </p>
                  ) : (
                    <>
                      <select
                        value={selectedMaterialId ?? ""}
                        onChange={(e) => {
                          const v = e.target.value
                          setSelectedMaterialId(v ? Number(v) : null)
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-2xl text-[13px] outline-none bg-white text-gray-800 focus:border-blue-400"
                      >
                        {materials.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.filename}
                          </option>
                        ))}
                      </select>

                      <div className="bg-white rounded-2xl border border-[#e5e5e5] p-4">
                        <p className="font-bold text-[#3c3c3c] text-sm">
                          내용 미리보기
                        </p>
                        <pre className="mt-2 text-[12px] whitespace-pre-wrap max-h-44 overflow-auto text-[#777] font-semibold">
                          {selectedMaterial
                            ? truncate(selectedMaterial.content, 2000)
                            : "-"}
                        </pre>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* 3) 공지사항 */}
              <div className="grid md:grid-cols-12 gap-4 bg-[#fafafa] border border-[#e5e5e5] rounded-2xl p-4">
                <div className="md:col-span-4 font-black text-[#3c3c3c] flex items-center gap-2">
                  <Bell className="w-5 h-5 text-[#1cb0f6]" />
                  공지사항
                </div>
                <div className="md:col-span-8 space-y-2">
                  {[
                    {
                      title: "수업 자료 업로드 안내",
                      body: "강사가 PDF를 업로드하면 이 화면에서 바로 확인할 수 있어요.",
                    },
                    {
                      title: "출석 체크 방법",
                      body: "수업 시작 후 '출석 체크'에서 완료로 바꾸세요.",
                    },
                    {
                      title: "질문은 빠르게!",
                      body: "막히는 즉시 질문을 올리면 학습 흐름이 빨라져요.",
                    },
                  ].map((n, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-2xl border border-[#e5e5e5] p-3"
                    >
                      <p className="font-bold text-[#3c3c3c] text-sm">
                        {n.title}
                      </p>
                      <p className="text-[#777] font-semibold text-sm mt-1">
                        {n.body}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4) 출석 체크 */}
              <div className="grid md:grid-cols-12 gap-4 bg-[#fafafa] border border-[#e5e5e5] rounded-2xl p-4">
                <div className="md:col-span-4 font-black text-[#3c3c3c] flex items-center gap-2">
                  <CalendarCheck className="w-5 h-5 text-[#58cc02]" />
                  출석 체크
                </div>
                <div className="md:col-span-8">
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={attendancePresent}
                      onChange={handleToggleAttendance}
                      className="mt-1 w-5 h-5 accent-[#58cc02]"
                    />
                    <div>
                      <p className="font-bold text-[#3c3c3c]">
                        오늘 출석 했어요
                      </p>
                      <p className="text-[#777] font-semibold text-sm mt-1">
                        {attendancePresent && attendanceAt
                          ? `완료: ${formatTime(attendanceAt)}`
                          : "아직 미체크입니다."}
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* 5) 복습 노트 */}
              <div className="grid md:grid-cols-12 gap-4 bg-[#fafafa] border border-[#e5e5e5] rounded-2xl p-4">
                <div className="md:col-span-4 font-black text-[#3c3c3c] flex items-center gap-2">
                  <NotebookPen className="w-5 h-5 text-[#1cb0f6]" />
                  복습 노트
                </div>
                <div className="md:col-span-8">
                  <div className="grid grid-cols-1 gap-2">
                    <input
                      value={noteTitle}
                      onChange={(e) => setNoteTitle(e.target.value)}
                      placeholder="노트 제목 (예: 조건문 오답 정리)"
                      className="px-3 py-2 border border-gray-300 rounded-2xl text-[13px] outline-none bg-white text-gray-800 focus:border-blue-400"
                    />
                    <textarea
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      placeholder="오늘 학습을 복습하며 적은 내용을 남겨주세요."
                      className="px-3 py-2 border border-gray-300 rounded-2xl text-[13px] outline-none bg-white text-gray-800 leading-relaxed min-h-[84px] max-h-[180px] focus:border-blue-400 resize-none"
                      rows={3}
                    />
                  </div>

                  <div className="mt-3 flex gap-2 items-center">
                    <button
                      type="button"
                      onClick={saveReviewNote}
                      className="px-4 py-2 rounded-2xl bg-[#1cb0f6] text-white font-bold border-b-4 border-[#1899d6] hover:bg-[#1cb0f6]/90 active:border-b-0 active:translate-y-1 transition-all"
                    >
                      저장
                    </button>
                    <span className="text-[#777] font-semibold text-sm">
                      {reviewNotes.length}개 저장됨
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 max-h-52 overflow-auto pr-1">
                    {reviewNotes.length === 0 ? (
                      <p className="text-[#777] font-semibold text-sm">
                        아직 노트가 없어요. 위에 적고 저장해보세요.
                      </p>
                    ) : (
                      reviewNotes.slice(0, 8).map((n) => (
                        <div
                          key={n.id}
                          className="bg-white rounded-2xl border border-[#e5e5e5] p-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-bold text-[#3c3c3c] text-sm">
                                {n.title}
                              </p>
                              <p className="text-[#777] font-semibold text-xs mt-1">
                                {formatDate(n.createdAt)} {formatTime(n.createdAt)}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => deleteReviewNote(n.id)}
                              className="text-[#777] hover:text-red-600 font-bold text-sm px-2 py-1 rounded-2xl border border-[#e5e5e5] hover:bg-[#fff0f5]"
                              aria-label="노트 삭제"
                            >
                              삭제
                            </button>
                          </div>
                          <p className="text-[#777] font-semibold text-sm mt-2 whitespace-pre-wrap">
                            {truncate(n.content, 220)}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* 6) AI가 오늘 수업 내용 요약 */}
              <div className="grid md:grid-cols-12 gap-4 bg-[#fafafa] border border-[#e5e5e5] rounded-2xl p-4">
                <div className="md:col-span-4 font-black text-[#3c3c3c] flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#58cc02]" />
                  AI가 오늘 수업 요약
                </div>
                <div className="md:col-span-8">
                  <div className="flex flex-wrap gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => setAiSummaryMode("material")}
                      className={`px-3 py-1.5 rounded-2xl font-bold border-2 transition-all ${
                        aiSummaryMode === "material"
                          ? "border-[#1899d6] bg-[#eaf7ff] text-[#1899d6]"
                          : "border-[#e5e5e5] bg-white text-[#777] hover:border-[#1cb0f6]"
                      }`}
                    >
                      자료 기반
                    </button>
                    <button
                      type="button"
                      onClick={() => setAiSummaryMode("unit")}
                      className={`px-3 py-1.5 rounded-2xl font-bold border-2 transition-all ${
                        aiSummaryMode === "unit"
                          ? "border-[#46a302] bg-[#f0fff0] text-[#46a302]"
                          : "border-[#e5e5e5] bg-white text-[#777] hover:border-[#58cc02]"
                      }`}
                    >
                      단원 기반
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => void requestAiSummary()}
                    disabled={aiSummaryLoading}
                    className="w-full px-4 py-3 rounded-2xl bg-[#58cc02] text-white font-bold border-b-4 border-[#46a302] hover:bg-[#58cc02]/90 active:border-b-0 active:translate-y-1 transition-all disabled:opacity-50"
                  >
                    {aiSummaryLoading ? "요약 요청 중..." : "오늘 수업 내용 요약 받기"}
                  </button>

                  {aiSummaryError && (
                    <p className="mt-3 text-red-600 font-bold text-sm">
                      {aiSummaryError}
                    </p>
                  )}

                  {aiSummary && (
                    <div className="mt-3 bg-white rounded-2xl border border-[#e5e5e5] p-4">
                      <p className="font-bold text-[#3c3c3c] text-sm mb-2">
                        AI 요약 결과
                      </p>
                      <pre className="text-[#777] font-semibold text-sm whitespace-pre-wrap max-h-60 overflow-auto">
                        {aiSummary}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {role === "instructor" && (
              <div className="space-y-4">
                {/* 1) 실시간 질문 확인 */}
                <div className="grid md:grid-cols-12 gap-4 bg-[#fafafa] border border-[#e5e5e5] rounded-2xl p-4">
                  <div className="md:col-span-4 font-black text-[#3c3c3c] flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-[#1cb0f6]" />
                    실시간 질문 확인
                  </div>
                  <div className="md:col-span-8">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <p className="text-[#3c3c3c] font-bold">학생 질문 ({questions.length})</p>
                      <p className="text-[#777] text-sm font-semibold">
                        로컬에 저장된 질문 기준
                      </p>
                    </div>

                    {questions.length === 0 ? (
                      <p className="text-[#777] font-semibold text-sm">
                        아직 질문이 없어요.
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-56 overflow-auto pr-1">
                        {questions.slice(0, 10).map((q) => (
                          <div
                            key={q.id}
                            className="bg-white rounded-2xl border border-[#e5e5e5] p-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-[#3c3c3c] font-bold text-sm">
                                {q.text}
                              </p>
                              <p className="text-[#777] text-xs font-semibold">
                                {formatTime(q.createdAt)}
                              </p>
                            </div>

                            <div className="mt-2 flex gap-2 items-center">
                              <button
                                type="button"
                                disabled={instructorAnswerLoadingId === q.id}
                                onClick={() => void requestInstructorAnswer(q)}
                                className="px-4 py-2 rounded-2xl bg-[#1cb0f6] text-white font-bold border-b-4 border-[#1899d6] hover:bg-[#1cb0f6]/90 active:border-b-0 active:translate-y-1 transition-all disabled:opacity-50"
                              >
                                {instructorAnswerLoadingId === q.id
                                  ? "답변 생성 중..."
                                  : "AI 답변 생성"}
                              </button>
                            </div>

                            {instructorAnswerByQuestionId[q.id] && (
                              <pre className="mt-3 text-[#777] font-semibold text-sm whitespace-pre-wrap max-h-36 overflow-auto bg-[#fafafa] rounded-2xl p-3 border border-[#e5e5e5]">
                                {truncate(instructorAnswerByQuestionId[q.id], 1200)}
                              </pre>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {instructorAnswerError && (
                      <p className="mt-2 text-red-600 font-bold text-sm">
                        {instructorAnswerError}
                      </p>
                    )}
                  </div>
                </div>

                {/* 2) 수업자료 업로드/기간 설정 */}
                <div className="grid md:grid-cols-12 gap-4 bg-[#fafafa] border border-[#e5e5e5] rounded-2xl p-4">
                  <div className="md:col-span-4 font-black text-[#3c3c3c] flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#58cc02]" />
                    수업자료 업로드/기간 설정
                  </div>
                  <div className="md:col-span-8 space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="text-sm font-bold text-[#3c3c3c]">
                        class_id
                      </label>
                      <input
                        inputMode="numeric"
                        value={materialsClassId}
                        onChange={(e) => setMaterialsClassId(e.target.value)}
                        className="w-28 px-3 py-2 border border-gray-300 rounded-2xl text-[13px] outline-none bg-white text-gray-800 focus:border-blue-400"
                      />

                      <label className="text-sm font-bold text-[#3c3c3c]">
                        기간(일)
                      </label>
                      <input
                        inputMode="numeric"
                        value={uploadValidDays}
                        onChange={(e) => {
                          const v = Number(e.target.value)
                          setUploadValidDays(Number.isFinite(v) ? v : 30)
                        }}
                        className="w-28 px-3 py-2 border border-gray-300 rounded-2xl text-[13px] outline-none bg-white text-gray-800 focus:border-blue-400"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => {
                          setUploadFile(e.target.files?.[0] ?? null)
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-2xl text-[13px] outline-none bg-white text-gray-800"
                      />
                      <button
                        type="button"
                        disabled={uploading}
                        onClick={() => void handleInstructorUploadMaterial()}
                        className="px-4 py-2 rounded-2xl bg-[#58cc02] text-white font-bold border-b-4 border-[#46a302] hover:bg-[#58cc02]/90 active:border-b-0 active:translate-y-1 transition-all disabled:opacity-50"
                      >
                        {uploading ? "업로드 중..." : "PDF 업로드"}
                      </button>
                    </div>

                    {materialsError && (
                      <p className="text-red-600 font-bold text-sm">
                        {materialsError}
                      </p>
                    )}

                    <div className="bg-white rounded-2xl border border-[#e5e5e5] p-4">
                      <p className="font-bold text-[#3c3c3c] text-sm mb-2">
                        업로드/열람 가능한 자료
                      </p>
                      {materialsLoading ? (
                        <p className="text-[#777] font-semibold text-sm">
                          자료 불러오는 중...
                        </p>
                      ) : materials.length === 0 ? (
                        <p className="text-[#777] font-semibold text-sm">
                          아직 자료가 없어요.
                        </p>
                      ) : (
                        <select
                          value={selectedMaterialId ?? ""}
                          onChange={(e) => {
                            const v = e.target.value
                            setSelectedMaterialId(v ? Number(v) : null)
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-2xl text-[13px] outline-none bg-white text-gray-800 focus:border-blue-400"
                        >
                          {materials.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.filename}
                            </option>
                          ))}
                        </select>
                      )}

                      {selectedMaterial && (
                        <pre className="mt-3 text-[12px] whitespace-pre-wrap max-h-40 overflow-auto text-[#777] font-semibold bg-[#fafafa] rounded-2xl p-3 border border-[#e5e5e5]">
                          {truncate(selectedMaterial.content, 1200)}
                        </pre>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3) 질문 패턴 대시보드 */}
                <div className="grid md:grid-cols-12 gap-4 bg-[#fafafa] border border-[#e5e5e5] rounded-2xl p-4">
                  <div className="md:col-span-4 font-black text-[#3c3c3c] flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#46a302]" />
                    질문 패턴 대시보드
                  </div>
                  <div className="md:col-span-8 space-y-2">
                    {(() => {
                      const getTopic = (text: string) => {
                        const t = text.toLowerCase()
                        if (t.includes("if") || t.includes("else") || t.includes("조건"))
                          return "조건문"
                        if (
                          t.includes("for") ||
                          t.includes("while") ||
                          t.includes("반복")
                        )
                          return "반복문"
                        if (t.includes("배열") || t.includes("list") || t.includes("튜플"))
                          return "배열/리스트"
                        if (t.includes("함수") || t.includes("function"))
                          return "함수"
                        if (t.includes("변수") || t.includes("자료형") || t.includes("type"))
                          return "변수/자료형"
                        return "기타"
                      }

                      const topics = ["조건문", "반복문", "배열/리스트", "함수", "변수/자료형", "기타"]
                      const counts: Record<string, number> = {}
                      for (const tt of topics) counts[tt] = 0
                      for (const qq of questions) {
                        const topic = getTopic(qq.text)
                        counts[topic] = (counts[topic] ?? 0) + 1
                      }

                      const entries = topics.map((tt) => [tt, counts[tt]] as const)
                      const max = Math.max(1, ...entries.map(([, c]) => c))
                      return (
                        <div className="space-y-2">
                          {entries.map(([topic, c]) => (
                            <div key={topic} className="bg-white rounded-2xl border border-[#e5e5e5] p-3">
                              <div className="flex items-center justify-between gap-3 mb-2">
                                <p className="font-bold text-[#3c3c3c]">{topic}</p>
                                <p className="text-[#777] font-semibold text-sm">{c}개</p>
                              </div>
                              <div className="h-3 bg-[#e5e5e5] rounded-full overflow-hidden">
                                <div
                                  className="h-3 bg-[#1cb0f6] rounded-full"
                                  style={{ width: `${(c / max) * 100}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    })()}

                    <p className="text-[#777] font-semibold text-sm">
                      (로컬 질문 기준이라 실서버 데이터와 다를 수 있어요)
                    </p>
                  </div>
                </div>

                {/* 4) 보충자료 생성 + 발송 */}
                <div className="grid md:grid-cols-12 gap-4 bg-[#fafafa] border border-[#e5e5e5] rounded-2xl p-4">
                  <div className="md:col-span-4 font-black text-[#3c3c3c] flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#1cb0f6]" />
                    보충자료 생성 + 발송
                  </div>
                  <div className="md:col-span-8 space-y-3">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <select
                        value={supplementTopic}
                        onChange={(e) => setSupplementTopic(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-2xl text-[13px] outline-none bg-white text-gray-800 focus:border-blue-400"
                      >
                        {[
                          "조건문",
                          "반복문",
                          "배열/리스트",
                          "함수",
                          "변수/자료형",
                          "기타",
                        ].map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        disabled={supplementLoading}
                        onClick={() => void requestSupplement()}
                        className="px-4 py-2 rounded-2xl bg-[#58cc02] text-white font-bold border-b-4 border-[#46a302] hover:bg-[#58cc02]/90 active:border-b-0 active:translate-y-1 transition-all disabled:opacity-50"
                      >
                        {supplementLoading ? "생성 중..." : "AI 보충자료 생성"}
                      </button>
                    </div>

                    {supplementError && (
                      <p className="text-red-600 font-bold text-sm">
                        {supplementError}
                      </p>
                    )}

                    {supplementText && (
                      <pre className="bg-white rounded-2xl border border-[#e5e5e5] p-4 text-[#777] font-semibold text-sm whitespace-pre-wrap max-h-64 overflow-auto">
                        {truncate(supplementText, 6000)}
                      </pre>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        value={supplementEmail}
                        onChange={(e) => setSupplementEmail(e.target.value)}
                        placeholder="학생 이메일(예: name@example.com)"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-2xl text-[13px] outline-none bg-white text-gray-800 focus:border-blue-400"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!supplementEmail.trim()) {
                            showToast("이메일을 입력해주세요.")
                            return
                          }
                          showToast("이메일 발송 연동은 아직 준비 중이에요. (UI/생성만 지원)");
                        }}
                        className="px-4 py-2 rounded-2xl bg-white text-[#58cc02] font-bold border-2 border-[#d7f5b5] hover:bg-[#f0fff0] transition-all text-center"
                      >
                        AI 생성 → 이메일 발송
                      </button>
                    </div>
                  </div>
                </div>

                {/* 5) 출석 현황 */}
                <div className="grid md:grid-cols-12 gap-4 bg-[#fafafa] border border-[#e5e5e5] rounded-2xl p-4">
                  <div className="md:col-span-4 font-black text-[#3c3c3c] flex items-center gap-2">
                    <CalendarCheck className="w-5 h-5 text-[#58cc02]" />
                    출석 현황
                  </div>
                  <div className="md:col-span-8 space-y-2">
                    <p className="font-bold text-[#3c3c3c]">
                      오늘 접속/출석 기록
                    </p>
                    <div className="bg-white rounded-2xl border border-[#e5e5e5] p-3">
                      <p className="text-[#777] font-semibold text-sm">
                        로그인 없이 로컬에서 체크한 결과만 표시돼요.
                      </p>
                      <p className="mt-2 text-[#3c3c3c] font-bold">
                        {attendancePresent ? "출석 완료" : "미체크"}
                      </p>
                      <p className="text-[#777] font-semibold text-sm mt-1">
                        {attendancePresent && attendanceAt
                          ? `체크 시간: ${formatTime(attendanceAt)}`
                          : "아직 체크 기록이 없어요."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Right Sidebar (Desktop only) */}
      <aside className="hidden xl:block w-80 bg-white border-l-2 border-[#e5e5e5] p-6 space-y-6">
        {/* Streak */}
        <div className="bg-[#fff7e6] rounded-2xl p-4 border-2 border-[#ffc800]">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-[#ffc800] rounded-full flex items-center justify-center">
              <Flame className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-[#ff9600] font-bold text-sm">스트릭</p>
              <p className="text-2xl font-black text-[#ff9600]">
                {userData.streak}일
              </p>
            </div>
          </div>
          <p className="text-[#ff9600]/70 text-sm font-semibold">
            대단해요! 연속 학습을 유지하세요!
          </p>
        </div>

        {/* XP */}
        <div className="bg-[#fff0f5] rounded-2xl p-4 border-2 border-[#ff4b9e]">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-[#ff4b9e] rounded-full flex items-center justify-center">
              <Star className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-[#ff4b9e] font-bold text-sm">총 XP</p>
              <p className="text-2xl font-black text-[#ff4b9e]">
                {userData.xp.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Today's Goal */}
        <div className="bg-white rounded-2xl p-4 border-2 border-[#e5e5e5]">
          <p className="text-[#3c3c3c] font-bold mb-3">오늘의 목표</p>
          <div className="relative h-4 bg-[#e5e5e5] rounded-full overflow-hidden mb-2">
            <div
              className="absolute left-0 top-0 h-full bg-[#58cc02] rounded-full transition-all duration-500"
              style={{
                width: `${(userData.dailyProgress / userData.dailyGoal) * 100}%`,
              }}
            />
          </div>
          <p className="text-[#777] font-semibold text-sm">
            {userData.dailyProgress} / {userData.dailyGoal} XP
          </p>
          <p className="text-[#777] font-semibold text-sm mt-2">
            미션 완료: {missionsDoneCount} / {dailyMissions.length}
          </p>
        </div>
      </aside>

      <ChatbotWidget
        isOpen={chatOpen}
        onRequestOpen={() => {
          setChatUnitContext(selectedUnit.title)
          setChatOpen(true)
        }}
        onRequestClose={() => setChatOpen(false)}
        unitContext={chatUnitContext || selectedUnit.title}
      />
    </div>
  )
}

// Navigation Item Component
function NavItem({
  icon: Icon,
  label,
  active = false,
  onClick,
}: {
  icon: React.ElementType
  label: string
  active?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-4 px-4 py-3 rounded-2xl font-bold transition-all ${
        active
          ? "bg-[#ddf4ff] text-[#1cb0f6] border-2 border-[#1cb0f6]"
          : "text-[#777] hover:bg-[#f7f7f7]"
      }`}
    >
      <Icon className="w-7 h-7" />
      <span className="text-lg">{label}</span>
    </button>
  )
}

// Unit Node Component
function UnitNode({
  unit,
  isLeft,
  selected,
  onSelect,
}: {
  unit: Unit
  isLeft: boolean
  selected: boolean
  onSelect: (unit: Unit) => void
}) {
  const statusConfig = {
    completed: {
      bgColor: "bg-[#58cc02]",
      borderColor: "border-[#46a302]",
      textColor: "text-white",
      icon: (
        <svg
          className="w-8 h-8 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={3}
            d="M5 13l4 4L19 7"
          />
        </svg>
      ),
    },
    current: {
      bgColor: "bg-[#1cb0f6]",
      borderColor: "border-[#1899d6]",
      textColor: "text-white",
      icon: <ChevronRight className="w-8 h-8 text-white" />,
    },
    locked: {
      bgColor: "bg-[#e5e5e5]",
      borderColor: "border-[#d0d0d0]",
      textColor: "text-[#afafaf]",
      icon: <Lock className="w-6 h-6 text-[#afafaf]" />,
    },
  }

  const config = statusConfig[unit.status as keyof typeof statusConfig]
  const isLocked = unit.status === "locked"

  return (
    <div
      className={`flex items-center gap-4 ${isLeft ? "flex-row" : "flex-row-reverse"}`}
    >
      {/* Content */}
      <div
        className={`flex-1 ${isLeft ? "text-right pr-4" : "text-left pl-4"}`}
      >
        <div
          className={`inline-block bg-white rounded-2xl p-4 border-2 ${
            isLocked ? "border-[#e5e5e5] opacity-60" : "border-[#e5e5e5]"
          } ${
            selected
              ? "border-[#1cb0f6] ring-2 ring-[#1cb0f6]/20"
              : !isLocked
                ? "hover:border-[#1cb0f6] cursor-pointer transition-all hover:shadow-lg"
                : "cursor-pointer transition-all"
          }`}
          role="button"
          tabIndex={0}
          onClick={() => onSelect(unit)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onSelect(unit)
          }}
        >
          <p
            className={`font-bold ${isLocked ? "text-[#afafaf]" : "text-[#3c3c3c]"}`}
          >
            {unit.title}
          </p>
          <p
            className={`text-sm font-semibold ${isLocked ? "text-[#d0d0d0]" : "text-[#777]"}`}
          >
            +{unit.xp} XP
          </p>
        </div>
      </div>

      {/* Node Circle */}
      <button
        type="button"
        onClick={() => onSelect(unit)}
        className={`w-16 h-16 rounded-full ${config.bgColor} border-b-4 ${config.borderColor} flex items-center justify-center flex-shrink-0 ${
          isLocked
            ? "opacity-60 cursor-default"
            : "hover:scale-110 active:border-b-0 active:translate-y-1 cursor-pointer"
        } transition-all shadow-lg`}
      >
        {config.icon}
      </button>

      {/* Spacer for alignment */}
      <div className="flex-1" />
    </div>
  )
}

