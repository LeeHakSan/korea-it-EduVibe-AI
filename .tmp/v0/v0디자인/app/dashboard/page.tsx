"use client"

import { useState } from "react"
import Link from "next/link"
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
} from "lucide-react"

// 임시 사용자 데이터 (실제로는 인증에서 가져옴)
const userData = {
  name: "학습자",
  role: "instructor" as "student" | "instructor", // "student" 또는 "instructor"로 변경 가능
  streak: 7,
  xp: 1250,
  dailyGoal: 50,
  dailyProgress: 35,
}

// 학습 경로 데이터
const learningPath = [
  { id: 1, title: "파이썬 기초", status: "completed", xp: 100 },
  { id: 2, title: "변수와 자료형", status: "completed", xp: 150 },
  { id: 3, title: "조건문", status: "current", xp: 200 },
  { id: 4, title: "반복문", status: "locked", xp: 200 },
  { id: 5, title: "함수", status: "locked", xp: 250 },
  { id: 6, title: "리스트와 튜플", status: "locked", xp: 250 },
  { id: 7, title: "딕셔너리", status: "locked", xp: 300 },
  { id: 8, title: "클래스", status: "locked", xp: 350 },
]

export default function DashboardPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#f7f7f7] flex">
      {/* Left Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r-2 border-[#e5e5e5] transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
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
            <NavItem icon={Home} label="홈" active />
            <NavItem icon={BookOpen} label="배우기" />
            <NavItem icon={Trophy} label="퀘스트" />
            <NavItem icon={User} label="프로필" />
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
      <main className="flex-1 min-w-0">
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

        {/* Instructor Banner */}
        {userData.role === "instructor" && (
          <div className="bg-gradient-to-r from-[#58cc02] to-[#46a302] p-4 md:p-6">
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-white/80 text-sm font-semibold">
                    강사 모드
                  </p>
                  <p className="text-white font-bold">
                    학생들의 진도를 확인하세요
                  </p>
                </div>
              </div>
              <button className="px-6 py-3 bg-white rounded-2xl font-bold text-[#58cc02] border-b-4 border-[#e5e5e5] hover:bg-[#f7f7f7] active:border-b-0 active:mt-1 transition-all">
                학생 진도 현황 보기
              </button>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="max-w-4xl mx-auto p-4 md:p-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-[#3c3c3c]">
              안녕하세요, {userData.name}님!
            </h2>
            <p className="text-[#777] font-semibold mt-1">
              오늘도 파이썬 실력을 키워볼까요?
            </p>
          </div>

          {/* Learning Path */}
          <div className="relative">
            {/* Path Line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-[#e5e5e5] -translate-x-1/2 z-0" />

            {/* Unit Nodes */}
            <div className="relative z-10 space-y-6">
              {learningPath.map((unit, index) => (
                <UnitNode
                  key={unit.id}
                  unit={unit}
                  isLeft={index % 2 === 0}
                />
              ))}
            </div>
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
        </div>
      </aside>

      {/* TODO: AI 챗봇 플로팅 버튼 추가 위치 */}
      <button
        className="fixed bottom-6 right-6 w-16 h-16 bg-[#1cb0f6] rounded-full shadow-lg border-b-4 border-[#1899d6] flex items-center justify-center hover:bg-[#1cb0f6]/90 active:border-b-0 active:translate-y-1 transition-all z-50"
        aria-label="AI 도우미 열기"
      >
        <MessageCircle className="w-8 h-8 text-white" />
      </button>
    </div>
  )
}

// Navigation Item Component
function NavItem({
  icon: Icon,
  label,
  active = false,
}: {
  icon: React.ElementType
  label: string
  active?: boolean
}) {
  return (
    <Link
      href="#"
      className={`flex items-center gap-4 px-4 py-3 rounded-2xl font-bold transition-all ${
        active
          ? "bg-[#ddf4ff] text-[#1cb0f6] border-2 border-[#1cb0f6]"
          : "text-[#777] hover:bg-[#f7f7f7]"
      }`}
    >
      <Icon className="w-7 h-7" />
      <span className="text-lg">{label}</span>
    </Link>
  )
}

// Unit Node Component
function UnitNode({
  unit,
  isLeft,
}: {
  unit: (typeof learningPath)[0]
  isLeft: boolean
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
          } ${!isLocked && "hover:border-[#1cb0f6] cursor-pointer transition-all hover:shadow-lg"}`}
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
        disabled={isLocked}
        className={`w-16 h-16 rounded-full ${config.bgColor} border-b-4 ${config.borderColor} flex items-center justify-center flex-shrink-0 ${
          !isLocked &&
          "hover:scale-110 active:border-b-0 active:translate-y-1"
        } transition-all shadow-lg`}
      >
        {config.icon}
      </button>

      {/* Spacer for alignment */}
      <div className="flex-1" />
    </div>
  )
}
