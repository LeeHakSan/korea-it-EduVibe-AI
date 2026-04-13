"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, AlertCircle, CheckCircle2, BookOpen, Users, Loader2 } from "lucide-react"
import { getSupabaseBrowser } from "@/lib/supabase-browser"
import { getRedirectPathForRole, type UserRole } from "@/lib/auth"

// ── 타입 ──────────────────────────────────────────────────────
interface CodeInfo {
  valid: boolean
  type?: "teacher" | "student"
  courseName?: string
  instructorName?: string
  preAuthKey?: string   // 강사용: 미리 생성된 auth_key
  courseCode?: string   // 학생용: 강사의 auth_key
  adminId?: string
  error?: string
}

interface FormData {
  inviteCode: string
  fullName: string
  username: string
  password: string
  emailLocal: string
  emailDomain: string
  phone: string
}

interface FormErrors {
  inviteCode?: string
  fullName?: string
  username?: string
  password?: string
  email?: string
  phone?: string
}

function checkPassword(pw: string) {
  return {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    number: /[0-9]/.test(pw),
  }
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────
export default function SignupPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>({
    inviteCode: "",
    fullName: "",
    username: "",
    password: "",
    emailLocal: "",
    emailDomain: "",
    phone: "",
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // 코드 검증 상태
  const [codeInfo, setCodeInfo] = useState<CodeInfo | null>(null)
  const [validating, setValidating] = useState(false)
  const codeTimer = useRef<NodeJS.Timeout | null>(null)

  const pwCheck = checkPassword(formData.password)
  const pwValid = Object.values(pwCheck).every(Boolean)

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData((prev) => ({ ...prev, [field]: e.target.value }))

  // ── 코드 자동 검증 (디바운스 500ms) ──────────────────────────
  useEffect(() => {
    const raw = formData.inviteCode.trim().toUpperCase()
    setFormData(p => ({ ...p, inviteCode: raw }))

    if (raw.length !== 6 && raw.length !== 8) {
      setCodeInfo(null)
      return
    }

    if (codeTimer.current) clearTimeout(codeTimer.current)
    codeTimer.current = setTimeout(async () => {
      setValidating(true)
      try {
        const res = await fetch(`/api/code/validate?code=${encodeURIComponent(raw)}`)
        const json: CodeInfo = await res.json()
        setCodeInfo(json)
        if (!json.valid) {
          const defaultMsg = raw.length === 8
            ? "유효하지 않은 8자리 초대코드예요."
            : "유효하지 않은 6자리 과정코드예요."
          setErrors(p => ({ ...p, inviteCode: json.error ?? defaultMsg }))
        } else {
          setErrors(p => ({ ...p, inviteCode: undefined }))
        }
      } catch {
        setCodeInfo({ valid: false, error: "코드 확인 중 오류가 발생했어요." })
      } finally { setValidating(false) }
    }, 500)

    return () => { if (codeTimer.current) clearTimeout(codeTimer.current) }
  }, [formData.inviteCode]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── 폼 검증 ───────────────────────────────────────────────────
  const validateForm = (): boolean => {
    const errs: FormErrors = {}

    if (!codeInfo?.valid) errs.inviteCode = "유효한 코드(강사 8자리 / 학생 6자리)를 입력해주세요."

    if (!formData.fullName.trim()) errs.fullName = "이름을 입력해주세요."

    if (!formData.username.trim()) {
      errs.username = "아이디를 입력해주세요."
    } else if (!/^[a-zA-Z0-9]+$/.test(formData.username)) {
      errs.username = "아이디는 영문과 숫자만 사용할 수 있어요."
    } else if (formData.username.length > 20) {
      errs.username = "아이디는 20자 이내로 입력해주세요."
    }

    if (!pwValid) errs.password = "비밀번호 조건을 모두 충족해주세요."

    if (!formData.emailLocal.trim() || !formData.emailDomain.trim()) {
      errs.email = "이메일을 모두 입력해주세요."
    } else if (!/^[^\s@]+$/.test(formData.emailLocal) || !/^[^\s@]+\.[^\s@]+$/.test(formData.emailDomain)) {
      errs.email = "올바른 이메일 형식이 아니에요."
    }

    if (!formData.phone.trim()) {
      errs.phone = "휴대폰 번호를 입력해주세요."
    } else if (!/^01[0-9]{8,9}$/.test(formData.phone.replace(/-/g, ""))) {
      errs.phone = "올바른 휴대폰 번호를 입력해주세요. (예: 01012345678)"
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  // ── 회원가입 제출 ─────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm() || !codeInfo?.valid) return

    setIsSubmitting(true)
    setServerError(null)

    const email = `${formData.emailLocal}@${formData.emailDomain}`
    const role: UserRole = codeInfo.type === "teacher" ? "teacher" : "student"

    // ── 서버사이드 API로 계정 생성 (Admin SDK → 이메일 인증 없이 바로 활성화) ──
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password: formData.password,
        fullName: formData.fullName,
        username: formData.username,
        phone: formData.phone,
        inviteCode: formData.inviteCode,
        role,
        courseName: codeInfo.courseName ?? "",
        authKey: codeInfo.preAuthKey,    // 강사용
        courseCode: codeInfo.courseCode,  // 학생용
        adminId: codeInfo.adminId,
      }),
    })

    const json = await res.json() as { ok?: boolean; error?: string }

    if (!res.ok || json.error) {
      setServerError(json.error ?? "가입 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.")
      setIsSubmitting(false)
      return
    }

    // ── 생성된 계정으로 자동 로그인 ──────────────────────────────
    const supabase = getSupabaseBrowser()
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password: formData.password })

    if (signInErr) {
      // 가입은 됐지만 자동 로그인 실패 → 로그인 페이지로 안내
      router.push("/login?signup=done")
      return
    }

    router.push(getRedirectPathForRole(role))
    router.refresh()
  }

  // ── 역할 배지 ─────────────────────────────────────────────────
  const RoleBadge = () => {
    if (!codeInfo?.valid || !codeInfo.type) return null
    const isInstructor = codeInfo.type === "teacher"
    return (
      <div className={`flex items-center gap-3 p-3 rounded-2xl border-2 ${
        isInstructor ? "bg-green-50 border-green-200" : "bg-blue-50 border-blue-200"
      }`}>
        {isInstructor ? <BookOpen className="w-5 h-5 text-[#58cc02] shrink-0" /> : <Users className="w-5 h-5 text-[#1cb0f6] shrink-0" />}
        <div>
          <p className={`font-black text-sm ${isInstructor ? "text-[#58cc02]" : "text-[#1cb0f6]"}`}>
            {isInstructor ? "강사 코드 확인됨" : "수강생 코드 확인됨"}
          </p>
          <p className="text-xs text-[#777] font-semibold">
            {codeInfo.courseName}{isInstructor && codeInfo.instructorName ? ` · ${codeInfo.instructorName}` : ""}
          </p>
        </div>
        <CheckCircle2 className={`w-5 h-5 ml-auto ${isInstructor ? "text-[#58cc02]" : "text-[#1cb0f6]"}`} />
      </div>
    )
  }

  const accentColor = codeInfo?.type === "teacher" ? "#58cc02"
    : codeInfo?.type === "student" ? "#1cb0f6"
    : "#58cc02"

  return (
    <main className="min-h-screen bg-[#f7f7f7] flex flex-col items-center justify-center p-4 py-12">
      <div className="w-full max-w-md">
        {/* 로고 */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-black text-[#58cc02]">
              EduVibe<span className="text-[#1cb0f6]">-AI</span>
            </h1>
          </Link>
          <p className="text-[#777] mt-2 font-semibold">초대코드로 계정을 만들어요</p>
        </div>

        <div className="bg-white rounded-3xl p-8 border-2 border-[#e5e5e5] space-y-5">
          {serverError && <ErrorTooltip message={serverError} />}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* ── 초대코드 입력 ── */}
            <Field label="코드 (강사 8자리 / 학생 6자리)" error={errors.inviteCode}>
              <div className="relative">
                <input
                  type="text"
                  placeholder="강사 8자리 초대코드 또는 학생 6자리 과정코드"
                  value={formData.inviteCode}
                  onChange={(e) => {
                    const v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8)
                    setFormData(p => ({ ...p, inviteCode: v }))
                  }}
                  maxLength={8}
                  className={`w-full px-4 py-3.5 rounded-2xl border-2 bg-[#f7f7f7] font-black tracking-widest text-center text-lg placeholder:text-[#afafaf] placeholder:font-normal placeholder:tracking-normal focus:outline-none focus:bg-white transition-all ${
                    errors.inviteCode ? "border-[#ff4b4b] focus:border-[#ff4b4b]"
                    : codeInfo?.valid ? "border-[#58cc02] focus:border-[#58cc02]"
                    : "border-transparent focus:border-[#1cb0f6]"
                  }`}
                />
                {validating && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#afafaf]" />
                  </div>
                )}
                {codeInfo?.valid && !validating && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <CheckCircle2 className="w-4 h-4 text-[#58cc02]" />
                  </div>
                )}
              </div>
              {/* 역할 배지 */}
              {codeInfo?.valid && <RoleBadge />}
            </Field>

            {/* 코드가 유효해야 나머지 폼 보임 */}
            {codeInfo?.valid && (
              <>
                {/* 이름 */}
                <Field label="이름" error={errors.fullName}>
                  <input
                    type="text"
                    placeholder="실명을 입력해주세요"
                    value={formData.fullName}
                    onChange={set("fullName")}
                    className={inputClass(!!errors.fullName)}
                  />
                </Field>

                {/* 아이디 */}
                <Field label="아이디" error={errors.username} hint="영문·숫자 / 20자 이내">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="영문, 숫자 조합 (20자 이내)"
                      value={formData.username}
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 20)
                        setFormData(p => ({ ...p, username: v }))
                      }}
                      maxLength={20}
                      className={inputClass(!!errors.username)}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#afafaf] font-semibold">
                      {formData.username.length}/20
                    </span>
                  </div>
                </Field>

                {/* 비밀번호 */}
                <Field label="비밀번호" error={errors.password}>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="영어 대·소문자 + 숫자 포함, 8자 이상"
                      value={formData.password}
                      onChange={set("password")}
                      className={inputClass(!!errors.password)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#afafaf] hover:text-[#777]"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {formData.password.length > 0 && (
                    <div className="mt-2 grid grid-cols-2 gap-1">
                      <PwRule ok={pwCheck.length} label="8자 이상" />
                      <PwRule ok={pwCheck.upper} label="대문자 포함" />
                      <PwRule ok={pwCheck.lower} label="소문자 포함" />
                      <PwRule ok={pwCheck.number} label="숫자 포함" />
                    </div>
                  )}
                </Field>

                {/* 이메일 */}
                <Field label="이메일" error={errors.email}>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="아이디"
                      value={formData.emailLocal}
                      onChange={set("emailLocal")}
                      className={`${inputClass(!!errors.email)} flex-1`}
                    />
                    <span className="text-[#3c3c3c] font-bold text-lg">@</span>
                    <input
                      type="text"
                      placeholder="gmail.com"
                      value={formData.emailDomain}
                      onChange={set("emailDomain")}
                      className={`${inputClass(!!errors.email)} flex-1`}
                    />
                  </div>
                </Field>

                {/* 휴대폰 */}
                <Field label="휴대폰 번호" error={errors.phone}>
                  <input
                    type="tel"
                    placeholder="01012345678"
                    value={formData.phone}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^0-9-]/g, "")
                      setFormData(p => ({ ...p, phone: v }))
                    }}
                    className={inputClass(!!errors.phone)}
                  />
                </Field>

                {/* 제출 */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-2xl font-bold text-lg text-white border-b-4 hover:opacity-90 active:border-b-0 active:mt-1 transition-all duration-200 mt-2 disabled:opacity-70"
                  style={{
                    backgroundColor: accentColor,
                    borderColor: codeInfo?.type === "teacher" ? "#46a302"
                      : codeInfo?.type === "student" ? "#0e8ecf"
                      : "#46a302",
                  }}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      가입 중...
                    </span>
                  ) : (
                    `${codeInfo?.type === "teacher" ? "강사" : "수강생"}으로 가입하기`
                  )}
                </button>
              </>
            )}

            {/* 코드 미입력 안내 */}
            {!codeInfo?.valid && (
              <div className="text-center py-6 text-[#afafaf]">
                <p className="font-semibold text-sm">강사 8자리 초대코드 또는 학생 6자리 과정코드를 입력하면</p>
                <p className="font-semibold text-sm">가입 양식이 나타납니다</p>
              </div>
            )}
          </form>
        </div>

        <p className="text-center mt-6 text-[#777] font-semibold">
          이미 계정이 있나요?{" "}
          <Link href="/login" className="text-[#1cb0f6] hover:underline font-bold">
            로그인
          </Link>
        </p>
      </div>
    </main>
  )
}

// ── 재사용 컴포넌트 ──────────────────────────────────────────────
function Field({ label, error, hint, children }: {
  label: string; error?: string; hint?: string; children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-bold text-[#3c3c3c]">{label}</label>
        {hint && <span className="text-xs text-[#afafaf] font-semibold">{hint}</span>}
      </div>
      {children}
      {error && <ErrorTooltip message={error} />}
    </div>
  )
}

function PwRule({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-1.5 text-xs font-semibold ${ok ? "text-[#58cc02]" : "text-[#afafaf]"}`}>
      <CheckCircle2 className={`w-3.5 h-3.5 ${ok ? "text-[#58cc02]" : "text-[#e5e5e5]"}`} />
      {label}
    </div>
  )
}

function ErrorTooltip({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 px-3 py-2 bg-[#fff0f0] rounded-xl border border-[#ff4b4b]/20">
      <AlertCircle className="w-4 h-4 text-[#ff4b4b] shrink-0 mt-0.5" />
      <p className="text-[#ff4b4b] text-xs font-semibold">{message}</p>
    </div>
  )
}

function inputClass(hasError: boolean) {
  return `w-full px-4 py-3.5 rounded-2xl border-2 bg-[#f7f7f7] text-[#3c3c3c] font-semibold placeholder:text-[#afafaf] placeholder:font-normal focus:outline-none focus:bg-white transition-all text-sm ${
    hasError ? "border-[#ff4b4b] focus:border-[#ff4b4b]" : "border-transparent focus:border-[#1cb0f6]"
  }`
}
