"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, AlertCircle } from "lucide-react"
import { getSupabaseBrowser } from "@/lib/supabase-browser"

interface FormErrors {
  email?: string
  password?: string
}

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.email.trim()) {
      newErrors.email = "이메일을 입력해주세요!"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "이런! 이메일 형식이 조금 이상해요"
    }

    if (!formData.password) {
      newErrors.password = "비밀번호를 입력해주세요!"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    setServerError(null)

    const supabase = getSupabaseBrowser()
    const { error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    })

    if (error) {
      setServerError("이메일 또는 비밀번호가 올바르지 않아요.")
      setIsSubmitting(false)
      return
    }

    // 로그인 성공 → 대시보드로 이동 (역할 분기는 /dashboard 에서 처리)
    router.push("/dashboard")
    router.refresh()
  }

  const handleGoogleLogin = async () => {
    const supabase = getSupabaseBrowser()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setServerError("Google 로그인에 실패했어요. 잠시 후 다시 시도해주세요.")
    }
  }

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-block">
            <h1 className="text-4xl font-black text-[#58cc02]">
              EduVibe<span className="text-[#1cb0f6]">-AI</span>
            </h1>
          </Link>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl p-8 border-2 border-[#e5e5e5]">
          <h2 className="text-2xl font-bold text-[#3c3c3c] text-center mb-6">
            다시 만나서 반가워요!
          </h2>

          {/* Server Error */}
          {serverError && <ErrorTooltip message={serverError} />}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-2">
              <input
                type="email"
                placeholder="이메일"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className={`w-full px-5 py-4 rounded-2xl border-2 bg-[#f7f7f7] text-[#3c3c3c] font-semibold placeholder:text-[#afafaf] focus:outline-none focus:bg-white transition-all ${
                  errors.email
                    ? "border-[#ff4b4b] focus:border-[#ff4b4b]"
                    : "border-transparent focus:border-[#1cb0f6]"
                }`}
              />
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
                  className={`w-full px-5 py-4 pr-14 rounded-2xl border-2 bg-[#f7f7f7] text-[#3c3c3c] font-semibold placeholder:text-[#afafaf] focus:outline-none focus:bg-white transition-all ${
                    errors.password
                      ? "border-[#ff4b4b] focus:border-[#ff4b4b]"
                      : "border-transparent focus:border-[#1cb0f6]"
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
              {errors.password && <ErrorTooltip message={errors.password} />}
            </div>

            {/* Forgot Password */}
            <div className="text-right">
              <Link
                href="/forgot-password"
                className="text-[#1cb0f6] text-sm font-bold hover:underline"
              >
                비밀번호를 잊으셨나요?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-4 rounded-2xl font-bold text-lg text-white bg-[#58cc02] border-b-4 border-[#46a302] transition-all duration-200 hover:bg-[#58cc02]/90 active:border-b-0 active:mt-1 ${
                isSubmitting ? "opacity-70" : ""
              }`}
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
                  로그인 중...
                </span>
              ) : (
                "로그인"
              )}
            </button>
          </form>

        </div>

        {/* Register Link */}
        <p className="text-center mt-8 text-[#777] font-semibold">
          EduVibe가 처음이신가요?{" "}
          <Link
            href="/signup"
            className="text-[#58cc02] hover:underline font-bold"
          >
            계정 만들기
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
