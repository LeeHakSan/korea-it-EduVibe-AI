"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Users, BookOpen, ShieldCheck, BarChart3, RefreshCw,
  AlertCircle, Copy, Check, Plus, UserPlus, Key,
  ClipboardList, Eye, EyeOff, Loader2, TrendingUp,
  Trophy, CalendarCheck, Star, Trash2, Lock, UserCog,
} from "lucide-react"
import { getSupabaseBrowser } from "@/lib/supabase-browser"
import { getRoleFromUser } from "@/lib/auth"
import type { InviteCode, RegisteredInstructor } from "@/app/api/admin/codes/route"

// ── 공통 타입 ──────────────────────────────────────────────────
interface UserRow {
  id: string; email: string; role: string
  full_name: string; course_name: string; course_code: string; createdAt: string
}
interface Course {
  courseName: string; instructorName: string; courseCode: string; studentCount: number
}
interface Stats { total: number; admins: number; instructors: number; students: number }

const ROLE_LABELS: Record<string, string> = {
  admin: "관리자", instructor: "강사", student: "수강생",
}

type Tab = "overview" | "instructors" | "codes" | "stats" | "users"

// ── 클립보드 복사 훅 ──────────────────────────────────────────
function useCopy() {
  const [copied, setCopied] = useState<string | null>(null)
  const copy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(text)
    setTimeout(() => setCopied(null), 2000)
  }
  return { copied, copy }
}

// ── CopyButton ────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const { copied, copy } = useCopy()
  return (
    <button onClick={() => copy(text)} className="p-1 rounded text-[#afafaf] hover:text-[#58cc02]">
      {copied === text ? <Check className="w-3.5 h-3.5 text-[#58cc02]" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  )
}

// ── 메인 ─────────────────────────────────────────────────────
export default function AdminPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>("overview")
  const [token, setToken] = useState("")

  // 개요 데이터
  const [users, setUsers] = useState<UserRow[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loadingOverview, setLoadingOverview] = useState(false)

  // 강사 / 코드 데이터
  const [instructors, setInstructors] = useState<RegisteredInstructor[]>([])
  const [codes, setCodes] = useState<InviteCode[]>([])
  const [loadingCodes, setLoadingCodes] = useState(false)

  // 검색 / 필터
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "teacher" | "student">("all")

  // 역할 변경
  const [updatingRole, setUpdatingRole] = useState<string | null>(null)

  // 통계 데이터
  const [studentStats, setStudentStats] = useState<StudentStatRow[]>([])
  const [statsLoading, setStatsLoading] = useState(false)

  // 비밀번호 변경
  const [pwTarget, setPwTarget] = useState<{id: string; name: string} | null>(null)
  const [newPw, setNewPw] = useState("")
  const [pwSubmitting, setPwSubmitting] = useState(false)
  const [pwResult, setPwResult] = useState<string | null>(null)

  // 사용자 삭제
  const [deleteTarget, setDeleteTarget] = useState<{id: string; name: string; email: string} | null>(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)

  // ── 토큰 로드 ────────────────────────────────────────────────
  useEffect(() => {
    const supabase = getSupabaseBrowser()
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: import("@supabase/supabase-js").Session | null } }) => {
      if (!session) { router.push("/login"); return }
      const user = session.user
      if (getRoleFromUser(user) !== "admin") { router.push("/dashboard/home"); return }
      setToken(session.access_token)
    })
  }, [router])

  // ── 데이터 로드 ───────────────────────────────────────────────
  const fetchOverview = useCallback(async (tok: string) => {
    if (!tok) return
    setLoadingOverview(true)
    try {
      const res = await fetch("/api/admin/users", { headers: { Authorization: `Bearer ${tok}` } })
      if (!res.ok) return
      const json = await res.json()
      setUsers(json.users ?? [])
      setCourses(json.courses ?? [])
      setStats(json.stats ?? null)
    } finally { setLoadingOverview(false) }
  }, [])

  const fetchCodes = useCallback(async (tok: string) => {
    if (!tok) return
    setLoadingCodes(true)
    try {
      const res = await fetch("/api/admin/codes", { headers: { Authorization: `Bearer ${tok}` } })
      if (!res.ok) return
      const json = await res.json()
      setInstructors(json.instructors ?? [])
      setCodes(json.codes ?? [])
    } finally { setLoadingCodes(false) }
  }, [])

  // 통계 로드
  const fetchStats = useCallback(async (tok: string) => {
    if (!tok) return
    setStatsLoading(true)
    try {
      const res = await fetch("/api/attendance", { headers: { Authorization: `Bearer ${tok}` } })
      if (res.ok) {
        const json = await res.json()
        setStudentStats((json.students ?? []) as StudentStatRow[])
      }
    } finally { setStatsLoading(false) }
  }, [])

  useEffect(() => {
    if (!token) return
    if (tab === "overview" || tab === "users") fetchOverview(token)
    if (tab === "instructors" || tab === "codes") fetchCodes(token)
    if (tab === "stats") fetchStats(token)
  }, [token, tab, fetchOverview, fetchCodes, fetchStats])

  // 비밀번호 변경
  const changePw = async () => {
    if (!pwTarget || !newPw.trim()) return
    setPwSubmitting(true); setPwResult(null)
    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ targetUserId: pwTarget.id, newPassword: newPw }),
      })
      const json = await res.json()
      if (res.ok) { setPwResult("success"); setNewPw(""); setTimeout(() => { setPwTarget(null); setPwResult(null) }, 2000) }
      else setPwResult(json.error ?? "오류가 발생했어요.")
    } finally { setPwSubmitting(false) }
  }

  // 사용자 삭제
  const deleteUser = async () => {
    if (!deleteTarget) return
    setDeleteSubmitting(true)
    try {
      const res = await fetch("/api/admin/delete-user", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ targetUserId: deleteTarget.id }),
      })
      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== deleteTarget.id))
        setDeleteTarget(null)
      }
    } finally { setDeleteSubmitting(false) }
  }

  // ── 역할 변경 ─────────────────────────────────────────────────
  const changeRole = async (userId: string, newRole: "admin" | "teacher" | "student") => {
    setUpdatingRole(userId)
    try {
      const res = await fetch("/api/admin/update-role", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ targetUserId: userId, newRole }),
      })
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
      }
    } finally { setUpdatingRole(null) }
  }

  // ── 필터 ─────────────────────────────────────────────────────
  const filteredUsers = users.filter((u) => {
    const matchRole = roleFilter === "all" || u.role === roleFilter
    const matchSearch =
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.course_name.toLowerCase().includes(search.toLowerCase())
    return matchRole && matchSearch
  })

  // ── 탭 버튼 ──────────────────────────────────────────────────
  const TABS: { id: Tab; icon: React.ElementType; label: string }[] = [
    { id: "overview",    icon: BarChart3,    label: "현황" },
    { id: "instructors", icon: BookOpen,     label: "강사 등록" },
    { id: "codes",       icon: Key,          label: "코드 발급" },
    { id: "stats",       icon: TrendingUp,   label: "통계" },
    { id: "users",       icon: UserCog,      label: "사용자 관리" },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <ShieldCheck className="w-8 h-8 text-[#ff9600]" />
        <div>
          <h1 className="text-2xl font-black text-[#3c3c3c]">관리자 대시보드</h1>
          <p className="text-[#777] text-sm font-semibold">EduVibe-AI 시스템 관리</p>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex gap-2 border-b-2 border-[#e5e5e5] pb-0">
        {TABS.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-3 font-bold text-sm transition-all border-b-4 -mb-0.5 ${
              tab === id
                ? "text-[#ff9600] border-[#ff9600]"
                : "text-[#777] border-transparent hover:text-[#3c3c3c]"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── 탭 1: 현황 ──────────────────────────────────────── */}
      {tab === "overview" && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={() => fetchOverview(token)}
              disabled={loadingOverview}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl border-2 border-[#e5e5e5] text-[#777] font-bold text-sm hover:border-[#ff9600] hover:text-[#ff9600] transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loadingOverview ? "animate-spin" : ""}`} />
              새로고침
            </button>
          </div>

          {/* 통계 카드 */}
          {stats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "전체", value: stats.total,       color: "#3c3c3c", bg: "bg-gray-50" },
                { label: "관리자", value: stats.admins,    color: "#ff9600", bg: "bg-orange-50" },
                { label: "강사",   value: stats.instructors, color: "#58cc02", bg: "bg-green-50" },
                { label: "수강생", value: stats.students,  color: "#1cb0f6", bg: "bg-blue-50" },
              ].map(({ label, value, color, bg }) => (
                <div key={label} className={`${bg} rounded-3xl p-5 border-2 border-white`}>
                  <p className="text-xs font-bold text-[#777] mb-2">{label}</p>
                  <p className="text-4xl font-black" style={{ color }}>{value}</p>
                </div>
              ))}
            </div>
          )}

          {/* 과정 목록 */}
          {courses.length > 0 && (
            <div className="bg-white rounded-3xl border-2 border-[#e5e5e5] overflow-hidden">
              <div className="px-5 py-4 border-b-2 border-[#e5e5e5]">
                <h2 className="font-black text-[#3c3c3c] flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#58cc02]" /> 개설된 과정
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
                {courses.map((c) => (
                  <div key={c.courseCode} className="bg-[#f7f7f7] rounded-2xl p-4 space-y-2">
                    <p className="font-black text-[#3c3c3c]">{c.courseName || `${c.instructorName}의 과정`}</p>
                    <p className="text-sm text-[#777] font-semibold">강사: {c.instructorName}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <code className="text-sm font-black text-[#58cc02] bg-white px-2.5 py-0.5 rounded-lg border border-[#e5e5e5]">
                          {c.courseCode}
                        </code>
                        <CopyButton text={c.courseCode} />
                      </div>
                      <span className="text-sm font-bold text-[#1cb0f6]">수강생 {c.studentCount}명</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 사용자 테이블 */}
          <div className="bg-white rounded-3xl border-2 border-[#e5e5e5] overflow-hidden">
            <div className="px-5 py-4 border-b-2 border-[#e5e5e5] space-y-3">
              <h2 className="font-black text-[#3c3c3c]">사용자 목록</h2>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="이름, 이메일, 과정명 검색..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-2xl border-2 border-[#e5e5e5] bg-[#f7f7f7] text-sm font-semibold text-[#3c3c3c] placeholder:text-[#afafaf] focus:outline-none focus:border-[#1cb0f6] transition-all"
                />
                <div className="flex gap-2">
                  {(["all", "admin", "teacher", "student"] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setRoleFilter(r)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        roleFilter === r ? "bg-[#ff9600] text-white" : "bg-[#f7f7f7] text-[#777] hover:bg-[#e5e5e5]"
                      }`}
                    >
                      {r === "all" ? "전체" : ROLE_LABELS[r]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {loadingOverview ? (
              <div className="flex items-center justify-center py-16 text-[#afafaf] gap-2">
                <Loader2 className="w-5 h-5 animate-spin" /> 불러오는 중...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#f7f7f7] border-b-2 border-[#e5e5e5]">
                    <tr>
                      {["이름", "이메일", "역할 (클릭하여 변경)", "과정명", "과정코드", "가입일"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left font-bold text-[#777] whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-[#f7f7f7]">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-[#f7f7f7] transition-colors">
                        <td className="px-4 py-3 font-bold text-[#3c3c3c]">{u.full_name || "—"}</td>
                        <td className="px-4 py-3 text-[#777] font-semibold">{u.email}</td>
                        <td className="px-4 py-3">
                          {updatingRole === u.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-[#afafaf]" />
                          ) : (
                            <select
                              value={u.role}
                              onChange={(e) => changeRole(u.id, e.target.value as "admin" | "teacher" | "student")}
                              className={`text-xs font-bold px-2.5 py-1.5 rounded-full border-2 cursor-pointer focus:outline-none transition-all ${
                                u.role === "admin" ? "bg-orange-100 text-orange-700 border-orange-200"
                                : u.role === "teacher" ? "bg-green-100 text-green-700 border-green-200"
                                : "bg-blue-100 text-blue-700 border-blue-200"
                              }`}
                            >
                              <option value="admin">관리자</option>
                              <option value="teacher">강사</option>
                              <option value="student">수강생</option>
                            </select>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[#777] font-semibold">{u.course_name || "—"}</td>
                        <td className="px-4 py-3">
                          {u.course_code
                            ? <div className="flex items-center gap-1"><code className="text-xs font-black text-[#58cc02]">{u.course_code}</code><CopyButton text={u.course_code} /></div>
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-[#afafaf] font-semibold whitespace-nowrap">
                          {new Date(u.createdAt).toLocaleDateString("ko-KR")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="px-4 py-3 text-xs text-[#afafaf] font-semibold border-t-2 border-[#f7f7f7]">
                  {filteredUsers.length}명 표시 / 전체 {stats?.total ?? 0}명
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 탭 2: 강사 등록 ─────────────────────────────────── */}
      {tab === "instructors" && (
        <InstructorTab
          token={token}
          instructors={instructors}
          codes={codes}
          loading={loadingCodes}
          onRefresh={() => fetchCodes(token)}
        />
      )}

      {/* ── 탭 3: 코드 발급 ─────────────────────────────────── */}
      {tab === "codes" && (
        <CodeIssueTab
          token={token}
          instructors={instructors}
          codes={codes}
          loading={loadingCodes}
          onRefresh={() => fetchCodes(token)}
        />
      )}

      {/* ── 탭 4: 통계 ───────────────────────────────────────── */}
      {tab === "stats" && (
        <StatsTab
          students={studentStats}
          loading={statsLoading}
          onRefresh={() => fetchStats(token)}
        />
      )}

      {/* ── 탭 5: 사용자 관리 ────────────────────────────────────── */}
      {tab === "users" && (
        <UserManageTab
          token={token}
          users={users}
          loading={loadingOverview}
          onRefresh={() => fetchOverview(token)}
          onChangeRole={changeRole}
          updatingRole={updatingRole}
          onChangePw={(u) => { setPwTarget({ id: u.id, name: u.full_name || u.email }); setNewPw(""); setPwResult(null) }}
          onDelete={(u) => setDeleteTarget({ id: u.id, name: u.full_name || u.email, email: u.email })}
        />
      )}

      {/* 비밀번호 변경 모달 */}
      {pwTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setPwTarget(null)} />
          <div className="relative bg-white rounded-3xl border-2 border-[#e5e5e5] p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-5 h-5 text-[#ff9600]" />
              <h3 className="text-lg font-black text-[#3c3c3c]">비밀번호 변경</h3>
            </div>
            <p className="text-sm text-[#777] font-semibold mb-4 bg-[#f7f7f7] rounded-xl px-3 py-2">대상: <span className="font-black text-[#3c3c3c]">{pwTarget.name}</span></p>
            {pwResult === "success" ? (
              <div className="flex items-center gap-2 text-[#58cc02] font-bold py-3">
                <Check className="w-5 h-5" />비밀번호가 변경되었어요!
              </div>
            ) : (
              <>
                {pwResult && <p className="text-sm text-[#ff4b4b] font-semibold mb-3 bg-red-50 rounded-xl px-3 py-2">{pwResult}</p>}
                <input
                  type="text"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  placeholder="새 비밀번호 (최소 6자)"
                  className="w-full px-4 py-3 rounded-2xl border-2 border-[#e5e5e5] bg-[#f7f7f7] text-[#3c3c3c] font-semibold placeholder:text-[#afafaf] focus:outline-none focus:border-[#ff9600] transition-all text-sm mb-4"
                />
                <div className="flex gap-3">
                  <button type="button" onClick={() => setPwTarget(null)} className="flex-1 py-3 rounded-2xl font-bold text-[#777] bg-[#f7f7f7]">취소</button>
                  <button type="button" onClick={changePw} disabled={newPw.length < 6 || pwSubmitting}
                    className="flex-1 py-3 rounded-2xl font-bold text-white bg-[#ff9600] border-b-4 border-[#cc7000] disabled:opacity-60 flex items-center justify-center gap-2">
                    {pwSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                    변경
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-3xl border-2 border-[#e5e5e5] p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-2 mb-3">
              <Trash2 className="w-5 h-5 text-[#ff4b4b]" />
              <h3 className="text-lg font-black text-[#3c3c3c]">계정 삭제 확인</h3>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4">
              <p className="text-sm font-bold text-[#ff4b4b]">{deleteTarget.name}</p>
              <p className="text-xs text-[#777] font-semibold">{deleteTarget.email}</p>
            </div>
            <p className="text-sm text-[#777] font-semibold mb-4">이 계정을 삭제하면 복구할 수 없어요. 정말 삭제하시겠어요?</p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setDeleteTarget(null)} className="flex-1 py-3 rounded-2xl font-bold text-[#777] bg-[#f7f7f7]">취소</button>
              <button type="button" onClick={deleteUser} disabled={deleteSubmitting}
                className="flex-1 py-3 rounded-2xl font-bold text-white bg-[#ff4b4b] border-b-4 border-[#cc3333] disabled:opacity-60 flex items-center justify-center gap-2">
                {deleteSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 탭 2: 강사 등록
// ═══════════════════════════════════════════════════════════════
function InstructorTab({
  token, instructors, codes, loading, onRefresh
}: {
  token: string
  instructors: RegisteredInstructor[]
  codes: InviteCode[]
  loading: boolean
  onRefresh: () => void
}) {
  const [form, setForm] = useState({ instructorName: "", courseName: "" })
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ signupCode: string; authKey: string; courseName: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { copied, copy } = useCopy()

  const handleRegister = async () => {
    if (!form.instructorName.trim() || !form.courseName.trim()) {
      setError("강사명과 과정명을 모두 입력해주세요.")
      return
    }
    setSubmitting(true); setError(null); setResult(null)
    try {
      const res = await fetch("/api/admin/codes", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "register_instructor", ...form }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setResult(json)
      setForm({ instructorName: "", courseName: "" })
      onRefresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했어요.")
    } finally { setSubmitting(false) }
  }

  return (
    <div className="space-y-6">
      {/* 강사 등록 폼 */}
      <div className="bg-white rounded-3xl border-2 border-[#e5e5e5] p-6 space-y-4">
        <h2 className="text-lg font-black text-[#3c3c3c] flex items-center gap-2">
          <Plus className="w-5 h-5 text-[#58cc02]" /> 강사 등록
        </h2>
        <p className="text-sm text-[#777] font-semibold">
          강사를 등록하면 8자리 회원가입 코드와 학생용 과정코드가 자동 발급됩니다.
        </p>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {result && (
          <div className="p-4 bg-green-50 border-2 border-green-200 rounded-2xl space-y-3">
            <p className="font-black text-green-700">✅ {result.courseName} 강사 등록 완료!</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-white rounded-xl p-3 border border-green-200">
                <p className="text-xs text-[#777] font-bold mb-1">강사 회원가입 코드 (8자리)</p>
                <div className="flex items-center gap-2">
                  <code className="text-lg font-black text-[#58cc02] tracking-widest">{result.signupCode}</code>
                  <button onClick={() => copy(result.signupCode)} className="text-[#afafaf] hover:text-[#58cc02]">
                    {copied === result.signupCode ? <Check className="w-4 h-4 text-[#58cc02]" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-[#afafaf] mt-1">강사에게 전달하세요</p>
              </div>
              <div className="bg-white rounded-xl p-3 border border-green-200">
                <p className="text-xs text-[#777] font-bold mb-1">학생 과정코드 (6자리)</p>
                <div className="flex items-center gap-2">
                  <code className="text-lg font-black text-[#1cb0f6] tracking-widest">{result.authKey}</code>
                  <button onClick={() => copy(result.authKey)} className="text-[#afafaf] hover:text-[#1cb0f6]">
                    {copied === result.authKey ? <Check className="w-4 h-4 text-[#1cb0f6]" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-[#afafaf] mt-1">코드 발급 탭에서 학생 코드 발급 시 사용</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-[#3c3c3c]">강사명</label>
            <input
              value={form.instructorName}
              onChange={(e) => setForm(p => ({ ...p, instructorName: e.target.value }))}
              placeholder="예: 홍길동"
              className="w-full px-4 py-3 rounded-2xl border-2 border-transparent bg-[#f7f7f7] font-semibold text-sm text-[#3c3c3c] placeholder:text-[#afafaf] focus:outline-none focus:border-[#58cc02] focus:bg-white transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-[#3c3c3c]">과정명</label>
            <input
              value={form.courseName}
              onChange={(e) => setForm(p => ({ ...p, courseName: e.target.value }))}
              placeholder="예: 빅데이터과정"
              className="w-full px-4 py-3 rounded-2xl border-2 border-transparent bg-[#f7f7f7] font-semibold text-sm text-[#3c3c3c] placeholder:text-[#afafaf] focus:outline-none focus:border-[#58cc02] focus:bg-white transition-all"
            />
          </div>
        </div>
        <button
          onClick={handleRegister}
          disabled={submitting}
          className="flex items-center gap-2 px-6 py-3 bg-[#58cc02] text-white font-bold rounded-2xl border-b-4 border-[#46a302] hover:bg-[#58cc02]/90 active:border-b-0 transition-all disabled:opacity-60"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          강사 등록 및 코드 발급
        </button>
      </div>

      {/* 등록된 강사 목록 */}
      <div className="bg-white rounded-3xl border-2 border-[#e5e5e5] overflow-hidden">
        <div className="px-5 py-4 border-b-2 border-[#e5e5e5] flex items-center justify-between">
          <h2 className="font-black text-[#3c3c3c] flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-[#1cb0f6]" /> 등록된 강사 ({instructors.length}명)
          </h2>
          <button onClick={onRefresh} disabled={loading} className="text-[#afafaf] hover:text-[#3c3c3c]">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-[#afafaf] gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> 불러오는 중...
          </div>
        ) : instructors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-[#afafaf] gap-2">
            <BookOpen className="w-8 h-8" />
            <p className="font-semibold">등록된 강사가 없어요</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#f7f7f7] border-b-2 border-[#e5e5e5]">
                <tr>
                  {["강사명", "과정명", "회원가입 코드 (8자리)", "학생 과정코드 (6자리)", "등록일"].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-bold text-[#777] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-[#f7f7f7]">
                {instructors.map((ins) => {
                  const usedCode = codes.find(c => c.code === ins.signupCode)
                  return (
                    <tr key={ins.signupCode} className="hover:bg-[#f7f7f7]">
                      <td className="px-4 py-3 font-bold text-[#3c3c3c]">{ins.name}</td>
                      <td className="px-4 py-3 text-[#777] font-semibold">{ins.courseName}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <code className="font-black text-[#58cc02] tracking-widest">{ins.signupCode}</code>
                          <CopyButton text={ins.signupCode} />
                          {usedCode?.used && (
                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold">사용됨</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <code className="font-black text-[#1cb0f6] tracking-widest">{ins.authKey}</code>
                          <CopyButton text={ins.authKey} />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#afafaf] whitespace-nowrap">
                        {new Date(ins.registeredAt).toLocaleDateString("ko-KR")}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 탭 3: 코드 발급
// ═══════════════════════════════════════════════════════════════
function CodeIssueTab({
  token, instructors, codes, loading, onRefresh
}: {
  token: string
  instructors: RegisteredInstructor[]
  codes: InviteCode[]
  loading: boolean
  onRefresh: () => void
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [issuing, setIssuing] = useState(false)
  const [newCodes, setNewCodes] = useState<{ courseName: string; code: string }[]>([])
  const [error, setError] = useState<string | null>(null)
  const { copied, copy } = useCopy()

  const toggleSelect = (authKey: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(authKey)) { next.delete(authKey) } else { next.add(authKey) }
      return next
    })
  }

  const handleIssue = async () => {
    if (selected.size === 0) { setError("과정을 하나 이상 선택해주세요."); return }
    setIssuing(true); setError(null); setNewCodes([])
    try {
      const results: { courseName: string; code: string }[] = []
      for (const courseCode of Array.from(selected)) {
        const res = await fetch("/api/admin/codes", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ action: "issue_student_code", courseCode }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error)
        results.push({ courseName: json.courseName, code: json.signupCode })
      }
      setNewCodes(results)
      setSelected(new Set())
      onRefresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "코드 발급 중 오류가 발생했어요.")
    } finally { setIssuing(false) }
  }

  const studentCodes = codes.filter(c => c.type === "student")

  return (
    <div className="space-y-6">
      {/* 코드 발급 폼 */}
      <div className="bg-white rounded-3xl border-2 border-[#e5e5e5] p-6 space-y-4">
        <h2 className="text-lg font-black text-[#3c3c3c] flex items-center gap-2">
          <Key className="w-5 h-5 text-[#ff9600]" /> 학생 코드 발급
        </h2>
        <p className="text-sm text-[#777] font-semibold">
          학생 코드를 발급할 과정을 선택하세요. 선택한 과정별로 8자리 회원가입 코드가 각각 발급됩니다.
        </p>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {/* 새로 발급된 코드 결과 */}
        {newCodes.length > 0 && (
          <div className="p-4 bg-orange-50 border-2 border-orange-200 rounded-2xl space-y-3">
            <p className="font-black text-orange-700">✅ 학생 코드 발급 완료!</p>
            <div className="space-y-2">
              {newCodes.map(({ courseName, code }) => (
                <div key={code} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-orange-200">
                  <div>
                    <p className="font-bold text-[#3c3c3c] text-sm">{courseName}</p>
                    <code className="text-xl font-black text-[#ff9600] tracking-widest">{code}</code>
                  </div>
                  <button onClick={() => copy(code)} className="text-[#afafaf] hover:text-[#ff9600]">
                    {copied === code ? <Check className="w-5 h-5 text-[#ff9600]" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 과정 체크박스 목록 */}
        {loading ? (
          <div className="flex items-center gap-2 text-[#afafaf] py-4">
            <Loader2 className="w-4 h-4 animate-spin" /> 불러오는 중...
          </div>
        ) : instructors.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-[#afafaf] gap-2">
            <BookOpen className="w-8 h-8" />
            <p className="font-semibold text-sm">먼저 강사를 등록해주세요</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold text-[#3c3c3c]">코드 발급할 과정 선택</p>
              <button
                onClick={() => setSelected(new Set(instructors.map(i => i.authKey)))}
                className="text-xs text-[#1cb0f6] font-bold hover:underline"
              >
                전체 선택
              </button>
            </div>
            {instructors.map((ins) => (
              <label
                key={ins.authKey}
                className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  selected.has(ins.authKey)
                    ? "border-[#ff9600] bg-orange-50"
                    : "border-[#e5e5e5] hover:border-[#ff9600]/50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected.has(ins.authKey)}
                  onChange={() => toggleSelect(ins.authKey)}
                  className="w-5 h-5 accent-[#ff9600]"
                />
                <div className="flex-1">
                  <p className="font-bold text-[#3c3c3c]">{ins.courseName}</p>
                  <p className="text-sm text-[#777] font-semibold">강사: {ins.name}</p>
                </div>
                <code className="text-sm font-black text-[#1cb0f6] bg-blue-50 px-2.5 py-1 rounded-lg">
                  {ins.authKey}
                </code>
              </label>
            ))}
          </div>
        )}

        <button
          onClick={handleIssue}
          disabled={issuing || selected.size === 0}
          className="flex items-center gap-2 px-6 py-3 bg-[#ff9600] text-white font-bold rounded-2xl border-b-4 border-[#cc7000] hover:bg-[#ff9600]/90 active:border-b-0 transition-all disabled:opacity-50"
        >
          {issuing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
          {selected.size > 0 ? `${selected.size}개 과정 코드 발급` : "코드 발급"}
        </button>
      </div>

      {/* 발급된 학생 코드 내역 */}
      <div className="bg-white rounded-3xl border-2 border-[#e5e5e5] overflow-hidden">
        <div className="px-5 py-4 border-b-2 border-[#e5e5e5] flex items-center justify-between">
          <h2 className="font-black text-[#3c3c3c]">발급된 학생 코드 내역</h2>
          <button onClick={onRefresh} disabled={loading} className="text-[#afafaf] hover:text-[#3c3c3c]">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {studentCodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-[#afafaf] gap-2">
            <Key className="w-8 h-8" />
            <p className="font-semibold">발급된 학생 코드가 없어요</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#f7f7f7] border-b-2 border-[#e5e5e5]">
                <tr>
                  {["학생 코드 (8자리)", "과정명", "강사", "상태", "발급일"].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-bold text-[#777] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-[#f7f7f7]">
                {studentCodes.slice().reverse().map((c) => (
                  <tr key={c.code} className="hover:bg-[#f7f7f7]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <code className="font-black text-[#ff9600] tracking-widest">{c.code}</code>
                        <CopyButton text={c.code} />
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#777]">{c.courseName}</td>
                    <td className="px-4 py-3 font-semibold text-[#777]">{c.instructorName || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${c.used ? "bg-gray-100 text-gray-500" : "bg-green-100 text-green-700"}`}>
                        {c.used ? `사용됨 (${c.usedBy})` : "미사용"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#afafaf] whitespace-nowrap">
                      {new Date(c.createdAt).toLocaleDateString("ko-KR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 탭 4: 사용자 추가 (Supabase Admin API)
// ═══════════════════════════════════════════════════════════════
function AddUserTab({ token, onSuccess }: { token: string; onSuccess?: () => void }) {
  const [form, setForm] = useState({
    email: "", password: "", full_name: "", role: "admin", phone: "",
  })
  const [showPw, setShowPw] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ email: string; role: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.email || !form.password) { setError("이메일과 비밀번호를 입력해주세요."); return }
    setSubmitting(true); setError(null); setResult(null)
    try {
      const res = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setResult({ email: form.email, role: form.role })
      setForm({ email: "", password: "", full_name: "", role: "admin", phone: "" })
      onSuccess?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했어요.")
    } finally { setSubmitting(false) }
  }

  return (
    <div className="max-w-lg">
      <div className="bg-white rounded-3xl border-2 border-[#e5e5e5] p-6 space-y-5">
        <h2 className="text-lg font-black text-[#3c3c3c] flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-[#ff9600]" /> 사용자 직접 추가
        </h2>
        <p className="text-sm text-[#777] font-semibold">
          Supabase Admin API를 통해 이메일 인증 없이 계정을 즉시 생성합니다.
          생성된 관리자 계정은 바로 관리자 페이지에 접근할 수 있어요.
        </p>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {result && (
          <div className="p-4 bg-green-50 border-2 border-green-200 rounded-2xl">
            <p className="font-black text-green-700">
              ✅ {result.email} ({ROLE_LABELS[result.role]}) 계정 생성 완료!
            </p>
            <p className="text-sm text-green-600 font-semibold mt-1">
              이메일 인증 없이 바로 로그인 가능합니다.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { field: "full_name",  label: "이름",     type: "text",     placeholder: "홍길동" },
            { field: "email",      label: "이메일",   type: "email",    placeholder: "admin@example.com" },
            { field: "phone",      label: "연락처",   type: "tel",      placeholder: "01012345678" },
          ].map(({ field, label, type, placeholder }) => (
            <div key={field} className="space-y-1.5">
              <label className="text-sm font-bold text-[#3c3c3c]">{label}</label>
              <input
                type={type}
                placeholder={placeholder}
                value={form[field as keyof typeof form]}
                onChange={(e) => setForm(p => ({ ...p, [field]: e.target.value }))}
                className="w-full px-4 py-3 rounded-2xl border-2 border-transparent bg-[#f7f7f7] font-semibold text-sm text-[#3c3c3c] placeholder:text-[#afafaf] focus:outline-none focus:border-[#ff9600] focus:bg-white transition-all"
              />
            </div>
          ))}

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-[#3c3c3c]">비밀번호</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                placeholder="8자 이상"
                value={form.password}
                onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))}
                className="w-full px-4 py-3 pr-12 rounded-2xl border-2 border-transparent bg-[#f7f7f7] font-semibold text-sm text-[#3c3c3c] placeholder:text-[#afafaf] focus:outline-none focus:border-[#ff9600] focus:bg-white transition-all"
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#afafaf]">
                {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-[#3c3c3c]">역할</label>
            <div className="flex gap-3">
              {(["admin", "teacher", "student"] as const).map((r) => (
                <label key={r} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border-2 cursor-pointer font-bold text-sm transition-all ${
                  form.role === r
                    ? r === "admin" ? "border-[#ff9600] bg-orange-50 text-[#ff9600]"
                      : r === "teacher" ? "border-[#58cc02] bg-green-50 text-[#58cc02]"
                      : "border-[#1cb0f6] bg-blue-50 text-[#1cb0f6]"
                    : "border-[#e5e5e5] text-[#777]"
                }`}>
                  <input
                    type="radio"
                    name="role"
                    value={r}
                    checked={form.role === r}
                    onChange={() => setForm(p => ({ ...p, role: r }))}
                    className="sr-only"
                  />
                  {ROLE_LABELS[r]}
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#ff9600] text-white font-bold rounded-2xl border-b-4 border-[#cc7000] hover:bg-[#ff9600]/90 active:border-b-0 transition-all disabled:opacity-60"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
            {submitting ? "생성 중..." : "계정 생성"}
          </button>
        </form>
      </div>
    </div>
  )
}


// ═══════════════════════════════════════════════════════════════
// 탭 4: 통계 (XP 랭킹 + 출석)
// ═══════════════════════════════════════════════════════════════
interface StudentStatRow {
  userId: string; name: string; email: string; courseCode: string; courseName: string
  attendance: string[]; xp: number
}

function StatsTab({
  students, loading, onRefresh
}: {
  students: StudentStatRow[]
  loading: boolean
  onRefresh: () => void
}) {
  const [courseFilter, setCourseFilter] = useState<string>("all")

  // 과정 목록 추출
  const courses = Array.from(new Set(students.map(s => s.courseName).filter(Boolean)))

  const filtered = courseFilter === "all" ? students : students.filter(s => s.courseName === courseFilter)
  const sorted = [...filtered].sort((a, b) => b.xp - a.xp)

  // 색상 뱃지 (랭킹 1~3위)
  const rankStyle = (i: number) => {
    if (i === 0) return "bg-[#ffd700] text-white border-[#ffb800]"
    if (i === 1) return "bg-[#c0c0c0] text-white border-[#a0a0a0]"
    if (i === 2) return "bg-[#cd7f32] text-white border-[#a05e20]"
    return "bg-[#f7f7f7] text-[#777] border-[#e5e5e5]"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-[#3c3c3c] flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#ff9600]" />수강생 통계
        </h2>
        <button onClick={onRefresh} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl border-2 border-[#e5e5e5] text-[#777] font-bold text-sm hover:border-[#ff9600] hover:text-[#ff9600] transition-all disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />새로고침
        </button>
      </div>

      {/* 과정 필터 */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setCourseFilter("all")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${courseFilter === "all" ? "bg-[#ff9600] text-white" : "bg-[#f7f7f7] text-[#777] hover:bg-[#e5e5e5]"}`}>
          전체
        </button>
        {courses.map(c => (
          <button key={c} onClick={() => setCourseFilter(c)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${courseFilter === c ? "bg-[#ff9600] text-white" : "bg-[#f7f7f7] text-[#777] hover:bg-[#e5e5e5]"}`}>
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-[#afafaf] gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />불러오는 중...
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-16 bg-[#f7f7f7] rounded-3xl">
          <Users className="w-10 h-10 text-[#e5e5e5] mx-auto mb-3" />
          <p className="text-[#afafaf] font-bold">등록된 수강생이 없어요.</p>
        </div>
      ) : (
        <>
          {/* XP 랭킹 */}
          <div className="bg-white rounded-3xl border-2 border-[#e5e5e5] overflow-hidden">
            <div className="px-5 py-4 border-b-2 border-[#e5e5e5] flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#ffc800]" />
              <h3 className="font-black text-[#3c3c3c]">XP 랭킹</h3>
              <span className="text-xs text-[#afafaf] font-semibold ml-auto">{sorted.length}명</span>
            </div>
            <div className="divide-y-2 divide-[#f7f7f7]">
              {sorted.map((s, i) => {
                const totalDays = s.attendance.length
                return (
                  <div key={s.userId} className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#f7f7f7] transition-colors">
                    {/* 순위 */}
                    <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center shrink-0 font-black text-sm ${rankStyle(i)}`}>
                      {i + 1}
                    </div>
                    {/* 이름 & 과정 */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-[#3c3c3c] truncate">{s.name || s.email}</p>
                      <p className="text-xs text-[#afafaf] font-semibold">{s.courseName || "과정 미배정"}</p>
                    </div>
                    {/* XP */}
                    <div className="text-center shrink-0">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-[#ffc800]" />
                        <span className="font-black text-[#3c3c3c] text-sm">{s.xp.toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-[#afafaf] font-semibold">XP</p>
                    </div>
                    {/* 출석 */}
                    <div className="text-center shrink-0">
                      <div className="flex items-center gap-1">
                        <CalendarCheck className="w-4 h-4 text-[#58cc02]" />
                        <span className="font-black text-[#3c3c3c] text-sm">{totalDays}</span>
                      </div>
                      <p className="text-xs text-[#afafaf] font-semibold">출석일</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 출석 히트맵 카드들 */}
          <div className="bg-white rounded-3xl border-2 border-[#e5e5e5] overflow-hidden">
            <div className="px-5 py-4 border-b-2 border-[#e5e5e5] flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-[#58cc02]" />
              <h3 className="font-black text-[#3c3c3c]">출석 현황</h3>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              {sorted.map((s) => {
                const total = s.attendance.length
                // 최근 30일 날짜 생성
                const last30: string[] = []
                for (let i = 29; i >= 0; i--) {
                  const d = new Date()
                  d.setDate(d.getDate() - i)
                  // Use same format as API: toLocaleDateString("ko-KR") stripped of trailing dot
                  // Use ISO format YYYY-MM-DD to match API storage format
                  const y = d.getFullYear()
                  const mo = String(d.getMonth() + 1).padStart(2, "0")
                  const da = String(d.getDate()).padStart(2, "0")
                  last30.push(`${y}-${mo}-${da}`)
                }
                const attendSet = new Set(s.attendance)
                const present30 = last30.filter(d => attendSet.has(d)).length
                const absent30 = 30 - present30
                const pct = Math.round((present30 / 30) * 100)
                return (
                  <div key={s.userId} className="bg-[#f7f7f7] rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-bold text-sm text-[#3c3c3c]">{s.name || s.email}</p>
                        <p className="text-xs text-[#afafaf] font-semibold">{s.courseName || "과정 미배정"}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-lg text-[#3c3c3c]">{pct}%</p>
                        <p className="text-xs text-[#afafaf] font-semibold">최근 30일</p>
                      </div>
                    </div>
                    {/* 출석 바 */}
                    <div className="w-full bg-[#e5e5e5] rounded-full h-2.5 mb-3">
                      <div className="bg-[#58cc02] h-2.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    {/* 히트맵 (최근 30일 도트) */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(30, minmax(0, 1fr))", gap: "2px" }}>
                      {last30.map((d, i) => (
                        <div key={i} title={d}
                          className={`w-3 h-3 rounded-sm ${attendSet.has(d) ? "bg-[#58cc02]" : "bg-[#e5e5e5]"}`} />
                      ))}
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs font-semibold text-[#58cc02]">출석 {present30}일</span>
                      <span className="text-xs font-semibold text-[#afafaf]">결석 {absent30}일</span>
                      <span className="text-xs font-semibold text-[#777] ml-auto">누적 {total}일</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// 탭 5: 사용자 관리 (비밀번호 변경 + 삭제 + 사용자 추가)
// ═══════════════════════════════════════════════════════════════
function UserManageTab({
  token, users, loading, onRefresh, onChangeRole, updatingRole, onChangePw, onDelete
}: {
  token: string
  users: UserRow[]
  loading: boolean
  onRefresh: () => void
  onChangeRole: (userId: string, role: "admin" | "teacher" | "student") => void
  updatingRole: string | null
  onChangePw: (u: UserRow) => void
  onDelete: (u: UserRow) => void
}) {
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "teacher" | "student">("all")
  const [showAddUser, setShowAddUser] = useState(false)

  const ROLE_LABELS2: Record<string, string> = { admin: "관리자", teacher: "강사", student: "수강생" }

  const filtered = users.filter((u) => {
    const matchRole = roleFilter === "all" || u.role === roleFilter
    const matchSearch = !search ||
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.course_name.toLowerCase().includes(search.toLowerCase())
    return matchRole && matchSearch
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-black text-[#3c3c3c] flex items-center gap-2">
          <UserCog className="w-5 h-5 text-[#ff9600]" />사용자 관리
        </h2>
        <div className="flex gap-2">
          <button onClick={onRefresh} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl border-2 border-[#e5e5e5] text-[#777] font-bold text-sm hover:border-[#ff9600] hover:text-[#ff9600] transition-all disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />새로고침
          </button>
          <button onClick={() => setShowAddUser(!showAddUser)}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#ff9600] text-white font-bold text-sm border-b-4 border-[#cc7000] hover:bg-[#ff9600]/90 active:border-b-0 transition-all">
            <Plus className="w-4 h-4" />사용자 추가
          </button>
        </div>
      </div>

      {/* 사용자 추가 인라인 폼 */}
      {showAddUser && (
        <div className="bg-white rounded-3xl border-2 border-[#e5e5e5] p-6">
          <h3 className="font-black text-[#3c3c3c] mb-4 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-[#58cc02]" />새 사용자 추가
          </h3>
          <AddUserTab token={token} onSuccess={() => { setShowAddUser(false); onRefresh() }} />
        </div>
      )}

      {/* 검색 및 필터 */}
      <div className="bg-white rounded-3xl border-2 border-[#e5e5e5] overflow-hidden">
        <div className="px-5 py-4 border-b-2 border-[#e5e5e5] space-y-3">
          <input
            type="text"
            placeholder="이름, 이메일, 과정명 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 rounded-2xl border-2 border-[#e5e5e5] bg-[#f7f7f7] text-sm font-semibold text-[#3c3c3c] placeholder:text-[#afafaf] focus:outline-none focus:border-[#1cb0f6] transition-all"
          />
          <div className="flex gap-2 flex-wrap">
            {(["all", "admin", "teacher", "student"] as const).map((r) => (
              <button key={r} onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${roleFilter === r ? "bg-[#ff9600] text-white" : "bg-[#f7f7f7] text-[#777] hover:bg-[#e5e5e5]"}`}>
                {r === "all" ? "전체" : ROLE_LABELS2[r]}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-[#afafaf] gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />불러오는 중...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#f7f7f7] border-b-2 border-[#e5e5e5]">
                <tr>
                  {["이름", "이메일", "역할", "과정명", "가입일", "관리"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-bold text-[#777] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-[#f7f7f7]">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-[#f7f7f7] transition-colors">
                    <td className="px-4 py-3 font-bold text-[#3c3c3c]">{u.full_name || "—"}</td>
                    <td className="px-4 py-3 text-[#777] font-semibold text-xs">{u.email}</td>
                    <td className="px-4 py-3">
                      {updatingRole === u.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-[#afafaf]" />
                      ) : (
                        <select
                          value={u.role}
                          onChange={(e) => onChangeRole(u.id, e.target.value as "admin" | "teacher" | "student")}
                          className={`text-xs font-bold px-2.5 py-1.5 rounded-full border-2 cursor-pointer focus:outline-none transition-all ${
                            u.role === "admin" ? "bg-orange-100 text-orange-700 border-orange-200"
                            : u.role === "teacher" ? "bg-green-100 text-green-700 border-green-200"
                            : "bg-blue-100 text-blue-700 border-blue-200"
                          }`}
                        >
                          <option value="admin">관리자</option>
                          <option value="teacher">강사</option>
                          <option value="student">수강생</option>
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#777] font-semibold">{u.course_name || "—"}</td>
                    <td className="px-4 py-3 text-[#afafaf] font-semibold whitespace-nowrap">
                      {new Date(u.createdAt).toLocaleDateString("ko-KR")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => onChangePw(u)}
                          className="flex items-center gap-1 text-xs font-bold text-[#ff9600] hover:bg-orange-50 px-2 py-1.5 rounded-lg transition-all">
                          <Lock className="w-3.5 h-3.5" />비번
                        </button>
                        {u.role !== "admin" && (
                          <button type="button" onClick={() => onDelete(u)}
                            className="flex items-center gap-1 text-xs font-bold text-[#ff4b4b] hover:bg-red-50 px-2 py-1.5 rounded-lg transition-all">
                            <Trash2 className="w-3.5 h-3.5" />삭제
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="px-4 py-3 text-xs text-[#afafaf] font-semibold border-t-2 border-[#f7f7f7]">
              {filtered.length}명 표시 / 전체 {users.length}명
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
