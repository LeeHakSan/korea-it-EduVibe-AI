"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { User, School, Eye, EyeOff, AlertCircle } from "lucide-react"
import { getSupabaseBrowser } from "@/lib/supabase-browser"

type Role = "student" | "instructor" | null

interface FormErrors {
  fullName?: string
  email?: string
  password?: string
}

export default function RegisterPage() {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<Role>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.fullName.trim()) {
      newErrors.fullName = "이름을 입력해주세요!"
    }

    if (!formData.email.trim()) {
      newErrors.email = "이메일을 입력해주세요!"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "이런! 이메일 형식이 조금 이상해요"
    }

    if (!formData.password) {
      newErrors.password = "비밀번호를 입력해주세요!"
    } else if (formData.password.length < 6) {
      newErrors.password = "비밀번호는 최소 6자 이상이어야 해요"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRole || !validateForm()) return

    setIsSubmitting(true)
    setServerError(null)

    const supabase = getSupabaseBrowser()
    const { error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        // user_metadata 에 role 과 이름을 저장 → profiles 트리거에서 읽어감
        data: {
          full_name: formData.fullName,
          role: selectedRole,
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

    // 이메일 인증이 필요한 경우 안내, 바로 대시보드로 이동
    router.push("/dashboard")
    router.refresh()
  }

  const handleGoogleSignup = async () => {
    if (!selectedRole) return
    const supabase = getSupabaseBrowser()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // state 를 통해 역할 전달 (콜백에서 profiles 업데이트)
        redirectTo: `${window.location.origin}/auth/callback?role=${selectedRole}`,
      },
    })
    if (error) {
      setServerError("Google 가입에 실패했어요. 잠시 후 다시 시도해주세요.")
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f7f7] flex flex-col items-center justify-center p-4">
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

        {/* Role Selection */}
        <div className="mb-6">
          <p className="text-center text-[#3c3c3c] font-bold mb-4">
            당신은 누구인가요?
          </p>
          <div className="grid grid-cols-2 gap-4">
            {/* Student Card */}
            <button
              type="button"
              onClick={() => setSelectedRole("student")}
              className={`relative p-6 rounded-2xl border-2 bg-white transition-all duration-200 hover:scale-[1.02] ${
                selectedRole === "student"
                  ? "border-[#1cb0f6] border-[3px] scale-[1.02] shadow-lg"
                  : "border-[#e5e5e5] hover:border-[#1cb0f6]/50"
              }`}
            >
              <div
                className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3 ${
                  selectedRole === "student"
                    ? "bg-[#1cb0f6]"
                    : "bg-[#1cb0f6]/10"
                }`}
              >
                <User
                  className={`w-8 h-8 ${
                    selectedRole === "student"
                      ? "text-white"
                      : "text-[#1cb0f6]"
                  }`}
                />
              </div>
              <p
                className={`font-bold text-center ${
                  selectedRole === "student"
                    ? "text-[#1cb0f6]"
                    : "text-[#3c3c3c]"
                }`}
              >
                학생이에요
              </p>
              {selectedRole === "student" && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#1cb0f6] rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
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
                </div>
              )}
            </button>

            {/* Instructor Card */}
            <button
              type="button"
              onClick={() => setSelectedRole("instructor")}
              className={`relative p-6 rounded-2xl border-2 bg-white transition-all duration-200 hover:scale-[1.02] ${
                selectedRole === "instructor"
                  ? "border-[#58cc02] border-[3px] scale-[1.02] shadow-lg"
                  : "border-[#e5e5e5] hover:border-[#58cc02]/50"
              }`}
            >
              <div
                className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3 ${
                  selectedRole === "instructor"
                    ? "bg-[#58cc02]"
                    : "bg-[#58cc02]/10"
                }`}
              >
                <School
                  className={`w-8 h-8 ${
                    selectedRole === "instructor"
                      ? "text-white"
                      : "text-[#58cc02]"
                  }`}
                />
              </div>
              <p
                className={`font-bold text-center ${
                  selectedRole === "instructor"
                    ? "text-[#58cc02]"
                    : "text-[#3c3c3c]"
                }`}
              >
                강사예요
              </p>
              {selectedRole === "instructor" && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#58cc02] rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
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
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Server Error */}
        {serverError && <ErrorTooltip message={serverError} />}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-2">
            <div className="relative">
              <input
                type="text"
                placeholder="이름"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                className={`w-full px-5 py-4 rounded-2xl border-2 bg-white text-[#3c3c3c] font-semibold placeholder:text-[#afafaf] focus:outline-none transition-all ${
                  errors.fullName
                    ? "border-[#ff4b4b] focus:border-[#ff4b4b]"
                    : "border-[#e5e5e5] focus:border-[#1cb0f6]"
                }`}
              />
            </div>
            {errors.fullName && (
              <ErrorTooltip message={errors.fullName} />
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <div className="relative">
              <input
                type="email"
                placeholder="이메일"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className={`w-full px-5 py-4 rounded-2xl border-2 bg-white text-[#3c3c3c] font-semibold placeholder:text-[#afafaf] focus:outline-none transition-all ${
                  errors.email
                    ? "border-[#ff4b4b] focus:border-[#ff4b4b]"
                    : "border-[#e5e5e5] focus:border-[#1cb0f6]"
                }`}
              />
            </div>
            {errors.email && <ErrorTooltip message={errors.email} />}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="비밀번호"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className={`w-full px-5 py-4 pr-14 rounded-2xl border-2 bg-white text-[#3c3c3c] font-semibold placeholder:text-[#afafaf] focus:outline-none transition-all ${
                  errors.password
                    ? "border-[#ff4b4b] focus:border-[#ff4b4b]"
                    : "border-[#e5e5e5] focus:border-[#1cb0f6]"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#afafaf] hover:text-[#777]"
              >
                {showPassword ? (
                  <EyeOff className="w-6 h-6" />
                ) : (
                  <Eye className="w-6 h-6" />
                )}
              </button>
            </div>
            {errors.password && (
              <ErrorTooltip message={errors.password} />
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!selectedRole || isSubmitting}
            className={`w-full py-4 rounded-2xl font-bold text-lg text-white transition-all duration-200 ${
              selectedRole
                ? selectedRole === "student"
                  ? "bg-[#1cb0f6] border-b-4 border-[#1899d6] hover:bg-[#1cb0f6]/90 active:border-b-0 active:mt-1"
                  : "bg-[#58cc02] border-b-4 border-[#46a302] hover:bg-[#58cc02]/90 active:border-b-0 active:mt-1"
                : "bg-[#e5e5e5] cursor-not-allowed"
            } ${isSubmitting ? "opacity-70" : ""}`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                가입 중...
              </span>
            ) : (
              "계정 만들기"
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-[2px] bg-[#e5e5e5]" />
          <span className="text-[#afafaf] font-semibold text-sm">또는</span>
          <div className="flex-1 h-[2px] bg-[#e5e5e5]" />
        </div>

        {/* Google Signup */}
        <button
          type="button"
          onClick={handleGoogleSignup}
          disabled={!selectedRole}
          title={!selectedRole ? "먼저 역할을 선택해주세요" : ""}
          className={`w-full py-4 rounded-2xl font-bold text-[#3c3c3c] bg-white border-2 border-[#e5e5e5] shadow-[0_2px_0_0_#e5e5e5] hover:bg-[#f7f7f7] active:shadow-none active:translate-y-[2px] transition-all duration-200 flex items-center justify-center gap-3 ${
            !selectedRole ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Google로 계속하기
        </button>

        {/* Login Link */}
        <p className="text-center mt-6 text-[#777] font-semibold">
          이미 계정이 있나요?{" "}
          <Link
            href="/login"
            className="text-[#1cb0f6] hover:underline font-bold"
          >
            로그인
          </Link>
        </p>
      </div>
    </main>
  )
}

// Error Tooltip Component (Duolingo-style)
function ErrorTooltip({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 px-3 py-2 bg-[#fff0f0] rounded-xl border border-[#ff4b4b]/20 animate-in slide-in-from-top-1 duration-200">
      <AlertCircle className="w-5 h-5 text-[#ff4b4b] flex-shrink-0 mt-0.5" />
      <p className="text-[#ff4b4b] text-sm font-semibold">{message}</p>
    </div>
  )
}
