"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { Home, BookOpen, Trophy, User, PenLine, Bell, X, LogOut, CalendarDays, Briefcase, ShieldCheck, GraduationCap } from "lucide-react"
import { getSupabaseBrowser } from "@/lib/supabase-browser"
import { useRouter } from "next/navigation"

const NAV_ITEMS = [
  { href: "/dashboard/home",       icon: Home,         label: "홈" },
  { href: "/dashboard/today",      icon: CalendarDays, label: "오늘의 수업" },
  { href: "/dashboard/learn",      icon: BookOpen,     label: "배우기" },
  { href: "/dashboard/quest",      icon: Trophy,       label: "퀘스트" },
  { href: "/dashboard/whiteboard", icon: PenLine,      label: "화이트보드" },
  { href: "/dashboard/notices",    icon: Bell,         label: "공지사항" },
  { href: "/dashboard/career",     icon: Briefcase,    label: "취업정보" },
  { href: "/dashboard/profile",    icon: User,         label: "프로필" },
]

const ADMIN_NAV_ITEMS = [
  { href: "/dashboard/admin",   icon: ShieldCheck,    label: "관리자 홈" },
  { href: "/dashboard/notices", icon: Bell,           label: "공지사항" },
  { href: "/dashboard/career",  icon: Briefcase,      label: "취업정보" },
  { href: "/dashboard/profile", icon: User,           label: "프로필" },
]

const TEACHER_NAV_ITEMS = [
  { href: "/dashboard/teacher", icon: GraduationCap,  label: "강사 홈" },
  { href: "/dashboard/quest",   icon: Trophy,         label: "문제 출제" },
  { href: "/dashboard/notices", icon: Bell,           label: "공지사항" },
  { href: "/dashboard/career",  icon: Briefcase,      label: "취업정보" },
  { href: "/dashboard/profile", icon: User,           label: "프로필" },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  userName: string
  role: string
}

export default function Sidebar({ isOpen, onClose, userName, role }: SidebarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get("tab") ?? ""
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = getSupabaseBrowser()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <>
      {/* 사이드바 본체 */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r-2 border-[#e5e5e5] flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 lg:static lg:z-auto`}
      >
        {/* 로고 — 역할별 홈으로 이동 */}
        <div className="p-6 border-b-2 border-[#e5e5e5] flex items-center justify-between">
          <Link href={role === "admin" ? "/dashboard/admin" : role === "teacher" ? "/dashboard/teacher" : "/dashboard/home"}>
            <h1 className="text-2xl font-black text-[#58cc02]">
              EduVibe<span className="text-[#1cb0f6]">-AI</span>
            </h1>
          </Link>
          <button onClick={onClose} className="lg:hidden p-1 text-[#afafaf] hover:text-[#3c3c3c]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 사용자 정보 */}
        <div className="px-4 py-3 border-b-2 border-[#e5e5e5]">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm ${
              role === "admin"
                ? "bg-gradient-to-br from-[#ff9600] to-[#ff4b4b]"
                : role === "teacher"
                ? "bg-gradient-to-br from-[#58cc02] to-[#1cb0f6]"
                : "bg-gradient-to-br from-[#1cb0f6] to-[#9333ea]"
            }`}>
              {userName.slice(0, 1)}
            </div>
            <div>
              <p className="font-bold text-[#3c3c3c] text-sm">{userName}님</p>
              <p className="text-xs font-semibold" style={{
                color: role === "admin" ? "#ff9600" : role === "teacher" ? "#58cc02" : "#1cb0f6"
              }}>
                {role === "admin" ? "관리자" : role === "teacher" ? "강사" : "수강생"}
              </p>
            </div>
          </div>
        </div>

        {/* 네비게이션 */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {(role === "admin" ? ADMIN_NAV_ITEMS : role === "teacher" ? TEACHER_NAV_ITEMS : NAV_ITEMS).map(({ href, icon: Icon, label }) => {
            // ?tab= 파라미터 분리
            const [hrefPath, hrefQuery] = href.split("?")
            const hrefTab = hrefQuery ? new URLSearchParams(hrefQuery).get("tab") ?? "" : ""
            // 어드민 탭 링크: 경로가 같고 tab 파라미터가 일치할 때 active
            const isTabLink = hrefPath === "/dashboard/admin" && hrefTab !== ""
            const isActive = isTabLink
              ? pathname === hrefPath && currentTab === hrefTab
              : hrefPath === "/dashboard/admin"
                ? pathname === "/dashboard/admin" && currentTab === ""
                : pathname === hrefPath || (hrefPath !== "/dashboard" && pathname.startsWith(hrefPath))
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${
                  isActive
                    ? role === "admin"
                      ? "bg-[#ff9600] text-white shadow-sm"
                      : role === "teacher"
                      ? "bg-[#58cc02] text-white shadow-sm"
                      : "bg-[#1cb0f6] text-white shadow-sm"
                    : "text-[#777] hover:bg-[#f7f7f7] hover:text-[#3c3c3c]"
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* 로그아웃 */}
        <div className="p-4 border-t-2 border-[#e5e5e5]">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl font-bold text-[#afafaf] hover:bg-[#fff0f0] hover:text-[#ff4b4b] transition-all"
          >
            <LogOut className="w-5 h-5" />
            로그아웃
          </button>
        </div>
      </aside>

      {/* 모바일 오버레이 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
    </>
  )
}
