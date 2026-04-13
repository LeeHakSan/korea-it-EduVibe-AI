"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  BookOpen, Bell, ChevronRight, Users, Trophy,
  ClipboardList, Briefcase, CalendarCheck, RefreshCw, Loader2,
} from "lucide-react"
import { getSupabaseBrowser } from "@/lib/supabase-browser"
import { getRoleFromUser } from "@/lib/auth"

// ── 요일 정보 ─────────────────────────────────────────────────
const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"]
const MOTIVATIONS = [
  "주말에도 학생들을 위해 수고해주시는 선생님, 감사합니다!",
  "새로운 한 주의 시작! 오늘도 훌륭한 수업 기대할게요.",
  "열정 넘치는 강의, 학생들에게 큰 힘이 됩니다!",
  "이번 주 중반, 지금까지 정말 수고 많으셨어요!",
  "오늘도 최고의 강의를 펼쳐주세요!",
  "한 주를 마무리하는 금요일, 멋진 수업이 될 거예요!",
  "토요일에도 학생들을 생각하는 선생님, 존경합니다!",
]

interface StudentSummary {
  userId: string
  name: string
  email: string
  attendance: string[]
  xp: number
}

export default function TeacherPage() {
  const router = useRouter()
  const [userName, setUserName] = useState("강사")
  const [courseName, setCourseName] = useState("")
  const [token, setToken] = useState("")
  const [dayInfo, setDayInfo] = useState({ dayName: "월", motivation: MOTIVATIONS[1] })
  const [students, setStudents] = useState<StudentSummary[]>([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [authKey, setAuthKey] = useState("") // 과정코드

  useEffect(() => {
    const dayIndex = new Date().getDay()
    setDayInfo({ dayName: DAY_NAMES[dayIndex], motivation: MOTIVATIONS[dayIndex] })
  }, [])

  useEffect(() => {
    const supabase = getSupabaseBrowser()
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: import("@supabase/supabase-js").Session | null } }) => {
      if (!session) { router.push("/login"); return }
      const user = session.user
      const role = getRoleFromUser(user)
      if (role !== "teacher") {
        router.push(role === "admin" ? "/dashboard/admin" : "/dashboard/home")
        return
      }
      setToken(session.access_token)
      const name =
        (user.user_metadata?.full_name as string) ??
        (user.user_metadata?.name as string) ??
        user.email?.split("@")[0] ?? "강사"
      setUserName(name)
      setCourseName((user.user_metadata?.course_name as string) ?? "")
      setAuthKey((user.user_metadata?.auth_key as string) ?? "")
    })
  }, [router])

  // 내 과정 수강생 목록 로드
  const fetchStudents = async (tok: string) => {
    if (!tok) return
    setLoadingStudents(true)
    try {
      const res = await fetch("/api/attendance", { headers: { Authorization: `Bearer ${tok}` } })
      if (!res.ok) return
      const json = await res.json()
      // 관리자 응답에서 내 authKey와 일치하는 학생만 필터
      // 강사는 자신의 과정 학생만 볼 수 있음
      setStudents((json.students ?? []) as StudentSummary[])
    } finally { setLoadingStudents(false) }
  }

  useEffect(() => {
    if (token) fetchStudents(token)
  }, [token])

  // 오늘 날짜 (ISO)
  const now = new Date()
  const isoToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
  const todayAttendCount = students.filter(s => s.attendance.includes(isoToday)).length
  const totalXp = students.reduce((sum, s) => sum + (s.xp ?? 0), 0)

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

      {/* ── 인사 배너 ── */}
      <div className="bg-gradient-to-br from-[#58cc02] to-[#1cb0f6] rounded-3xl p-6 text-white">
        <p className="text-sm font-bold opacity-80 mb-1">
          {dayInfo.dayName}요일 · {courseName || "과정 미배정"}
        </p>
        <h1 className="text-2xl font-black mb-1">{userName} 선생님, 안녕하세요! 👋</h1>
        <p className="text-sm font-semibold opacity-90">{dayInfo.motivation}</p>
        {authKey && (
          <div className="mt-3 inline-flex items-center gap-2 bg-white/20 rounded-xl px-3 py-1.5">
            <span className="text-xs font-bold opacity-80">과정코드</span>
            <code className="text-sm font-black tracking-widest">{authKey}</code>
          </div>
        )}
      </div>

      {/* ── 빠른 메뉴 ── */}
      <div>
        <h2 className="text-base font-black text-[#3c3c3c] mb-3">빠른 메뉴</h2>
        <div className="grid grid-cols-2 gap-3">
          <QuickCard href="/dashboard/quest" icon={<Trophy className="w-6 h-6 text-[#ff9600]" />} bg="bg-[#fff9e6]" border="border-[#ffc800]/30" title="문제 출제" desc="AI 미션 문제 생성" />
          <QuickCard href="/dashboard/notices" icon={<Bell className="w-6 h-6 text-[#ff4b4b]" />} bg="bg-[#fff0f0]" border="border-[#ff4b4b]/20" title="공지사항" desc="학생 공지 올리기" />
          <QuickCard href="/dashboard/career" icon={<Briefcase className="w-6 h-6 text-[#1cb0f6]" />} bg="bg-[#eaf7ff]" border="border-[#1cb0f6]/20" title="취업정보" desc="취업 자료 관리" />
          <QuickCard href="/dashboard/learn" icon={<BookOpen className="w-6 h-6 text-[#58cc02]" />} bg="bg-[#f0fff0]" border="border-[#58cc02]/20" title="학습 자료" desc="수업 자료 확인" />
        </div>
      </div>

      {/* ── 오늘 과정 현황 ── */}
      <div className="bg-white rounded-3xl border-2 border-[#e5e5e5] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-black text-[#3c3c3c] flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-[#58cc02]" />
            수강생 현황
          </h2>
          <button onClick={() => fetchStudents(token)} disabled={loadingStudents} className="text-[#afafaf] hover:text-[#3c3c3c]">
            <RefreshCw className={`w-4 h-4 ${loadingStudents ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* 요약 수치 */}
        <div className="grid grid-cols-3 gap-3">
          <StatChip icon={<Users className="w-4 h-4 text-[#1cb0f6]" />} label="수강생" value={`${students.length}명`} color="text-[#1cb0f6]" />
          <StatChip icon={<CalendarCheck className="w-4 h-4 text-[#58cc02]" />} label="오늘 출석" value={`${todayAttendCount}명`} color="text-[#58cc02]" />
          <StatChip icon={<Trophy className="w-4 h-4 text-[#ff9600]" />} label="총 XP" value={totalXp.toLocaleString()} color="text-[#ff9600]" />
        </div>

        {/* 수강생 리스트 */}
        {loadingStudents ? (
          <div className="flex items-center justify-center py-8 text-[#afafaf] gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> 불러오는 중...
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-8 text-[#afafaf]">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="font-semibold text-sm">등록된 수강생이 없어요</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {[...students]
              .sort((a, b) => b.xp - a.xp)
              .map((s, i) => {
                const attended = s.attendance.includes(isoToday)
                return (
                  <div key={s.userId} className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-[#f7f7f7]">
                    <span className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0 ${
                      i === 0 ? "bg-[#ffd700] text-white" : i === 1 ? "bg-[#c0c0c0] text-white" : i === 2 ? "bg-[#cd7f32] text-white" : "bg-[#e5e5e5] text-[#777]"
                    }`}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-[#3c3c3c] truncate">{s.name || s.email}</p>
                      <p className="text-xs text-[#afafaf] font-semibold">출석 {s.attendance.length}일</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${attended ? "bg-green-100 text-green-700" : "bg-[#f0f0f0] text-[#afafaf]"}`}>
                        {attended ? "출석" : "미출석"}
                      </span>
                      <span className="text-xs font-black text-[#ff9600]">{s.xp.toLocaleString()} XP</span>
                    </div>
                  </div>
                )
              })}
          </div>
        )}
      </div>

      {/* ── Q&A 바로가기 ── */}
      <Link href="/dashboard/notices"
        className="flex items-center gap-4 bg-white border-2 border-[#e5e5e5] hover:border-[#ff9600]/40 hover:bg-[#fff9f0] rounded-3xl px-5 py-4 transition-all group">
        <div className="w-11 h-11 rounded-2xl bg-[#fff0d6] flex items-center justify-center shrink-0">
          <Bell className="w-5 h-5 text-[#ff9600]" />
        </div>
        <div className="flex-1">
          <p className="font-black text-[#3c3c3c]">학생 질문 확인</p>
          <p className="text-xs text-[#afafaf] font-semibold mt-0.5">공지사항 → Q&A 탭에서 답변하기</p>
        </div>
        <ChevronRight className="w-5 h-5 text-[#afafaf] group-hover:text-[#ff9600] transition-colors" />
      </Link>

    </div>
  )
}

function QuickCard({ href, icon, bg, border, title, desc }: {
  href: string; icon: React.ReactNode; bg: string; border: string; title: string; desc: string
}) {
  return (
    <Link href={href}
      className={`${bg} ${border} border-2 rounded-2xl p-4 flex items-center gap-3 hover:-translate-y-0.5 transition-transform`}>
      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="font-black text-[#3c3c3c] text-sm">{title}</p>
        <p className="text-xs text-[#777] font-semibold truncate">{desc}</p>
      </div>
    </Link>
  )
}

function StatChip({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="bg-[#f7f7f7] rounded-2xl p-3 flex flex-col items-center gap-1">
      {icon}
      <p className={`text-base font-black ${color}`}>{value}</p>
      <p className="text-xs text-[#afafaf] font-semibold">{label}</p>
    </div>
  )
}
