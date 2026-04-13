"use client"


import { useEffect, useState, useCallback } from "react"
import {
  Bell, CheckCircle2, ChevronDown, ChevronUp, Pin, Plus, X,
  Loader2, Users, MessageSquarePlus, HelpCircle, Send,
  MessageCircle, Clock, CheckCheck,
} from "lucide-react"
import { getSupabaseBrowser } from "@/lib/supabase-browser"
import { getRoleFromUser, type UserRole } from "@/lib/auth"

// ── 타입 ──────────────────────────────────────────
interface Notice {
  id: string
  title: string
  content: string
  pinned: boolean
  author: string
  createdAt: string
  readBy: string[]
}

interface StudentQA {
  id: string
  title: string
  content: string
  author: string
  authorId: string
  authorRole: string
  courseCode?: string
  courseName?: string
  createdAt: string
  answered: boolean
  answer?: string
  answeredAt?: string
}

// ── 기본 공지사항 ──
const SAMPLE_NOTICES: Notice[] = [
  {
    id: "n1",
    title: "📌 수강 시작 전 필수 사항 안내",
    content:
      "안녕하세요! EduVibe-AI에 오신 것을 환영합니다.\n\n수강 시작 전 반드시 프로필 페이지에서 인증키를 확인해주세요. 인증키는 수업 입장 시 사용됩니다.\n\n학습 관련 문의는 강사에게 직접 채팅으로 남겨주세요.",
    pinned: true,
    author: "관리자",
    createdAt: "2026-04-10T09:00:00",
    readBy: [],
  },
  {
    id: "n2",
    title: "4월 2주차 학습 일정 공지",
    content:
      "이번 주 학습 일정을 안내드립니다.\n\n• 월·화: Python 기초 문법\n• 수·목: 자료구조 개요\n• 금: 미니 프로젝트 발표\n\n퀘스트 완료 후 AI 튜터를 활용해 복습하시면 더욱 효과적입니다.",
    pinned: false,
    author: "관리자",
    createdAt: "2026-04-11T08:30:00",
    readBy: [],
  },
]

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`
}

// ── 공지 항목 ──
function NoticeItem({
  notice, userId, isInstructor, onRead, onDelete,
}: {
  notice: Notice; userId: string; isInstructor: boolean
  onRead: (id: string) => void; onDelete: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const isRead = notice.readBy.includes(userId)

  const handleOpen = () => {
    setOpen((v) => !v)
    if (!isRead && !open) onRead(notice.id)
  }

  return (
    <div className={`rounded-2xl border-2 transition-all ${
      notice.pinned ? "border-[#ffc800]/50 bg-[#fff9e6]"
      : isRead ? "border-[#e5e5e5] bg-white opacity-80"
      : "border-[#1cb0f6]/30 bg-white"
    }`}>
      <button type="button" onClick={handleOpen} className="w-full flex items-center gap-3 p-4 text-left">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
          notice.pinned ? "bg-[#ffc800]/20" : isRead ? "bg-[#f7f7f7]" : "bg-[#1cb0f6]/10"
        }`}>
          {notice.pinned ? <Pin className="w-5 h-5 text-[#ffc800]" />
           : isRead ? <CheckCircle2 className="w-5 h-5 text-[#58cc02]" />
           : <Bell className="w-5 h-5 text-[#1cb0f6]" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {notice.pinned && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#ffc800]/20 text-[#ff9600]">필독</span>}
            {!isRead && !notice.pinned && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#1cb0f6]/10 text-[#1cb0f6]">NEW</span>}
            <p className={`font-bold text-sm truncate ${isRead ? "text-[#777]" : "text-[#3c3c3c]"}`}>{notice.title}</p>
          </div>
          <p className="text-xs text-[#afafaf] font-semibold mt-0.5">{notice.author} · {formatDate(notice.createdAt)}</p>
        </div>
        <div className="shrink-0 text-[#afafaf]">{open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</div>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-0">
          <div className="border-t border-[#f7f7f7] pt-4">
            <p className="text-sm text-[#3c3c3c] font-semibold whitespace-pre-wrap leading-relaxed">{notice.content}</p>
            {isInstructor && (
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#f7f7f7]">
                <div className="flex items-center gap-1.5 text-[#777] text-xs font-semibold">
                  <Users className="w-3.5 h-3.5" /><span>읽음 {notice.readBy.length}명</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onDelete(notice.id) }}
                  className="flex items-center gap-1 text-xs font-bold text-[#ff4b4b] hover:bg-[#fff0f0] px-2 py-1 rounded-lg transition-all"
                >
                  <X className="w-3.5 h-3.5" />삭제
                </button>
              </div>
            )}
            {!isInstructor && isRead && (
              <div className="flex items-center gap-1.5 mt-3 text-[#58cc02] text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />읽음 확인 완료
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── 공지 작성 모달 ──
function NoticeForm({ onClose, onSubmit }: { onClose: () => void; onSubmit: (title: string, content: string, pinned: boolean) => void }) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [pinned, setPinned] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return
    onSubmit(title, content, pinned)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-3xl border-2 border-[#e5e5e5] p-6 w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-black text-[#3c3c3c]">공지사항 작성</h3>
          <button type="button" onClick={onClose} className="text-[#afafaf] hover:text-[#3c3c3c]"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-bold text-[#3c3c3c] block mb-1.5">제목</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="공지 제목을 입력하세요"
              className="w-full px-4 py-3 rounded-2xl border-2 border-transparent bg-[#f7f7f7] text-[#3c3c3c] font-semibold placeholder:text-[#afafaf] focus:outline-none focus:bg-white focus:border-[#1cb0f6] transition-all text-sm" />
          </div>
          <div>
            <label className="text-sm font-bold text-[#3c3c3c] block mb-1.5">내용</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="공지 내용을 입력하세요..." rows={5}
              className="w-full px-4 py-3 rounded-2xl border-2 border-transparent bg-[#f7f7f7] text-[#3c3c3c] font-semibold placeholder:text-[#afafaf] focus:outline-none focus:bg-white focus:border-[#1cb0f6] transition-all text-sm resize-none" />
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <div onClick={() => setPinned(!pinned)} className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${pinned ? "bg-[#ffc800] border-[#ffc800]" : "border-[#e5e5e5]"}`}>
              {pinned && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
            </div>
            <span className="text-sm font-bold text-[#3c3c3c]">필독 공지로 설정</span>
            <Pin className="w-4 h-4 text-[#ffc800]" />
          </label>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-2xl font-bold text-[#777] bg-[#f7f7f7] hover:bg-[#e5e5e5] transition-all">취소</button>
            <button type="submit" disabled={!title.trim() || !content.trim()}
              className="flex-1 py-3 rounded-2xl font-bold text-white bg-[#58cc02] border-b-4 border-[#46a302] hover:bg-[#58cc02]/90 active:border-b-0 transition-all disabled:opacity-60">
              등록하기
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── 질문 작성 모달 (학생·강사) ──
function QuestionForm({ onClose, onSubmit, submitting }: {
  onClose: () => void; submitting: boolean
  onSubmit: (title: string, content: string) => void
}) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-3xl border-2 border-[#e5e5e5] p-6 w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#eaf7ff] rounded-xl flex items-center justify-center">
              <HelpCircle className="w-4 h-4 text-[#1cb0f6]" />
            </div>
            <h3 className="text-lg font-black text-[#3c3c3c]">관리자에게 질문하기</h3>
          </div>
          <button type="button" onClick={onClose} className="text-[#afafaf] hover:text-[#3c3c3c]"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-xs text-[#afafaf] font-semibold mb-4 bg-[#f7f7f7] rounded-xl px-3 py-2">
          💬 질문은 관리자에게 전달되며, 답변을 받을 수 있어요.
        </p>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-bold text-[#3c3c3c] block mb-1.5">질문 제목</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="무엇이 궁금하신가요?"
              className="w-full px-4 py-3 rounded-2xl border-2 border-transparent bg-[#f7f7f7] text-[#3c3c3c] font-semibold placeholder:text-[#afafaf] focus:outline-none focus:bg-white focus:border-[#1cb0f6] transition-all text-sm" />
          </div>
          <div>
            <label className="text-sm font-bold text-[#3c3c3c] block mb-1.5">질문 내용</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="자세히 설명해주실수록 더 정확한 답변을 받을 수 있어요..." rows={5}
              className="w-full px-4 py-3 rounded-2xl border-2 border-transparent bg-[#f7f7f7] text-[#3c3c3c] font-semibold placeholder:text-[#afafaf] focus:outline-none focus:bg-white focus:border-[#1cb0f6] transition-all text-sm resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-2xl font-bold text-[#777] bg-[#f7f7f7] hover:bg-[#e5e5e5] transition-all">취소</button>
            <button
              type="button"
              onClick={() => { if (title.trim() && content.trim()) onSubmit(title, content) }}
              disabled={!title.trim() || !content.trim() || submitting}
              className="flex-1 py-3 rounded-2xl font-bold text-white bg-[#1cb0f6] border-b-4 border-[#1499d6] hover:bg-[#1cb0f6]/90 active:border-b-0 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {submitting ? "전송 중..." : "질문 전송"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── 관리자 답변 모달 ──
function AnswerModal({ qa, onClose, onSubmit, submitting }: {
  qa: StudentQA; onClose: () => void; submitting: boolean
  onSubmit: (authorId: string, questionId: string, answer: string) => void
}) {
  const [answer, setAnswer] = useState(qa.answer ?? "")

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-3xl border-2 border-[#e5e5e5] p-6 w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-[#3c3c3c]">질문 답변</h3>
          <button type="button" onClick={onClose} className="text-[#afafaf] hover:text-[#3c3c3c]"><X className="w-5 h-5" /></button>
        </div>
        <div className="bg-[#f7f7f7] rounded-2xl p-4 mb-4">
          <p className="text-xs text-[#afafaf] font-bold mb-1">{qa.author} ({qa.authorRole === "teacher" ? "강사" : "수강생"}) · {formatDate(qa.createdAt)}</p>
          <p className="font-bold text-sm text-[#3c3c3c]">{qa.title}</p>
          <p className="text-sm text-[#777] mt-1">{qa.content}</p>
        </div>
        <div className="space-y-3">
          <label className="text-sm font-bold text-[#3c3c3c] block">답변 내용</label>
          <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="답변을 입력하세요..." rows={5}
            className="w-full px-4 py-3 rounded-2xl border-2 border-transparent bg-[#f7f7f7] text-[#3c3c3c] font-semibold placeholder:text-[#afafaf] focus:outline-none focus:bg-white focus:border-[#ff9600] transition-all text-sm resize-none" />
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-2xl font-bold text-[#777] bg-[#f7f7f7]">취소</button>
            <button
              type="button"
              onClick={() => { if (answer.trim()) onSubmit(qa.authorId, qa.id, answer) }}
              disabled={!answer.trim() || submitting}
              className="flex-1 py-3 rounded-2xl font-bold text-white bg-[#ff9600] border-b-4 border-[#cc7000] disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              답변 등록
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── 메인 ──────────────────────────────────────────────────────
export default function NoticesPage() {
  const [role,         setRole]         = useState<UserRole>("student")
  const [userId,       setUserId]       = useState("")
  const [token,        setToken]        = useState("")
  const [userName,     setUserName]     = useState("학습자")
  const [notices,      setNotices]      = useState<Notice[]>([])
  const [loading,      setLoading]      = useState(true)
  const [showForm,     setShowForm]     = useState(false)
  const [showQForm,    setShowQForm]    = useState(false)
  const [qaSubmitting, setQASubmitting] = useState(false)
  const [questions,    setQuestions]    = useState<StudentQA[]>([])
  const [qLoading,     setQLoading]     = useState(false)
  const [qSubmitted,   setQSubmitted]   = useState(false)
  const [answerTarget, setAnswerTarget] = useState<StudentQA | null>(null)
  const [ansSubmitting,setAnsSubmitting]= useState(false)

  // ── 데이터 로드 ──
  useEffect(() => {
    const supabase = getSupabaseBrowser()
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: import('@supabase/supabase-js').Session | null } }) => {
      if (!session) return
      const user = session.user
      setToken(session.access_token)
      setRole(getRoleFromUser(user))
      setUserId(user.id)
      const name = (user.user_metadata?.full_name as string) ?? user.email?.split("@")[0] ?? "학습자"
      setUserName(name)

      const readKey = `eduvibe_notices_read_${user.id}`
      const readIds: string[] = JSON.parse(localStorage.getItem(readKey) ?? "[]")
      const saved: Notice[] = JSON.parse(localStorage.getItem("eduvibe_notices_v1") ?? "null") ?? SAMPLE_NOTICES
      const withRead = saved.map((n) => ({ ...n, readBy: readIds.includes(n.id) ? [user.id, ...n.readBy.filter((id) => id !== user.id)] : n.readBy }))
      setNotices(withRead)
      setLoading(false)
    })
  }, [])

  // ── Q&A 로드 ──
  const fetchQA = useCallback(async (tok: string) => {
    if (!tok) return
    setQLoading(true)
    try {
      const res = await fetch("/api/student-qa", { headers: { Authorization: `Bearer ${tok}` } })
      if (res.ok) {
        const json = await res.json()
        setQuestions(json.questions ?? [])
      }
    } finally { setQLoading(false) }
  }, [])

  useEffect(() => {
    if (token) fetchQA(token)
  }, [token, fetchQA])

  // 읽음 처리
  const handleRead = (id: string) => {
    if (!userId) return
    setNotices((prev) => {
      const updated = prev.map((n) => n.id === id && !n.readBy.includes(userId) ? { ...n, readBy: [...n.readBy, userId] } : n)
      const readKey = `eduvibe_notices_read_${userId}`
      const readIds = updated.filter((n) => n.readBy.includes(userId)).map((n) => n.id)
      localStorage.setItem(readKey, JSON.stringify(readIds))
      localStorage.setItem("eduvibe_notices_v1", JSON.stringify(updated))
      return updated
    })
  }

  const handleDelete = (id: string) => {
    setNotices((prev) => {
      const updated = prev.filter((n) => n.id !== id)
      localStorage.setItem("eduvibe_notices_v1", JSON.stringify(updated))
      return updated
    })
  }

  const handleSubmit = (title: string, content: string, pinned: boolean) => {
    const newNotice: Notice = {
      id: crypto.randomUUID(), title, content, pinned, author: "관리자",
      createdAt: new Date().toISOString(), readBy: [userId],
    }
    setNotices((prev) => {
      const updated = pinned ? [newNotice, ...prev] : [...prev, newNotice]
      localStorage.setItem("eduvibe_notices_v1", JSON.stringify(updated))
      return updated
    })
    setShowForm(false)
  }

  // 질문 제출 (API 연동)
  const handleQuestionSubmit = async (title: string, content: string) => {
    if (!token) return
    setQASubmitting(true)
    try {
      const res = await fetch("/api/student-qa", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, content }),
      })
      if (res.ok) {
        await fetchQA(token)
        setShowQForm(false)
        setQSubmitted(true)
        setTimeout(() => setQSubmitted(false), 4000)
      }
    } finally { setQASubmitting(false) }
  }

  // 관리자 답변 (API 연동)
  const handleAnswer = async (authorId: string, questionId: string, answer: string) => {
    if (!token) return
    setAnsSubmitting(true)
    try {
      const res = await fetch("/api/student-qa", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ authorId, questionId, answer }),
      })
      if (res.ok) {
        await fetchQA(token)
        setAnswerTarget(null)
      }
    } finally { setAnsSubmitting(false) }
  }

  const unreadCount = notices.filter((n) => !n.readBy.includes(userId)).length
  const sorted = [...notices].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-[#58cc02]" /></div>
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-black text-[#3c3c3c]">공지사항</h1>
        {role === "admin" && (
          <button type="button" onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#ff9600] text-white font-bold rounded-2xl border-b-4 border-[#cc7000] hover:bg-[#ff9600]/90 active:border-b-0 transition-all text-sm">
            <Plus className="w-4 h-4" />공지 작성
          </button>
        )}
      </div>
      <p className="text-[#777] font-semibold mb-6">
        {role === "student" || role === "teacher"
          ? unreadCount > 0 ? `읽지 않은 공지 ${unreadCount}개가 있어요.` : "모든 공지를 읽었어요!"
          : `총 ${notices.length}개의 공지사항`}
      </p>

      {/* 읽음 요약 (강사·학생) */}
      {role !== "admin" && (
        <div className={`rounded-2xl p-4 mb-6 flex items-center gap-3 ${
          unreadCount === 0 ? "bg-[#f0fff0] border-2 border-[#58cc02]/30" : "bg-[#eaf7ff] border-2 border-[#1cb0f6]/30"
        }`}>
          {unreadCount === 0 ? <CheckCircle2 className="w-6 h-6 text-[#58cc02]" /> : <Bell className="w-6 h-6 text-[#1cb0f6]" />}
          <div>
            <p className={`font-bold text-sm ${unreadCount === 0 ? "text-[#58cc02]" : "text-[#1cb0f6]"}`}>
              {unreadCount === 0 ? "모든 공지를 확인했어요!" : `공지 ${unreadCount}개를 아직 읽지 않았어요`}
            </p>
            <p className="text-xs text-[#777] font-semibold">{notices.filter((n) => n.readBy.includes(userId)).length}/{notices.length} 읽음</p>
          </div>
        </div>
      )}

      {/* 공지 목록 */}
      {sorted.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-[#f7f7f7] rounded-2xl flex items-center justify-center mx-auto mb-3"><Bell className="w-8 h-8 text-[#e5e5e5]" /></div>
          <p className="text-[#afafaf] font-bold">등록된 공지가 없어요.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((notice) => (
            <NoticeItem key={notice.id} notice={notice} userId={userId} isInstructor={role === "admin"}
              onRead={handleRead} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* ── Q&A 섹션 (학생·강사) ── */}
      {(role === "student" || role === "teacher") && (
        <div className="mt-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 bg-[#eaf7ff] rounded-xl flex items-center justify-center">
              <HelpCircle className="w-4 h-4 text-[#1cb0f6]" />
            </div>
            <h2 className="text-lg font-black text-[#3c3c3c]">관리자에게 질문하기</h2>
          </div>

          {qSubmitted && (
            <div className="flex items-center gap-2 bg-[#f0fff0] border-2 border-[#58cc02]/30 rounded-2xl px-4 py-3 mb-4">
              <CheckCircle2 className="w-5 h-5 text-[#58cc02]" />
              <p className="text-sm font-bold text-[#58cc02]">질문이 관리자에게 전달됐어요! 답변을 기다려주세요.</p>
            </div>
          )}

          <button type="button" onClick={() => setShowQForm(true)}
            className="w-full flex items-center justify-center gap-2 py-4 bg-[#eaf7ff] border-2 border-dashed border-[#1cb0f6]/40 rounded-2xl text-[#1cb0f6] font-bold text-sm hover:bg-[#ddf2ff] transition-colors mb-4">
            <MessageSquarePlus className="w-5 h-5" />새 질문 작성하기
          </button>

          {qLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-[#afafaf]" /></div>
          ) : questions.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-bold text-[#afafaf] mb-2">내가 보낸 질문 ({questions.length}개)</p>
              {questions.map((q) => (
                <div key={q.id} className={`rounded-2xl border-2 p-4 ${q.answered ? "bg-[#f0fff0] border-[#58cc02]/30" : "bg-[#f7f7f7] border-[#e5e5e5]"}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${q.answered ? "bg-[#58cc02]/10" : "bg-[#1cb0f6]/10"}`}>
                      {q.answered ? <CheckCheck className="w-4 h-4 text-[#58cc02]" /> : <Clock className="w-4 h-4 text-[#1cb0f6]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-[#3c3c3c]">{q.title}</p>
                      <p className="text-xs text-[#777] font-semibold mt-0.5 line-clamp-1">{q.content}</p>
                      {q.answered && q.answer && (
                        <div className="mt-2 bg-white rounded-xl p-2.5 border border-[#58cc02]/30">
                          <p className="text-xs font-bold text-[#58cc02] mb-1">💬 관리자 답변</p>
                          <p className="text-xs text-[#3c3c3c] font-semibold">{q.answer}</p>
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs text-[#afafaf] font-semibold">{formatDate(q.createdAt)}</span>
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${q.answered ? "bg-[#58cc02]/10 text-[#58cc02]" : "bg-[#1cb0f6]/10 text-[#1cb0f6]"}`}>
                          {q.answered ? "답변 완료" : "답변 대기 중"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )}

      {/* ── 관리자: Q&A 관리 섹션 ── */}
      {role === "admin" && (
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-[#fff8e8] rounded-xl flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-[#ff9600]" />
              </div>
              <h2 className="text-lg font-black text-[#3c3c3c]">수강생·강사 질문 관리</h2>
            </div>
            <button type="button" onClick={() => fetchQA(token)}
              className="text-xs font-bold text-[#afafaf] hover:text-[#ff9600] flex items-center gap-1">
              <Loader2 className={`w-3.5 h-3.5 ${qLoading ? "animate-spin" : ""}`} />새로고침
            </button>
          </div>

          {qLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-[#afafaf]" /></div>
          ) : questions.length === 0 ? (
            <div className="text-center py-10 bg-[#f7f7f7] rounded-2xl">
              <HelpCircle className="w-8 h-8 text-[#e5e5e5] mx-auto mb-2" />
              <p className="text-[#afafaf] font-bold text-sm">접수된 질문이 없어요.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-bold text-[#afafaf]">총 {questions.length}개 질문 (미답변: {questions.filter(q => !q.answered).length}개)</p>
              {questions.map((q) => (
                <div key={q.id} className={`rounded-2xl border-2 p-4 ${q.answered ? "bg-white border-[#e5e5e5] opacity-80" : "bg-[#fff8e8] border-[#ff9600]/30"}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${q.answered ? "bg-[#f7f7f7]" : "bg-[#ff9600]/10"}`}>
                      {q.answered ? <CheckCheck className="w-4 h-4 text-[#58cc02]" /> : <HelpCircle className="w-4 h-4 text-[#ff9600]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${q.authorRole === "teacher" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                          {q.authorRole === "teacher" ? "강사" : "수강생"}
                        </span>
                        <span className="text-xs font-bold text-[#3c3c3c]">{q.author}</span>
                        {q.courseName && <span className="text-xs text-[#afafaf] font-semibold">{q.courseName}</span>}
                      </div>
                      <p className="font-bold text-sm text-[#3c3c3c]">{q.title}</p>
                      <p className="text-xs text-[#777] font-semibold mt-0.5 line-clamp-2">{q.content}</p>
                      {q.answered && q.answer && (
                        <div className="mt-2 bg-[#f0fff0] rounded-xl p-2.5 border border-[#58cc02]/30">
                          <p className="text-xs font-bold text-[#58cc02] mb-1">내 답변</p>
                          <p className="text-xs text-[#3c3c3c] font-semibold">{q.answer}</p>
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-[#afafaf] font-semibold">{formatDate(q.createdAt)}</span>
                        {!q.answered && (
                          <button type="button" onClick={() => setAnswerTarget(q)}
                            className="flex items-center gap-1 text-xs font-bold text-white bg-[#ff9600] px-3 py-1.5 rounded-xl hover:bg-[#ff9600]/90 transition-all">
                            <Send className="w-3 h-3" />답변하기
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 모달들 */}
      {showForm && <NoticeForm onClose={() => setShowForm(false)} onSubmit={handleSubmit} />}
      {showQForm && <QuestionForm onClose={() => setShowQForm(false)} onSubmit={handleQuestionSubmit} submitting={qaSubmitting} />}
      {answerTarget && <AnswerModal qa={answerTarget} onClose={() => setAnswerTarget(null)} onSubmit={handleAnswer} submitting={ansSubmitting} />}
    </div>
  )
}