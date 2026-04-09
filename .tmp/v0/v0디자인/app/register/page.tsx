"use client"

import { useState } from "react"
import Link from "next/link"
import { User, School, Eye, EyeOff, AlertCircle } from "lucide-react"

type Role = "student" | "instructor" | null

interface FormErrors {
  fullName?: string
  email?: string
  password?: string
}

export default function RegisterPage() {
  const [selectedRole, setSelectedRole] = useState<Role>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  })
  const [errors, setErrors] = useState<FormErrors>({})
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

    if (!selectedRole) {
      return
    }

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    // 실제 회원가입 로직은 여기에 구현
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSubmitting(false)
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
