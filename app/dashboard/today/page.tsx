"use client"

import { useEffect, useRef, useState } from "react"
import {
  MessageSquare, FileText, CheckCircle2, BookMarked,
  Sparkles, Loader2, Send, AlertCircle, BookOpen,
  ToggleLeft, ToggleRight,
} from "lucide-react"
import { getSupabaseBrowser } from "@/lib/supabase-browser"
import { learningPath } from "@/lib/dashboard/data"

// ── 타입 ────────────────────────────────────────────
interface Question {
  id: string
  text: string
  time: string
  answered: boolean
}

interface Material {
  id: string
  name: string
  type: "pdf" | "ppt" | "doc" | "link"
  url: string
}

interface ReviewNote {
  id: string
  content: string
  createdAt: string
}

// ── 샘플 데이터 ──────────────────────────────────────
const SAMPLE_QUESTIONS: Question[] = [
  { id: "q1", text: "반복문에서 break와 continue의 차이가 뭔가요?", time: "10:12", answered: true },
  { id: "q2", text: "리스트와 튜플은 언제 각각 써야 하나요?",       time: "10:25", answered: false },
  { id: "q3", text: "재귀함수가 일반 반복문보다 느린 이유가 있나요?", time: "10:41", answered: false },
]

const SAMPLE_MATERIALS: Material[] = [
  { id: "m1", name: "Python 기초 문법 정리.pdf", type: "pdf", url: "#" },
  { id: "m2", name: "자료구조 개요.pptx",        type: "ppt", url: "#" },
  { id: "m3", name: "이번 주 실습 문제.docx",     type: "doc", url: "#" },
]

const TYPE_BADGE: Record<string, string> = {
  pdf:  "bg-[#ff4b4b]/10 text-[#ff4b4b]",
  ppt:  "bg-[#ff9600]/10 text-[#ff9600]",
  doc:  "bg-[#1cb0f6]/10 text-[#1cb0f6]",
  link: "bg-[#58cc02]/10 text-[#58cc02]",
}

type SummaryMode = "material" | "unit"

// ────────────────────────────────────────────────────
export default function TodayPage() {
  // 출석체크
  const [attended, setAttended]     = useState(false)
  const [attendTime, setAttendTime] = useState<string | null>(null)

  // 실시간 질문 게시판
  const [questions, setQuestions]   = useState<Question[]>(SAMPLE_QUESTIONS)
  const [questionInput, setQInput]  = useState("")
  const [showAnswered, setShowAnsw] = useState(false)

  // 복습노트
  const [notes, setNotes]           = useState<ReviewNote[]>([])
  const [noteInput, setNoteInput]   = useState("")
  const notesKey = "eduvibe_review_notes_v1"

  // AI 요약
  const [summaryMode, setSummaryMode] = useState<SummaryMode>("unit")
  const [summaryText, setSummaryText] = useState<string | null>(null)
  const [summaryLoading, setSLoading] = useState(false)
  const [summaryError, setSError]     = useState<string | null>(null)
  const materialFileRef               = useRef<HTMLInputElement>(null)

  const currentUnit = learningPath.find((u) => u.status === "current") ?? learningPath[0]

  useEffect(() => {
    // 출석 복원
    const todayKey = `eduvibe_attend_${new Date().toDateString()}`
    const saved = localStorage.getItem(todayKey)
    if (saved) { setAttended(true); setAttendTime(saved) }

    // 복습노트 복원
    const savedNotes: ReviewNote[] = JSON.parse(localStorage.getItem(notesKey) ?? "[]")
    setNotes(savedNotes)
  }, [])

  // ── 출석체크 ──
  const checkAttendance = () => {
    const now = new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
    setAttended(true)
    setAttendTime(now)
    const todayKey = `eduvibe_attend_${new Date().toDateString()}`
    localStorage.setItem(todayKey, now)
  }

  // ── 질문 제출 (익명 처리) ──
  const submitQuestion = () => {
    if (!questionInput.trim()) return
    const q: Question = {
      id:       crypto.randomUUID(),
      text:     questionInput.trim(),
      time:     new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
      answered: false,
    }
    setQuestions((prev) => [...prev, q])
    setQInput("")
  }

  // ── 복습노트 저장 ──
  const saveNote = () => {
    if (!noteInput.trim()) return
    const note: ReviewNote = {
      id:        crypto.randomUUID(),
      content:   noteInput.trim(),
      createdAt: new Date().toLocaleString("ko-KR"),
    }
    const updated = [note, ...notes]
    setNotes(updated)
    localStorage.setItem(notesKey, JSON.stringify(updated))
    setNoteInput("")
  }

  const deleteNote = (id: string) => {
    const updated = notes.filter((n) => n.id !== id)
    setNotes(updated)
    localStorage.setItem(notesKey, JSON.stringify(updated))
  }

  // ── AI 요약 ──
  const getSummary = async (file?: File) => {
    setSLoading(true)
    setSError(null)
    setSummaryText(null)

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
    if (!apiKey) {
      setSError("GEMINI_API_KEY가 설정되지 않았습니다.")
      setSLoading(false)
      return
    }

    let prompt = ""
    if (summaryMode === "unit") {
      prompt = `아래 학습 단원을 학생이 이해하기 쉽게 3~5문장으로 요약해주세요. 핵심 개념과 학습 목표를 포함해 주세요.\n\n단원명: ${currentUnit.title}\n예상 XP: ${currentUnit.xp}`
    } else {
      if (!file) { setSError("자료 파일을 선택해주세요."); setSLoading(false); return }
      const text = await file.text()
      prompt = `아래 학습 자료를 학생이 이해하기 쉽게 핵심만 3~5문장으로 요약해주세요:\n\n${text.slice(0, 3000)}`
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      })
      const json = await res.json()
      const result: string = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "요약을 생성하지 못했습니다."
      setSummaryText(result)
    } catch {
      setSError("AI 요약 중 오류가 발생했습니다. 다시 시도해주세요.")
    } finally {
      setSLoading(false)
    }
  }

  const filteredQuestions = showAnswered ? questions : questions.filter((q) => !q.answered)

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-[#3c3c3c] mb-1">오늘의 수업</h1>
        <p className="text-[#777] font-semibold">실시간으로 수업에 참여하고 학습을 기록해요.</p>
      </div>

      {/* ① 출석체크 — 맨 위 */}
      <section className={`rounded-3xl border-2 p-5 transition-all ${
        attended
          ? "bg-[#f0fff0] border-[#58cc02]/40"
          : "bg-white border-[#e5e5e5]"
      }`}>
        <div className="flex items-center gap-2 mb-4">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${attended ? "bg-[#58cc02]/15" : "bg-[#f7f7f7]"}`}>
            <CheckCircle2 className={`w-5 h-5 ${attended ? "text-[#58cc02]" : "text-[#afafaf]"}`} />
          </div>
          <h2 className="font-black text-[#3c3c3c]">출석체크</h2>
          {attended && (
            <span className="ml-auto text-xs font-bold px-2.5 py-1 bg-[#58cc02]/15 text-[#58cc02] rounded-full">
              ✓ 출석 완료
            </span>
          )}
        </div>

        {attended ? (
          <div className="flex items-center gap-3 p-4 bg-white/70 rounded-2xl border border-[#58cc02]/20">
            <div className="w-12 h-12 bg-[#58cc02] rounded-2xl flex items-center justify-center text-2xl shrink-0">
              ✋
            </div>
            <div>
              <p className="font-black text-[#3c3c3c]">출석했어요!</p>
              <p className="text-sm text-[#777] font-semibold">{attendTime}에 출석 완료됐습니다.</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#777]">아직 오늘 출석을 하지 않았어요.</p>
              <p className="text-xs text-[#afafaf] font-semibold mt-0.5">버튼을 눌러 출석을 기록하세요.</p>
            </div>
            <button
              type="button"
              onClick={checkAttendance}
              className="shrink-0 px-8 py-3 bg-[#58cc02] text-white font-bold rounded-2xl border-b-4 border-[#46a302] hover:bg-[#58cc02]/90 active:border-b-0 transition-all text-base"
            >
              출석하기 ✋
            </button>
          </div>
        )}
      </section>

      {/* ② 실시간 질문 게시판 */}
      <section className="bg-white rounded-3xl border-2 border-[#e5e5e5] p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-[#1cb0f6]/10 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-[#1cb0f6]" />
            </div>
            <h2 className="font-black text-[#3c3c3c]">실시간 질문 게시판</h2>
          </div>
          <button
            type="button"
            onClick={() => setShowAnsw(!showAnswered)}
            className="text-xs font-bold text-[#afafaf] hover:text-[#3c3c3c] flex items-center gap-1"
          >
            {showAnswered
              ? <ToggleRight className="w-4 h-4 text-[#58cc02]" />
              : <ToggleLeft  className="w-4 h-4" />
            }
            답변 완료 {showAnswered ? "숨기기" : "보기"}
          </button>
        </div>

        {/* 익명 안내 */}
        <div className="flex items-center gap-1.5 text-xs text-[#afafaf] font-semibold mb-3">
          <span className="w-4 h-4 bg-[#f7f7f7] rounded-full flex items-center justify-center text-[10px]">🔒</span>
          모든 질문은 익명으로 게시됩니다.
        </div>

        {/* 질문 목록 */}
        <div className="space-y-2 mb-4 max-h-52 overflow-y-auto">
          {filteredQuestions.length === 0 ? (
            <p className="text-center text-[#afafaf] text-sm font-semibold py-4">아직 질문이 없어요.</p>
          ) : filteredQuestions.map((q) => (
            <div
              key={q.id}
              className={`flex items-start gap-2.5 p-3 rounded-xl ${q.answered ? "bg-[#f0fff0]" : "bg-[#f7f7f7]"}`}
            >
              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${q.answered ? "bg-[#58cc02]" : "bg-[#1cb0f6]"}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#3c3c3c]">{q.text}</p>
                <p className="text-xs text-[#afafaf] font-semibold mt-0.5">
                  {/* 작성자 항상 익명 표시 */}
                  익명 · {q.time}
                  {q.answered && <span className="ml-2 text-[#58cc02]">✓ 답변 완료</span>}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* 질문 입력 */}
        <div className="flex gap-2">
          <input
            value={questionInput}
            onChange={(e) => setQInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitQuestion()}
            placeholder="궁금한 점을 익명으로 질문하세요 (Enter)"
            className="flex-1 px-4 py-2.5 rounded-2xl border-2 border-transparent bg-[#f7f7f7] text-sm font-semibold text-[#3c3c3c] placeholder:text-[#afafaf] placeholder:font-normal focus:outline-none focus:bg-white focus:border-[#1cb0f6] transition-all"
          />
          <button
            type="button"
            onClick={submitQuestion}
            disabled={!questionInput.trim()}
            className="w-10 h-10 flex items-center justify-center bg-[#1cb0f6] text-white rounded-xl border-b-4 border-[#1899d6] hover:bg-[#1cb0f6]/90 active:border-b-0 transition-all disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* ③ 수업 자료 열람 */}
      <section className="bg-white rounded-3xl border-2 border-[#e5e5e5] p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 bg-[#ff9600]/10 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-[#ff9600]" />
          </div>
          <h2 className="font-black text-[#3c3c3c]">수업 자료 열람</h2>
        </div>

        <div className="space-y-2">
          {SAMPLE_MATERIALS.map((mat) => (
            <a
              key={mat.id}
              href={mat.url}
              onClick={(e) => e.preventDefault()}
              className="flex items-center gap-3 p-3 bg-[#f7f7f7] rounded-xl hover:bg-[#f0f0f0] transition-all group"
            >
              <div className={`text-xs font-bold px-2.5 py-1 rounded-lg uppercase ${TYPE_BADGE[mat.type]}`}>
                {mat.type}
              </div>
              <span className="flex-1 text-sm font-semibold text-[#3c3c3c] group-hover:text-[#1cb0f6] transition-colors truncate">
                {mat.name}
              </span>
              <span className="text-xs text-[#afafaf] font-semibold shrink-0">열람</span>
            </a>
          ))}
        </div>
        <p className="text-xs text-[#afafaf] font-semibold mt-3">* 자료는 강사가 업로드한 파일이에요.</p>
      </section>

      {/* ④ 복습노트 */}
      <section className="bg-white rounded-3xl border-2 border-[#e5e5e5] p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 bg-[#9b59b6]/10 rounded-xl flex items-center justify-center">
            <BookMarked className="w-5 h-5 text-[#9b59b6]" />
          </div>
          <h2 className="font-black text-[#3c3c3c]">복습노트</h2>
        </div>

        <div className="flex gap-2 mb-4">
          <textarea
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            placeholder="오늘 배운 내용을 메모해두세요..."
            rows={2}
            className="flex-1 px-4 py-2.5 rounded-2xl border-2 border-transparent bg-[#f7f7f7] text-sm font-semibold text-[#3c3c3c] placeholder:text-[#afafaf] placeholder:font-normal focus:outline-none focus:bg-white focus:border-[#9b59b6] transition-all resize-none"
          />
          <button
            type="button"
            onClick={saveNote}
            disabled={!noteInput.trim()}
            className="px-4 py-2 bg-[#9b59b6] text-white font-bold rounded-xl border-b-4 border-[#7d3c98] hover:bg-[#9b59b6]/90 active:border-b-0 transition-all disabled:opacity-50 self-end text-sm"
          >
            저장
          </button>
        </div>

        {notes.length === 0 ? (
          <p className="text-center text-[#afafaf] text-sm font-semibold py-3">아직 복습노트가 없어요.</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {notes.map((note) => (
              <div key={note.id} className="flex items-start gap-2 p-3 bg-[#f7f7f7] rounded-xl group">
                <div className="w-1.5 h-1.5 rounded-full bg-[#9b59b6] mt-2 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#3c3c3c] whitespace-pre-wrap">{note.content}</p>
                  <p className="text-xs text-[#afafaf] font-semibold mt-0.5">{note.createdAt}</p>
                </div>
                <button
                  type="button"
                  onClick={() => deleteNote(note.id)}
                  className="text-[#afafaf] hover:text-[#ff4b4b] opacity-0 group-hover:opacity-100 transition-all text-xs font-bold shrink-0"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ⑤ AI 학습 요약 */}
      <section className="bg-white rounded-3xl border-2 border-[#e5e5e5] p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 bg-[#58cc02]/10 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-[#58cc02]" />
          </div>
          <h2 className="font-black text-[#3c3c3c]">AI 학습 요약</h2>
        </div>

        {/* 모드 토글 */}
        <div className="flex gap-2 mb-4">
          {(["unit", "material"] as SummaryMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => { setSummaryMode(mode); setSummaryText(null); setSError(null) }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                summaryMode === mode
                  ? "bg-[#1cb0f6] text-white border-b-4 border-[#1899d6]"
                  : "bg-[#f7f7f7] text-[#777] hover:bg-[#e5e5e5]"
              }`}
            >
              {mode === "unit" ? <><BookOpen className="w-4 h-4" /> 단원 기반</> : <><FileText className="w-4 h-4" /> 자료 기반</>}
            </button>
          ))}
        </div>

        {summaryMode === "unit" ? (
          <div className="p-3 bg-[#eaf7ff] rounded-xl mb-4">
            <p className="text-sm font-semibold text-[#1cb0f6]">
              현재 학습 중인 <strong>{currentUnit.title}</strong> 단원을 AI가 요약해드려요.
            </p>
          </div>
        ) : (
          <div className="mb-4">
            <input
              ref={materialFileRef}
              type="file"
              accept=".txt,.pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) getSummary(f)
                if (materialFileRef.current) materialFileRef.current.value = ""
              }}
            />
            <div className="p-3 bg-[#f0fff0] rounded-xl">
              <p className="text-sm font-semibold text-[#58cc02]">
                PDF 또는 TXT 파일을 업로드하면 AI가 핵심 내용을 요약해드려요.
              </p>
            </div>
          </div>
        )}

        {summaryMode === "unit" ? (
          <button
            type="button"
            onClick={() => getSummary()}
            disabled={summaryLoading}
            className="w-full py-3 bg-[#58cc02] text-white font-bold rounded-2xl border-b-4 border-[#46a302] hover:bg-[#58cc02]/90 active:border-b-0 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {summaryLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            {summaryLoading ? "요약 중..." : "AI 요약받기"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => materialFileRef.current?.click()}
            disabled={summaryLoading}
            className="w-full py-3 bg-[#58cc02] text-white font-bold rounded-2xl border-b-4 border-[#46a302] hover:bg-[#58cc02]/90 active:border-b-0 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {summaryLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
            {summaryLoading ? "요약 중..." : "파일 업로드 후 요약받기"}
          </button>
        )}

        {summaryError && (
          <div className="flex items-center gap-2 mt-3 p-3 bg-[#fff0f0] border border-[#ff4b4b]/20 rounded-xl">
            <AlertCircle className="w-4 h-4 text-[#ff4b4b] shrink-0" />
            <p className="text-sm text-[#ff4b4b] font-semibold">{summaryError}</p>
          </div>
        )}

        {summaryText && (
          <div className="mt-4 p-4 bg-[#f0fff0] border-2 border-[#58cc02]/30 rounded-2xl">
            <p className="text-xs font-bold text-[#58cc02] mb-2 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> AI 요약 결과
            </p>
            <p className="text-sm font-semibold text-[#3c3c3c] leading-relaxed whitespace-pre-wrap">
              {summaryText}
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
