"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react"
import { getSupabaseBrowser } from "@/lib/supabase-browser"

interface FormData {
  authKey: string
  fullName: string
  username: string
  password: string
  emailLocal: string
  emailDomain: string
  phone: string
}

interface FormErrors {
  authKey?: string
  fullName?: string
  username?: string
  password?: string
  email?: string
  phone?: string
}

// 비밀번호 강도 체크
function checkPassword(pw: string) {
  return {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    number: /[0-9]/.test(pw),
  }
}

export default function SignupPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    authKey: "",
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

  const pwCheck = checkPassword(formData.password)
  const pwValid = Object.values(pwCheck).every(Boolean)

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData((prev) => ({ ...prev, [field]: e.target.value }))

  const validateForm = (): boolean => {
    const errs: FormErrors = {}

    if (!formData.authKey.trim()) errs.authKey = "학원 인증키를 입력해주세요."

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    setServerError(null)

    const email = `${formData.emailLocal}@${formData.emailDomain}`
    const supabase = getSupabaseBrowser()

    const { error } = await supabase.auth.signUp({
      email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.fullName,
          username: formData.username,
          phone: formData.phone,
          auth_key: formData.authKey,
          role: "student",
        },
      },
    })

    if (error) {
      setServerError(
        error.message.includes("already registered")
          ? "이미 가입된 이메일이에요. 로그인해 주세요."
          : "가입 중 오류가 발생했어요. 잠시 후 다시 시도해주세요."
      )
      setIsSubmitting(false)
      return
    }

    router.push("/dashboard")
    router.refresh()
  }

  return (
    <main className="min-h-screen bg-[#f7f7f7] flex flex-col items-center justify-center p-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-black text-[#58cc02]">
              EduVibe<span className="text-[#1cb0f6]">-AI</span>
            </h1>
          </Link>
          <p className="text-[#777] mt-2 font-semibold">계정 만들기</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-8 border-2 border-[#e5e5e5] space-y-4">

          {serverError && <ErrorTooltip message={serverError} />}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* 학원 인증키 */}
            <Field label="학원 인증키" error={errors.authKey}>
              <input
                type="text"
                placeholder="학원에서 발급받은 인증키"
                value={formData.authKey}
                onChange={set("authKey")}
                className={inputClass(!!errors.authKey)}
              />
            </Field>

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
            <Field label="아이디" error={errors.username} hint="영문·숫자만 / 20자 이내">
              <div className="relative">
                <input
                  type="text"
                  placeholder="영문, 숫자 조합 (20자 이내)"
                  value={formData.username}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 20)
                    setFormData((p) => ({ ...p, username: v }))
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
              {/* 비밀번호 강도 표시 */}
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
                  placeholder="주소 (예: gmail.com)"
                  value={formData.emailDomain}
                  onChange={set("emailDomain")}
                  className={`${inputClass(!!errors.email)} flex-1`}
                />
              </div>
            </Field>

            {/* 휴대폰 번호 */}
            <Field label="휴대폰 번호" error={errors.phone}>
              <input
                type="tel"
                placeholder="01012345678 (- 없이 입력)"
                value={formData.phone}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^0-9-]/g, "")
                  setFormData((p) => ({ ...p, phone: v }))
                }}
                className={inputClass(!!errors.phone)}
              />
            </Field>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-4 rounded-2xl font-bold text-lg text-white bg-[#58cc02] border-b-4 border-[#46a302] hover:bg-[#58cc02]/90 active:border-b-0 active:mt-1 transition-all duration-200 mt-2 ${isSubmitting ? "opacity-70" : ""}`}
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
                "계정 만들기"
              )}
            </button>
          </form>
        </div>

        {/* Login Link */}
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

// ── 재사용 컴포넌트 ──────────────────────────────────

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string
  error?: string
  hint?: string
  children: React.ReactNode
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
