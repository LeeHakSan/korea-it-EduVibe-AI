"use client"

import { useEffect, useState } from "react"
import {
  Briefcase, Building2, MapPin, CalendarDays, Plus, X,
  ChevronDown, ChevronUp, ExternalLink, Loader2, Sparkles,
  Clock, CheckCircle2,
} from "lucide-react"
import { getSupabaseBrowser } from "@/lib/supabase-browser"
import { getRoleFromUser, type UserRole } from "@/lib/auth"

// ── 타입 ──────────────────────────────────────────────────
interface JobPosting {
  id: string
  company: string
  position: string
  location: string
  description: string
  requirements: string
  deadline: string       // ISO string
  applyUrl: string
  tags: string[]
  pinned: boolean
  createdAt: string
  author: string
}

// ── 샘플 채용공고 ─────────────────────────────────────────
const SAMPLE_JOBS: JobPosting[] = [
  {
    id: "j1",
    company: "카카오",
    position: "백엔드 개발자 (Java/Spring) 신입",
    location: "판교",
    description:
      "카카오에서 Java 기반 백엔드 개발자를 모집합니다.\n\n주요 업무:\n• Spring Boot 기반 REST API 개발\n• 대용량 트래픽 처리 시스템 설계\n• 코드 리뷰 및 기술 문서 작성",
    requirements: "Java, Spring Boot, MySQL, Git 기본 이해 / 컴퓨터공학 관련 전공 우대",
    deadline: "2026-05-15T23:59:59",
    applyUrl: "https://careers.kakao.com",
    tags: ["Java", "Spring Boot", "신입", "백엔드"],
    pinned: true,
    createdAt: "2026-04-10T09:00:00",
    author: "관리자",
  },
  {
    id: "j2",
    company: "네이버",
    position: "프론트엔드 개발자 인턴",
    location: "분당 / 원격병행",
    description:
      "네이버 서비스 개발팀에서 프론트엔드 인턴을 모집합니다.\n\n주요 업무:\n• React 기반 사용자 인터페이스 개발\n• 다양한 디바이스 환경 최적화\n• 주니어 대상 실무 프로젝트 참여",
    requirements: "React, TypeScript 기본 이해 / 재학생 및 졸업예정자 지원 가능",
    deadline: "2026-04-30T23:59:59",
    applyUrl: "https://recruit.navercorp.com",
    tags: ["React", "TypeScript", "인턴", "프론트엔드"],
    pinned: false,
    createdAt: "2026-04-11T10:00:00",
    author: "관리자",
  },
  {
    id: "j3",
    company: "삼성SDS",
    position: "IT 컨설턴트 신입",
    location: "서울 강동구",
    description:
      "삼성SDS에서 디지털 전환 프로젝트를 함께 이끌어 나갈 신입 IT 컨설턴트를 모집합니다.\n\n주요 업무:\n• 고객사 IT 시스템 분석 및 솔루션 제안\n• DX(디지털전환) 프로젝트 참여\n• 데이터 기반 인사이트 도출",
    requirements: "IT 관련 전공 / 의사소통 능력 우수자 / SQL 기초 지식",
    deadline: "2026-05-31T23:59:59",
    applyUrl: "https://www.samsungsds.com/kr/recruit",
    tags: ["IT컨설팅", "신입", "DX", "데이터분석"],
    pinned: false,
    createdAt: "2026-04-12T08:00:00",
    author: "관리자",
  },
]

// ── 날짜 포맷 ──────────────────────────────────────────────
function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
}

function daysLeft(iso: string) {
  const diff = Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000)
  if (diff < 0) return { label: "마감됨", color: "text-[#afafaf]" }
  if (diff === 0) return { label: "오늘 마감!", color: "text-[#ff4b4b] font-black" }
  if (diff <= 7) return { label: `D-${diff}`, color: "text-[#ff9600] font-bold" }
  return { label: `D-${diff}`, color: "text-[#777] font-semibold" }
}

// ── 채용공고 카드 ─────────────────────────────────────────
function JobCard({
  job,
  isInstructor,
  onDelete,
}: {
  job: JobPosting
  isInstructor: boolean
  onDelete: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const dl = daysLeft(job.deadline)
  const expired = new Date(job.deadline) < new Date()

  return (
    <div className={`rounded-2xl border-2 transition-all ${
      job.pinned
        ? "border-[#1cb0f6]/40 bg-[#eaf7ff]"
        : expired
        ? "border-[#e5e5e5] bg-white opacity-60"
        : "border-[#e5e5e5] bg-white hover:border-[#1cb0f6]/30"
    }`}>
      {/* 헤더 */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start gap-4 p-5 text-left"
      >
        {/* 회사 아이콘 */}
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
          job.pinned ? "bg-[#1cb0f6]/10" : "bg-[#f7f7f7]"
        }`}>
          <Building2 className={`w-6 h-6 ${job.pinned ? "text-[#1cb0f6]" : "text-[#777]"}`} />
        </div>

        {/* 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {job.pinned && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#1cb0f6]/10 text-[#1cb0f6]">
                추천
              </span>
            )}
            {expired && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#f7f7f7] text-[#afafaf]">
                마감
              </span>
            )}
            {job.tags.slice(0, 3).map((t) => (
              <span key={t} className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#f7f7f7] text-[#777]">
                #{t}
              </span>
            ))}
          </div>
          <p className="font-black text-[#3c3c3c] text-base leading-snug">{job.position}</p>
          <p className="text-sm font-bold text-[#1cb0f6] mt-0.5">{job.company}</p>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <div className="flex items-center gap-1 text-xs text-[#777] font-semibold">
              <MapPin className="w-3.5 h-3.5" /> {job.location}
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold">
              <Clock className="w-3.5 h-3.5 text-[#afafaf]" />
              <span className={dl.color}>{dl.label}</span>
              <span className="text-[#afafaf]">· {formatDate(job.deadline)} 마감</span>
            </div>
          </div>
        </div>

        <div className="shrink-0 text-[#afafaf] self-center">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* 상세 내용 */}
      {open && (
        <div className="px-5 pb-5 border-t border-[#f7f7f7] pt-4">
          <div className="space-y-4">
            {/* 주요 업무 */}
            <div>
              <p className="text-xs font-black text-[#afafaf] uppercase tracking-wide mb-2">주요 업무 및 설명</p>
              <p className="text-sm text-[#3c3c3c] font-semibold whitespace-pre-wrap leading-relaxed">
                {job.description}
              </p>
            </div>

            {/* 자격요건 */}
            <div className="bg-[#f7f7f7] rounded-2xl p-4">
              <p className="text-xs font-black text-[#afafaf] uppercase tracking-wide mb-1.5">자격요건 / 우대사항</p>
              <p className="text-sm text-[#3c3c3c] font-semibold leading-relaxed">{job.requirements}</p>
            </div>

            {/* 지원 버튼 + 삭제 */}
            <div className="flex items-center gap-3 pt-1">
              {job.applyUrl && !expired && (
                <a
                  href={job.applyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-[#1cb0f6] text-white font-bold rounded-2xl border-b-4 border-[#1499d6] hover:bg-[#1cb0f6]/90 active:border-b-0 transition-all text-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  지원하기
                </a>
              )}
              {isInstructor && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onDelete(job.id) }}
                  className="flex items-center gap-1 text-xs font-bold text-[#ff4b4b] hover:bg-[#fff0f0] px-3 py-2 rounded-xl transition-all ml-auto"
                >
                  <X className="w-3.5 h-3.5" /> 삭제
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── 채용공고 작성 폼 (강사 전용) ──────────────────────────
function JobForm({ onClose, onSubmit }: {
  onClose: () => void
  onSubmit: (data: Omit<JobPosting, "id" | "createdAt" | "author">) => void
}) {
  const [company,     setCompany]     = useState("")
  const [position,    setPosition]    = useState("")
  const [location,    setLocation]    = useState("")
  const [description, setDescription] = useState("")
  const [requirements,setRequirements]= useState("")
  const [deadline,    setDeadline]    = useState("")
  const [applyUrl,    setApplyUrl]    = useState("")
  const [tagsInput,   setTagsInput]   = useState("")
  const [pinned,      setPinned]      = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!company.trim() || !position.trim() || !deadline) return
    onSubmit({
      company, position, location, description, requirements,
      deadline: new Date(deadline).toISOString(),
      applyUrl,
      tags: tagsInput.split(",").map((t) => t.trim()).filter(Boolean),
      pinned,
    })
  }

  const inputClass = "w-full px-4 py-3 rounded-2xl border-2 border-transparent bg-[#f7f7f7] text-[#3c3c3c] font-semibold placeholder:text-[#afafaf] placeholder:font-normal focus:outline-none focus:bg-white focus:border-[#1cb0f6] transition-all text-sm"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-3xl border-2 border-[#e5e5e5] p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#eaf7ff] rounded-xl flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-[#1cb0f6]" />
            </div>
            <h3 className="text-lg font-black text-[#3c3c3c]">채용공고 등록</h3>
          </div>
          <button type="button" onClick={onClose} className="text-[#afafaf] hover:text-[#3c3c3c]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-[#3c3c3c] block mb-1">회사명 *</label>
              <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="카카오" className={inputClass} />
            </div>
            <div>
              <label className="text-xs font-bold text-[#3c3c3c] block mb-1">근무지</label>
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="판교 / 원격" className={inputClass} />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#3c3c3c] block mb-1">채용 포지션 *</label>
            <input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="백엔드 개발자 (Java) 신입" className={inputClass} />
          </div>

          <div>
            <label className="text-xs font-bold text-[#3c3c3c] block mb-1">주요 업무 및 설명</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="주요 업무를 입력하세요..." rows={4} className={`${inputClass} resize-none`} />
          </div>

          <div>
            <label className="text-xs font-bold text-[#3c3c3c] block mb-1">자격요건 / 우대사항</label>
            <textarea value={requirements} onChange={(e) => setRequirements(e.target.value)} placeholder="Java, Spring Boot 기본 이해 / 전공 우대..." rows={2} className={`${inputClass} resize-none`} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-[#3c3c3c] block mb-1">지원 마감일 *</label>
              <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="text-xs font-bold text-[#3c3c3c] block mb-1">지원 링크</label>
              <input value={applyUrl} onChange={(e) => setApplyUrl(e.target.value)} placeholder="https://..." className={inputClass} />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#3c3c3c] block mb-1">태그 (쉼표로 구분)</label>
            <input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="Java, Spring Boot, 신입, 백엔드" className={inputClass} />
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <div
              onClick={() => setPinned(!pinned)}
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                pinned ? "bg-[#1cb0f6] border-[#1cb0f6]" : "border-[#e5e5e5]"
              }`}
            >
              {pinned && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
            </div>
            <span className="text-sm font-bold text-[#3c3c3c]">추천 공고로 설정</span>
            <Sparkles className="w-4 h-4 text-[#1cb0f6]" />
          </label>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-2xl font-bold text-[#777] bg-[#f7f7f7] hover:bg-[#e5e5e5] transition-all">
              취소
            </button>
            <button
              type="submit"
              disabled={!company.trim() || !position.trim() || !deadline}
              className="flex-1 py-3 rounded-2xl font-bold text-white bg-[#1cb0f6] border-b-4 border-[#1499d6] hover:bg-[#1cb0f6]/90 active:border-b-0 transition-all disabled:opacity-60"
            >
              등록하기
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── 메인 페이지 ────────────────────────────────────────────
export default function CareerPage() {
  const [role,     setRole]     = useState<UserRole>("student")
  const [loading,  setLoading]  = useState(true)
  const [jobs,     setJobs]     = useState<JobPosting[]>([])
  const [showForm, setShowForm] = useState(false)
  const [filter,   setFilter]   = useState<"all" | "active">("active")

  useEffect(() => {
    const supabase = getSupabaseBrowser()
    supabase.auth.getUser().then(({ data }: { data: { user: import("@supabase/supabase-js").User | null } }) => {
      const user = data.user
      if (user) setRole(getRoleFromUser(user))

      const saved: JobPosting[] = JSON.parse(localStorage.getItem("eduvibe_jobs_v1") ?? "null") ?? SAMPLE_JOBS
      setJobs(saved)
      setLoading(false)
    })
  }, [])

  const handleDelete = (id: string) => {
    setJobs((prev) => {
      const updated = prev.filter((j) => j.id !== id)
      localStorage.setItem("eduvibe_jobs_v1", JSON.stringify(updated))
      return updated
    })
  }

  const handleSubmit = (data: Omit<JobPosting, "id" | "createdAt" | "author">) => {
    const newJob: JobPosting = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      author: "관리자",
    }
    setJobs((prev) => {
      const updated = data.pinned ? [newJob, ...prev] : [...prev, newJob]
      localStorage.setItem("eduvibe_jobs_v1", JSON.stringify(updated))
      return updated
    })
    setShowForm(false)
  }

  const now = new Date()
  const sorted = [...jobs].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
  const filtered = filter === "active" ? sorted.filter((j) => new Date(j.deadline) >= now) : sorted

  const activeCount = jobs.filter((j) => new Date(j.deadline) >= now).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#58cc02]" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-black text-[#3c3c3c]">취업정보</h1>
        {role === "instructor" && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#1cb0f6] text-white font-bold rounded-2xl border-b-4 border-[#1499d6] hover:bg-[#1cb0f6]/90 active:border-b-0 transition-all text-sm"
          >
            <Plus className="w-4 h-4" />
            공고 등록
          </button>
        )}
      </div>
      <p className="text-[#777] font-semibold mb-6">
        현재 {activeCount}개의 채용공고가 진행 중이에요
      </p>

      {/* 요약 배너 */}
      <div className="bg-gradient-to-r from-[#1cb0f6] to-[#1899d6] rounded-2xl p-5 mb-6 flex items-center gap-4">
        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
          <Briefcase className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="text-white/80 text-sm font-semibold">취업의 문이 열려있어요 🎯</p>
          <p className="text-white font-black">지금 바로 도전해보세요!</p>
          <p className="text-white/70 text-xs font-semibold mt-0.5">관리자가 엄선한 {jobs.length}개 채용 기회</p>
        </div>
      </div>

      {/* 필터 탭 */}
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setFilter("active")}
          className={`px-4 py-2 rounded-2xl font-bold text-sm transition-all ${
            filter === "active" ? "bg-[#1cb0f6] text-white" : "bg-[#f7f7f7] text-[#777] hover:bg-[#e5e5e5]"
          }`}
        >
          진행 중 ({activeCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-2xl font-bold text-sm transition-all ${
            filter === "all" ? "bg-[#1cb0f6] text-white" : "bg-[#f7f7f7] text-[#777] hover:bg-[#e5e5e5]"
          }`}
        >
          전체 ({jobs.length})
        </button>
      </div>

      {/* 공고 목록 */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-[#f7f7f7] rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Briefcase className="w-8 h-8 text-[#e5e5e5]" />
          </div>
          <p className="text-[#afafaf] font-bold">현재 진행 중인 채용공고가 없어요.</p>
          <p className="text-[#afafaf] text-sm font-semibold mt-1">전체 보기로 마감된 공고도 확인할 수 있어요.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              isInstructor={role === "instructor"}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* 강사 안내 */}
      {role === "instructor" && (
        <div className="mt-8 bg-[#f0fff0] border-2 border-[#58cc02]/30 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-[#58cc02]" />
            <p className="text-sm font-bold text-[#58cc02]">강사 안내</p>
          </div>
          <p className="text-xs text-[#777] font-semibold">
            학생들이 볼 수 있는 취업공고를 등록하세요. 등록된 공고는 모든 학생의 취업정보 페이지에 표시됩니다.
          </p>
        </div>
      )}

      {/* 학생 안내 */}
      {role === "student" && (
        <div className="mt-8 bg-[#eaf7ff] border-2 border-[#1cb0f6]/30 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <CalendarDays className="w-4 h-4 text-[#1cb0f6]" />
            <p className="text-sm font-bold text-[#1cb0f6]">학습 연계 TIP</p>
          </div>
          <p className="text-xs text-[#777] font-semibold">
            채용 요건의 기술 스택을 확인하고, 배우기·퀘스트 메뉴에서 관련 내용을 먼저 공부해보세요!
          </p>
        </div>
      )}

      {/* 폼 모달 */}
      {showForm && (
        <JobForm
          onClose={() => setShowForm(false)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  )
}
