"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Menu } from "lucide-react"
import Sidebar from "@/components/dashboard/sidebar"
import { getSupabaseBrowser } from "@/lib/supabase-browser"
import { getRoleFromUser, type UserRole } from "@/lib/auth"
import ChatbotWidget from "@/components/chatbot-widget"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [userName, setUserName] = useState("학습자")
  const [role, setRole] = useState<UserRole>("student")
  const [chatOpen, setChatOpen] = useState(false)
  const [chatUnitContext, setChatUnitContext] = useState<string | undefined>(undefined)

  useEffect(() => {
    const supabase = getSupabaseBrowser()
    supabase.auth.getUser().then(({ data }: { data: { user: import("@supabase/supabase-js").User | null } }) => {
      const user = data.user
      if (!user) { router.push("/login"); return }
      setRole(getRoleFromUser(user))
      const name =
        (user.user_metadata?.full_name as string) ??
        (user.user_metadata?.name as string) ??
        user.email?.split("@")[0] ??
        "학습자"
      setUserName(name)
    })
  }, [router])

  // ── 배우기 페이지에서 AI 튜터 열기 이벤트 수신 ──
  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<{ unitTitle: string; initialMessage: string }>
      setChatUnitContext(custom.detail.unitTitle)
      setChatOpen(true)
      // 챗봇 위젯에 초기 메시지 전달 (전역 임시 변수 활용)
      window.__chatbotInitialMessage = custom.detail.initialMessage
    }
    window.addEventListener("open-chatbot", handler)
    return () => window.removeEventListener("open-chatbot", handler)
  }, [])

  return (
    <div className="flex h-screen bg-[#f7f7f7] overflow-hidden">
      <Sidebar
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        userName={userName}
        role={role}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* 모바일 헤더 */}
        <header className="lg:hidden sticky top-0 z-30 bg-white border-b-2 border-[#e5e5e5] px-4 py-3 flex items-center justify-between shrink-0">
          <button onClick={() => setIsMenuOpen(true)} className="p-2 text-[#3c3c3c]">
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-black text-[#58cc02]">
            EduVibe<span className="text-[#1cb0f6]">-AI</span>
          </h1>
          <div className="w-10" />
        </header>

        <main className="flex-1 overflow-y-auto">
          <div data-username={userName} data-role={role}>
            {children}
          </div>
        </main>
      </div>

      <ChatbotWidget
        isOpen={chatOpen}
        onRequestOpen={() => setChatOpen(true)}
        onRequestClose={() => { setChatOpen(false); setChatUnitContext(undefined) }}
        unitContext={chatUnitContext}
      />
    </div>
  )
}
