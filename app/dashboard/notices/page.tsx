"use client"

import { useEffect, useState } from "react"
import { Bell, CheckCircle2, ChevronDown, ChevronUp, Pin, Plus, X, Loader2, Users, MessageSquarePlus, HelpCircle, Send } from "lucide-react"
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
  readBy: string[]   // user id 배열 (localStorage 기반)
}

// ── 기본 공지사항 (실제 서비스에서는 Supabase에서 로드) ──
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
    author: "김강사",
    createdAt: "2026-04-11T08:30:00",
    readBy: [],
  },
  {
    id: "n3",
    title: "퀴즈 일정 변경 안내",
    content: "4월 14일(월) 예정이었던 퀴즈가 4월 16일(수)로 변경되었습니다.\n\n추가 준비 시간을 활용해 퀘스트를 완료하고 복습노트를 정리해두세요.",
    pinned: false,
    author: "김강사",
    createdAt: "2026-04-11T14:00:00",
    readBy: [],
  },
]

// ── 학생 질문 타입 ──────────────────────────────────────
interface StudentQuestion {
  id: string
  title: string
  content: string
  author: string
  authorId: string
  createdAt: string
  answered: boolean   // 추후 관리자 페이지에서 답변 처리
}

// ── 날짜 포맷 ──
function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`
}

// ── 공지 항목 ──
function NoticeItem({
  notice,
  userId,
  isInstructor,
  onRead,
  onDelete,
}: {
  notice: Notice
  userId: string
  isInstructor: boolean
  onRead: (id: string) => void
  onDelete: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const isRead = notice.readBy.includes(userId)

  const handleOpen = () => {
    setOpen((v) => !v)
    if (!isRead && !open) onRead(notice.id)
  }

  return (
    <div className={`rounded-2xl border-2 transition-all ${
      notice.pinned
        ? "border-[#ffc800]/50 bg-[#fff9e6]"
        : isRead
        ? "border-[#e5e5e5] bg-white opacity-80"
        : "border-[#1cb0f6]/30 bg-white"
    }`}>
      {/* 헤더 */}
      <button
        type="button"
        onClick={handleOpen}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        {/* 아이콘 */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
          notice.pinned ? "bg-[#ffc800]/20" : isRead ? "bg-[#f7f7f7]" : "bg-[#1cb0f6]/10"
        }`}>
          {notice.pinned
            ? <Pin className="w-5 h-5 text-[#ffc800]" />
            : isRead
            ? <CheckCircle2 className="w-5 h-5 text-[#58cc02]" />
            : <Bell className="w-5 h-5 text-[#1cb0f6]" />
          }
        </div>

        {/* 텍스트 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {notice.pinned && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#ffc800]/20 text-[#ff9600]">
                필독
              </span>
            )}
            {!isRead && !notice.pinned && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#1cb0f6]/10 text-[#1cb0f6]">
                NEW
              </span>
            )}
            <p className={`font-bold text-sm truncate ${isRead ? "text-[#777]" : "text-[#3c3c3c]"}`}>
              {notice.title}
            </p>
          </div>
          <p className="text-xs text-[#afafaf] font-semibold mt-0.5">
            {notice.author} · {formatDate(notice.createdAt)}
          </p>
        </div>

        {/* 펼치기 아이콘 */}
        <div className="shrink-0 text-[#afafaf]">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* 내용 */}
      {open && (
        <div className="px-4 pb-4 pt-0">
          <div className="border-t border-[#f7f7f7] pt-4">
            <p className="text-sm text-[#3c3c3c] font-semibold whitespace-pre-wrap leading-relaxed">
              {notice.content}
            </p>

            {/* 강사 전용: 읽은 학생 수 표시 + 삭제 */}
            {isInstructor && (
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#f7f7f7]">
                <div className="flex items-center gap-1.5 text-[#777] text-xs font-semibold">
                  <Users className="w-3.5 h-3.5" />
                  <span>읽음 {notice.readBy.length}명</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onDelete(notice.id) }}
                  className="flex items-center gap-1 text-xs font-bold text-[#ff4b4b] hover:bg-[#fff0f0] px-2 py-1 rounded-lg transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                  삭제
                </button>
              </div>
            )}

            {/* 학생 전용: 읽음 확인 표시 */}
            {!isInstructor && isRead && (
              <div className="flex items-center gap-1.5 mt-3 text-[#58cc02] text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                읽음 확인 완료
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── 공지 작성 모달 (강사 전용) ──
function NoticeForm({ onClose, onSubmit }: { onClose: () => void; onSubmit: (title: string, content: string, pinned: boolean) => void }) {
  const [title,   setTitle]   = useState("")
  const [content, setContent] = useState("")
  const [pinned,  setPinned]  = useState(false)

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
          <button type="button" onClick={onClose} className="text-[#afafaf] hover:text-[#3c3c3c]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-bold text-[#3c3c3c] block mb-1.5">제목</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="공지 제목을 입력하세요"
              className="w-full px-4 py-3 rounded-2xl border-2 border-transparent bg-[#f7f7f7] text-[#3c3c3c] font-semibold placeholder:text-[#afafaf] placeholder:font-normal focus:outline-none focus:bg-white focus:border-[#1cb0f6] transition-all text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-bold text-[#3c3c3c] block mb-1.5">내용</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="공지 내용을 입력하세요..."
              rows={5}
              className="w-full px-4 py-3 rounded-2xl border-2 border-transparent bg-[#f7f7f7] text-[#3c3c3c] font-semibold placeholder:text-[#afafaf] placeholder:font-normal focus:outline-none focus:bg-white focus:border-[#1cb0f6] transition-all text-sm resize-none"
            />
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <div
              onClick={() => setPinned(!pinned)}
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                pinned ? "bg-[#ffc800] border-[#ffc800]" : "border-[#e5e5e5]"
              }`}
            >
              {pinned && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
            </div>
            <span className="text-sm font-bold text-[#3c3c3c]">필독 공지로 설정</span>
            <Pin className="w-4 h-4 text-[#ffc800]" />
          </label>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl font-bold text-[#777] bg-[#f7f7f7] hover:bg-[#e5e5e5] transition-all"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !content.trim()}
              className="flex-1 py-3 rounded-2xl font-bold text-white bg-[#58cc02] border-b-4 border-[#46a302] hover:bg-[#58cc02]/90 active:border-b-0 transition-all disabled:opacity-60"
            >
              등록하기
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── 질문 작성 모달 (학생 전용) ────────────────────────────
function QuestionForm({ onClose, onSubmit }: {
  onClose: () => void
  onSubmit: (title: string, content: string) => void
}) {
  const [title,   setTitle]   = useState("")
  const [content, setContent] = useState("")
  const [sending, setSending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return
    setSending(true)
    await new Promise((r) => setTimeout(r, 500))  // UX 딜레이
    onSubmit(title, content)
    setSending(false)
  }

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
          <button type="button" onClick={onClose} className="text-[#afafaf] hover:text-[#3c3c3c]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-[#afafaf] font-semibold mb-4 bg-[#f7f7f7] rounded-xl px-3 py-2">
          💬 질문은 관리자에게 전달되며, 추후 관리자 페이지에서 답변을 받을 수 있어요.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-bold text-[#3c3c3c] block mb-1.5">질문 제목</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="무엇이 궁금하신가요?"
              className="w-full px-4 py-3 rounded-2xl border-2 border-transparent bg-[#f7f7f7] text-[#3c3c3c] font-semibold placeholder:text-[#afafaf] placeholder:font-normal focus:outline-none focus:bg-white focus:border-[#1cb0f6] transition-all text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-bold text-[#3c3c3c] block mb-1.5">질문 내용</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="자세히 설명해주실수록 더 정확한 답변을 받을 수 있어요..."
              rows={5}
              className="w-full px-4 py-3 rounded-2xl border-2 border-transparent bg-[#f7f7f7] text-[#3c3c3c] font-semibold placeholder:text-[#afafaf] placeholder:font-normal focus:outline-none focus:bg-white focus:border-[#1cb0f6] transition-all text-sm resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl font-bold text-[#777] bg-[#f7f7f7] hover:bg-[#e5e5e5] transition-all"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !content.trim() || sending}
              className="flex-1 py-3 rounded-2xl font-bold text-white bg-[#1cb0f6] border-b-4 border-[#1499d6] hover:bg-[#1cb0f6]/90 active:border-b-0 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {sending ? "전송 중..." : "질문 전송"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── 메인 컴포넌트 ──────────────────────────────────────────
export default function NoticesPage() {
  const [role,          setRole]          = useState<UserRole>("student")
  const [userId,        setUserId]        = useState("")
  const [userName,      setUserName]      = useState("학습자")
  const [notices,       setNotices]       = useState<Notice[]>([])
  const [loading,       setLoading]       = useState(true)
  const [showForm,      setShowForm]      = useState(false)
  const [showQForm,     setShowQForm]     = useState(false)
  const [questions,     setQuestions]     = useState<StudentQuestion[]>([])
  const [qSubmitted,    setQSubmitted]    = useState(false)

  useEffect(() => {
    const supabase = getSupabaseBrowser()
    supabase.auth.getUser().then(({ data }: { data: { user: import("@supabase/supabase-js").User | null } }) => {
      const user = data.user
      if (!user) return
      setRole(getRoleFromUser(user))
      setUserId(user.id)
      const name =
        (user.user_metadata?.full_name as string) ??
        (user.user_metadata?.name as string) ??
        user.email?.split("@")[0] ?? "학습자"
      setUserName(name)

      // localStorage에서 읽음 기록 복원
      const readKey = `eduvibe_notices_read_${user.id}`
      const readIds: string[] = JSON.parse(localStorage.getItem(readKey) ?? "[]")

      // 샘플 공지 + 저장된 추가 공지 로드
      const savedKey = "eduvibe_notices_v1"
      const saved: Notice[] = JSON.parse(localStorage.getItem(savedKey) ?? "null") ?? SAMPLE_NOTICES
      const withRead = saved.map((n) => ({ ...n, readBy: readIds.includes(n.id) ? [user.id, ...n.readBy.filter((id) => id !== user.id)] : n.readBy }))
      setNotices(withRead)

      // 내 질문 로드
      const allQs: StudentQuestion[] = JSON.parse(localStorage.getItem("eduvibe_student_questions") ?? "[]")
      setQuestions(allQs.filter((q) => q.authorId === user.id))

      setLoading(false)
    })
  }, [])

  // 읽음 처리
  const handleRead = (id: string) => {
    if (!userId) return
    setNotices((prev) => {
      const updated = prev.map((n) =>
        n.id === id && !n.readBy.includes(userId)
          ? { ...n, readBy: [...n.readBy, userId] }
          : n
      )
      // localStorage에 읽음 기록 저장
      const readKey = `eduvibe_notices_read_${userId}`
      const readIds = updated.filter((n) => n.readBy.includes(userId)).map((n) => n.id)
      localStorage.setItem(readKey, JSON.stringify(readIds))
      localStorage.setItem("eduvibe_notices_v1", JSON.stringify(updated))
      return updated
    })
  }

  // 공지 삭제 (강사)
  const handleDelete = (id: string) => {
    setNotices((prev) => {
      const updated = prev.filter((n) => n.id !== id)
      localStorage.setItem("eduvibe_notices_v1", JSON.stringify(updated))
      return updated
    })
  }

  // 공지 작성 (강사)
  const handleSubmit = (title: string, content: string, pinned: boolean) => {
    const newNotice: Notice = {
      id: crypto.randomUUID(),
      title,
      content,
      pinned,
      author: "강사",
      createdAt: new Date().toISOString(),
      readBy: [userId],
    }
    setNotices((prev) => {
      const updated = pinned ? [newNotice, ...prev] : [...prev, newNotice]
      localStorage.setItem("eduvibe_notices_v1", JSON.stringify(updated))
      return updated
    })
    setShowForm(false)
  }

  // 질문 제출 (학생)
  const handleQuestionSubmit = (title: string, content: string) => {
    const newQ: StudentQuestion = {
      id: crypto.randomUUID(),
      title,
      content,
      author: userName,
      authorId: userId,
      createdAt: new Date().toISOString(),
      answered: false,
    }
    const allQs: StudentQuestion[] = JSON.parse(localStorage.getItem("eduvibe_student_questions") ?? "[]")
    const updated = [...allQs, newQ]
    localStorage.setItem("eduvibe_student_questions", JSON.stringify(updated))
    setQuestions((prev) => [...prev, newQ])
    setShowQForm(false)
    setQSubmitted(true)
    setTimeout(() => setQSubmitted(false), 4000)
  }

  const unreadCount = notices.filter((n) => !n.readBy.includes(userId)).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#58cc02]" />
      </div>
    )
  }

  // 정렬: 필독 우선, 이후 최신순
  const sorted = [...notices].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-black text-[#3c3c3c]">공지사항</h1>
        {role === "instructor" && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#58cc02] text-white font-bold rounded-2xl border-b-4 border-[#46a302] hover:bg-[#58cc02]/90 active:border-b-0 transition-all text-sm"
          >
            <Plus className="w-4 h-4" />
            공지 작성
          </button>
        )}
      </div>
      <p className="text-[#777] font-semibold mb-6">
        {role === "student"
          ? unreadCount > 0
            ? `읽지 않은 공지 ${unreadCount}개가 있어요.`
            : "모든 공지를 읽었어요!"
          : `총 ${notices.length}개의 공지사항`}
      </p>

      {/* 읽음 요약 (학생) */}
      {role === "student" && (
        <div className={`rounded-2xl p-4 mb-6 flex items-center gap-3 ${
          unreadCount === 0
            ? "bg-[#f0fff0] border-2 border-[#58cc02]/30"
            : "bg-[#eaf7ff] border-2 border-[#1cb0f6]/30"
        }`}>
          {unreadCount === 0
            ? <CheckCircle2 className="w-6 h-6 text-[#58cc02]" />
            : <Bell className="w-6 h-6 text-[#1cb0f6]" />
          }
          <div>
            <p className={`font-bold text-sm ${unreadCount === 0 ? "text-[#58cc02]" : "text-[#1cb0f6]"}`}>
              {unreadCount === 0 ? "모든 공지를 확인했어요!" : `공지 ${unreadCount}개를 아직 읽지 않았어요`}
            </p>
            <p className="text-xs text-[#777] font-semibold">
              {notices.filter((n) => n.readBy.includes(userId)).length}/{notices.length} 읽음
            </p>
          </div>
        </div>
      )}

      {/* 공지 목록 */}
      {sorted.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-[#f7f7f7] rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Bell className="w-8 h-8 text-[#e5e5e5]" />
          </div>
          <p className="text-[#afafaf] font-bold">등록된 공지가 없어요.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((notice) => (
            <NoticeItem
              key={notice.id}
              notice={notice}
              userId={userId}
              isInstructor={role === "instructor"}
              onRead={handleRead}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* ── 학생 질문 섹션 ── */}
      {role === "student" && (
        <div className="mt-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 bg-[#eaf7ff] rounded-xl flex items-center justify-center">
              <HelpCircle className="w-4 h-4 text-[#1cb0f6]" />
            </div>
            <h2 className="text-lg font-black text-[#3c3c3c]">관리자에게 질문하기</h2>
          </div>

          {/* 제출 성공 배너 */}
          {qSubmitted && (
            <div className="flex items-center gap-2 bg-[#f0fff0] border-2 border-[#58cc02]/30 rounded-2xl px-4 py-3 mb-4">
              <CheckCircle2 className="w-5 h-5 text-[#58cc02]" />
              <p className="text-sm font-bold text-[#58cc02]">질문이 성공적으로 전달됐어요! 관리자가 확인 후 답변드릴 예정이에요.</p>
            </div>
          )}

          {/* 질문 버튼 */}
          <button
            type="button"
            onClick={() => setShowQForm(true)}
            className="w-full flex items-center justify-center gap-2 py-4 bg-[#eaf7ff] border-2 border-dashed border-[#1cb0f6]/40 rounded-2xl text-[#1cb0f6] font-bold text-sm hover:bg-[#ddf2ff] transition-colors mb-4"
          >
            <MessageSquarePlus className="w-5 h-5" />
            새 질문 작성하기
          </button>

          {/* 내가 보낸 질문 목록 */}
          {questions.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-[#afafaf] mb-2">내가 보낸 질문 ({questions.length}개)</p>
              {[...questions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((q) => (
                <div key={q.id} className={`rounded-2xl border-2 p-4 ${
                  q.answered ? "bg-[#f0fff0] border-[#58cc02]/30" : "bg-[#f7f7f7] border-[#e5e5e5]"
                }`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      q.answered ? "bg-[#58cc02]/10" : "bg-[#1cb0f6]/10"
                    }`}>
                      {q.answered
                        ? <CheckCircle2 className="w-4 h-4 text-[#58cc02]" />
                        : <HelpCircle className="w-4 h-4 text-[#1cb0f6]" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-[#3c3c3c] truncate">{q.title}</p>
                      <p className="text-xs text-[#afafaf] font-semibold mt-0.5 line-clamp-1">{q.content}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs text-[#afafaf] font-semibold">{formatDate(q.createdAt)}</span>
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                          q.answered
                            ? "bg-[#58cc02]/10 text-[#58cc02]"
                            : "bg-[#1cb0f6]/10 text-[#1cb0f6]"
                        }`}>
                          {q.answered ? "답변 완료" : "답변 대기 중"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 공지 작성 모달 */}
      {showForm && (
        <NoticeForm
          onClose={() => setShowForm(false)}
          onSubmit={handleSubmit}
        />
      )}

      {/* 질문 작성 모달 */}
      {showQForm && (
        <QuestionForm
          onClose={() => setShowQForm(false)}
          onSubmit={handleQuestionSubmit}
        />
      )}
    </div>
  )
}
