"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Users, BookOpen, ShieldCheck, BarChart3, RefreshCw, AlertCircle, Copy, Check } from "lucide-react"
import { getSupabaseBrowser } from "@/lib/supabase-browser"
import { getRoleFromUser } from "@/lib/auth"

interface UserRow {
  id: string
  email: string
  role: string
  full_name: string
  course_name: string
  course_code: string
  createdAt: string
}

interface Course {
  courseName: string
  instructorName: string
  courseCode: string
  studentCount: number
}

interface Stats {
  total: number
  admins: number
  instructors: number
  students: number
}

interface AdminData {
  users: UserRow[]
  courses: Course[]
  stats: Stats
}

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-orange-100 text-orange-700",
  instructor: "bg-green-100 text-green-700",
  student: "bg-blue-100 text-blue-700",
}

const ROLE_LABELS: Record<string, string> = {
  admin: "관리자",
  instructor: "강사",
  student: "수강생",
}

export default function AdminPage() {
  const router = useRouter()
  const [data, setData] = useState<AdminData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "instructor" | "student">("all")
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const supabase = getSupabaseBrowser()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) { router.push("/login"); return }

      const user = session.user
      if (getRoleFromUser(user) !== "admin") {
        router.push("/dashboard/home")
        return
      }

      const res = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })

      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error ?? "데이터를 불러오지 못했어요.")
      }

      const json = await res.json()
      setData(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했어요.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const filteredUsers = data?.users.filter((u) => {
    const matchRole = roleFilter === "all" || u.role === roleFilter
    const matchSearch =
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.course_name.toLowerCase().includes(search.toLowerCase()) ||
      u.course_code.toLowerCase().includes(search.toLowerCase())
    return matchRole && matchSearch
  }) ?? []

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-[#3c3c3c] flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-[#ff9600]" />
            관리자 대시보드
          </h1>
          <p className="text-[#777] font-semibold mt-1">전체 사용자 및 과정을 관리해요</p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border-2 border-[#e5e5e5] text-[#777] font-bold hover:border-[#ff9600] hover:text-[#ff9600] transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          새로고침
        </button>
      </div>

      {/* 에러 */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border-2 border-red-200 rounded-2xl text-red-600 font-semibold">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {/* 통계 카드 */}
      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "전체 사용자", value: data.stats.total, icon: Users, color: "#3c3c3c", bg: "bg-gray-50" },
            { label: "관리자", value: data.stats.admins, icon: ShieldCheck, color: "#ff9600", bg: "bg-orange-50" },
            { label: "강사", value: data.stats.instructors, icon: BookOpen, color: "#58cc02", bg: "bg-green-50" },
            { label: "수강생", value: data.stats.students, icon: Users, color: "#1cb0f6", bg: "bg-blue-50" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className={`${bg} rounded-3xl p-5 border-2 border-white`}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-[#777]">{label}</p>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <p className="text-4xl font-black" style={{ color }}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* 과정 목록 */}
      {data && data.courses.length > 0 && (
        <div className="bg-white rounded-3xl border-2 border-[#e5e5e5] overflow-hidden">
          <div className="p-5 border-b-2 border-[#e5e5e5]">
            <h2 className="text-lg font-black text-[#3c3c3c] flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#58cc02]" />
              개설된 과정
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
            {data.courses.map((course) => (
              <div key={course.courseCode} className="bg-[#f7f7f7] rounded-2xl p-4 space-y-3">
                <div>
                  <p className="font-black text-[#3c3c3c]">{course.courseName || `${course.instructorName}의 과정`}</p>
                  <p className="text-sm text-[#777] font-semibold">강사: {course.instructorName}</p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-black text-[#58cc02] bg-white px-2.5 py-1 rounded-lg border border-[#e5e5e5]">
                      {course.courseCode}
                    </code>
                    <button
                      onClick={() => copyCode(course.courseCode)}
                      className="p-1.5 rounded-lg text-[#afafaf] hover:text-[#58cc02] transition-colors"
                      title="과정코드 복사"
                    >
                      {copiedCode === course.courseCode
                        ? <Check className="w-4 h-4 text-[#58cc02]" />
                        : <Copy className="w-4 h-4" />
                      }
                    </button>
                  </div>
                  <span className="text-sm font-bold text-[#1cb0f6]">
                    수강생 {course.studentCount}명
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 사용자 테이블 */}
      <div className="bg-white rounded-3xl border-2 border-[#e5e5e5] overflow-hidden">
        <div className="p-5 border-b-2 border-[#e5e5e5] space-y-3">
          <h2 className="text-lg font-black text-[#3c3c3c] flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#1cb0f6]" />
            사용자 목록
          </h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="이름, 이메일, 과정명으로 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-2xl border-2 border-[#e5e5e5] bg-[#f7f7f7] text-sm font-semibold text-[#3c3c3c] placeholder:text-[#afafaf] focus:outline-none focus:border-[#1cb0f6] focus:bg-white transition-all"
            />
            <div className="flex gap-2">
              {(["all", "admin", "instructor", "student"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    roleFilter === r
                      ? "bg-[#ff9600] text-white"
                      : "bg-[#f7f7f7] text-[#777] hover:bg-[#e5e5e5]"
                  }`}
                >
                  {r === "all" ? "전체" : ROLE_LABELS[r]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-[#afafaf] font-semibold gap-3">
            <RefreshCw className="w-5 h-5 animate-spin" />
            불러오는 중...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#afafaf] font-semibold gap-2">
            <Users className="w-10 h-10" />
            <p>사용자가 없어요</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#f7f7f7] border-b-2 border-[#e5e5e5]">
                <tr>
                  {["이름", "이메일", "역할", "과정명", "과정코드", "가입일"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-bold text-[#777] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-[#f7f7f7]">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-[#f7f7f7] transition-colors">
                    <td className="px-4 py-3 font-bold text-[#3c3c3c] whitespace-nowrap">
                      {u.full_name || "—"}
                    </td>
                    <td className="px-4 py-3 text-[#777] font-semibold">
                      {u.email}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${ROLE_COLORS[u.role] ?? "bg-gray-100 text-gray-600"}`}>
                        {ROLE_LABELS[u.role] ?? u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#777] font-semibold whitespace-nowrap">
                      {u.course_name || "—"}
                    </td>
                    <td className="px-4 py-3">
                      {u.course_code ? (
                        <div className="flex items-center gap-1.5">
                          <code className="text-xs font-black text-[#58cc02] bg-green-50 px-2 py-0.5 rounded-lg">
                            {u.course_code}
                          </code>
                          <button onClick={() => copyCode(u.course_code)} className="text-[#afafaf] hover:text-[#58cc02]">
                            {copiedCode === u.course_code ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-[#afafaf] font-semibold whitespace-nowrap">
                      {new Date(u.createdAt).toLocaleDateString("ko-KR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="px-4 py-3 text-xs text-[#afafaf] font-semibold border-t-2 border-[#f7f7f7]">
              총 {filteredUsers.length}명 표시 중 (전체 {data?.stats.total ?? 0}명)
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
