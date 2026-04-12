"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { BookOpen, Trophy, Flame, Star, ChevronRight, Users, GraduationCap, CalendarDays, Bell } from "lucide-react"
import { getSupabaseBrowser } from "@/lib/supabase-browser"
import { getRoleFromUser, type UserRole } from "@/lib/auth"
import { learningPath, dailyMissions } from "@/lib/dashboard/data"

// ── 요일별 응원 메시지 ──────────────────────────────────────
const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"]

const MOTIVATIONS = [
  { emoji: "☀️", message: "일요일 복습은 다음 주를 두 배로 빛나게 해요!", sub: "오늘의 노력이 내일의 나를 만듭니다" },
  { emoji: "🌱", message: "새로운 한 주의 시작! 오늘의 도전이 내일의 성장이 됩니다", sub: "작은 한 걸음이 큰 변화를 만들어요" },
  { emoji: "💪", message: "꾸준함이 최고의 무기입니다, 오늘도 화이팅!", sub: "어제의 나보다 오늘의 내가 더 성장했어요" },
  { emoji: "🏃", message: "주중 반환점! 여기까지 달려온 당신이 자랑스러워요", sub: "지금 이 순간이 미래를 바꾸고 있어요" },
  { emoji: "⚡", message: "주말이 코앞이에요. 조금만 더 힘내봐요!", sub: "끝까지 해내는 사람이 결국 이깁니다" },
  { emoji: "🎉", message: "불금! 오늘 한 번 더 집중하면 주말이 더 달콤해요", sub: "노력한 만큼 반드시 보상이 따라옵니다" },
  { emoji: "✨", message: "토요일에도 학습하는 당신, 정말 대단해요!", sub: "최고가 되는 길은 꾸준한 연습뿐이에요" },
]

interface Notice {
  id: string
  title: string
  content: string
  pinned: boolean
  author: string
  createdAt: string
  readBy: string[]
}

const SAMPLE_NOTICES: Notice[] = [
  {
    id: "n1",
    title: "📌 수강 시작 전 필수 사항 안내",
    content: "안녕하세요! EduVibe-AI에 오신 것을 환영합니다.",
    pinned: true,
    author: "관리자",
    createdAt: new Date().toISOString(),
    readBy: [],
  },
]

export default function HomePage() {
  const [userName, setUserName] = useState("학습자")
  const [role, setRole] = useState<UserRole>("student")
  const [notices, setNotices] = useState<Notice[]>([])
  const [dayInfo, setDayInfo] = useState({ dayName: "월", motivation: MOTIVATIONS[1] })

  useEffect(() => {
    // 요일 계산
    const dayIndex = new Date().getDay()
    setDayInfo({ dayName: DAY_NAMES[dayIndex], motivation: MOTIVATIONS[dayIndex] })

    // 공지사항 로드
    const saved = localStorage.getItem("eduvibe_notices_v1")
    const loaded: Notice[] = saved ? JSON.parse(saved) : SAMPLE_NOTICES
    // 최신 3개 (핀 우선)
    const sorted = [...loaded].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
    setNotices(sorted.slice(0, 3))
  }, [])

  useEffect(() => {
    const supabase = getSupabaseBrowser()
    supabase.auth.getUser().then(({ data }: { data: { user: import("@supabase/supabase-js").User | null } }) => {
      const user = data.user
      if (!user) return
      setRole(getRoleFromUser(user))
      const name =
        (user.user_metadata?.full_name as string) ??
        (user.user_metadata?.name as string) ??
        user.email?.split("@")[0] ?? "학습자"
      setUserName(name)
    })
  }, [])

  const currentUnit = learningPath.find((u) => u.status === "current") ?? learningPath[0]
  const completedCount = learningPath.filter((u) => u.status === "completed").length

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">

      {/* 역할 배너 + 요일 인사 */}
      <div className={`rounded-2xl p-5 mb-8 ${
        role === "instructor"
          ? "bg-gradient-to-r from-[#58cc02] to-[#46a302]"
          : "bg-gradient-to-r from-[#1cb0f6] to-[#1899d6]"
      }`}>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center shrink-0 text-2xl">
            {dayInfo.motivation.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white/80 text-sm font-semibold">
              {role === "instructor" ? "강사 모드" : "학생 모드"} · {dayInfo.dayName}요일
            </p>
            <p className="text-white font-black text-lg leading-snug">
              {userName}님, {dayInfo.motivation.message}
            </p>
            <p className="text-white/80 text-sm font-semibold mt-1">
              💬 &quot;{dayInfo.motivation.sub}&quot;
            </p>
          </div>
          <div className="shrink-0">
            {role === "instructor"
              ? <GraduationCap className="w-6 h-6 text-white/60" />
              : <Users className="w-6 h-6 text-white/60" />
            }
          </div>
        </div>
      </div>

      {/* 학생 전용: 학습 요약 카드 */}
      {role === "student" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {/* 현재 단원 */}
            <div className="bg-white rounded-2xl p-5 border-2 border-[#e5e5e5] col-span-1 sm:col-span-1">
              <p className="text-xs font-bold text-[#afafaf] uppercase tracking-wide mb-1">현재 단원</p>
              <p className="text-xl font-black text-[#1cb0f6]">{currentUnit.title}</p>
              <p className="text-sm text-[#777] font-semibold mt-1">+{currentUnit.xp} XP</p>
              <Link href="/dashboard/learn"
                className="mt-3 flex items-center gap-1 text-sm font-bold text-[#1cb0f6] hover:underline">
                학습 시작 <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* 스트릭 */}
            <div className="bg-[#fff9e6] rounded-2xl p-5 border-2 border-[#ffc800]/30">
              <p className="text-xs font-bold text-[#ffc800] uppercase tracking-wide mb-1">스트릭</p>
              <div className="flex items-end gap-1">
                <p className="text-3xl font-black text-[#ff9600]">7</p>
                <p className="text-lg font-bold text-[#ff9600] mb-0.5">일</p>
              </div>
              <Flame className="w-6 h-6 text-[#ffc800] mt-1" />
            </div>

            {/* XP */}
            <div className="bg-[#fff0f5] rounded-2xl p-5 border-2 border-[#ff4b9e]/20">
              <p className="text-xs font-bold text-[#ff4b9e] uppercase tracking-wide mb-1">총 XP</p>
              <div className="flex items-end gap-1">
                <p className="text-3xl font-black text-[#ff4b9e]">1,250</p>
              </div>
              <Star className="w-6 h-6 text-[#ff4b9e] mt-1" />
            </div>
          </div>

          {/* 빠른 이동 */}
          <h2 className="text-lg font-black text-[#3c3c3c] mb-4">오늘 할 일</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <QuickCard
              href="/dashboard/today"
              icon={<CalendarDays className="w-6 h-6 text-[#9b59b6]" />}
              bg="bg-[#f5eeff]"
              border="border-[#9b59b6]/20"
              title="오늘의 수업"
              desc="출석체크, 질문, 복습노트 작성"
            />
            <QuickCard
              href="/dashboard/quest"
              icon={<Trophy className="w-6 h-6 text-[#ff9600]" />}
              bg="bg-[#fff9e6]"
              border="border-[#ffc800]/30"
              title="퀘스트"
              desc={`오늘의 미션 ${dailyMissions.length}개 완료하기`}
            />
            <QuickCard
              href="/dashboard/learn"
              icon={<BookOpen className="w-6 h-6 text-[#1cb0f6]" />}
              bg="bg-[#eaf7ff]"
              border="border-[#1cb0f6]/20"
              title="배우기"
              desc={`${completedCount}/${learningPath.length} 단원 완료`}
            />
          </div>
        </>
      )}

      {/* 강사 전용: 요약 카드 */}
      {role === "instructor" && (
        <>
          <h2 className="text-lg font-black text-[#3c3c3c] mb-4">강사 메뉴</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <QuickCard
              href="/dashboard/quest"
              icon={<Trophy className="w-6 h-6 text-[#58cc02]" />}
              bg="bg-[#f0fff0]"
              border="border-[#58cc02]/20"
              title="문제 출제"
              desc="AI로 오늘의 미션 문제 생성하기"
            />
            <QuickCard
              href="/dashboard/notices"
              icon={<BookOpen className="w-6 h-6 text-[#1cb0f6]" />}
              bg="bg-[#eaf7ff]"
              border="border-[#1cb0f6]/20"
              title="공지사항"
              desc="학생들에게 공지 올리기"
            />
          </div>
        </>
      )}

      {/* ── 공지사항 배너 ── */}
      {notices.length > 0 && (
        <div className="mt-2">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-4 h-4 text-[#ff9600]" />
            <h2 className="text-sm font-black text-[#3c3c3c]">최근 공지사항</h2>
            <Link href="/dashboard/notices" className="ml-auto text-xs font-bold text-[#1cb0f6] hover:underline flex items-center gap-0.5">
              전체보기 <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-2">
            {notices.map((notice) => (
              <Link
                key={notice.id}
                href="/dashboard/notices"
                className="flex items-start gap-3 bg-white border-2 border-[#e5e5e5] rounded-2xl px-4 py-3 hover:border-[#ff9600]/40 hover:bg-[#fff9f0] transition-colors group"
              >
                <div className="shrink-0 w-8 h-8 rounded-full bg-[#fff0d6] flex items-center justify-center mt-0.5">
                  <Bell className="w-4 h-4 text-[#ff9600]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-[#3c3c3c] truncate group-hover:text-[#ff9600] transition-colors">
                    {notice.pinned && <span className="text-[#ff4b4b] mr-1">📌</span>}
                    {notice.title}
                  </p>
                  <p className="text-xs text-[#afafaf] font-semibold mt-0.5">
                    {notice.author} · {new Date(notice.createdAt).toLocaleDateString("ko-KR", { month: "long", day: "numeric" })}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#afafaf] shrink-0 self-center group-hover:text-[#ff9600] transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function QuickCard({ href, icon, bg, border, title, desc }: {
  href: string; icon: React.ReactNode; bg: string; border: string; title: string; desc: string
}) {
  return (
    <Link href={href}
      className={`${bg} ${border} border-2 rounded-2xl p-5 flex items-center gap-4 hover:-translate-y-0.5 transition-transform`}>
      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm">
        {icon}
      </div>
      <div>
        <p className="font-black text-[#3c3c3c]">{title}</p>
        <p className="text-sm text-[#777] font-semibold">{desc}</p>
      </div>
      <ChevronRight className="w-5 h-5 text-[#afafaf] ml-auto" />
    </Link>
  )
}
