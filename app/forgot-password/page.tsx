"use client"

import { useState } from "react"
import Link from "next/link"
import { Eye, EyeOff, AlertCircle, CheckCircle2, KeyRound } from "lucide-react"

type Step = "verify" | "reset" | "done"

function checkPassword(pw: string) {
  return {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    number: /[0-9]/.test(pw),
  }
}

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("verify")
  const [authKey, setAuthKey] = useState("")
  const [authKeyError, setAuthKeyError] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)

  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pwError, setPwError] = useState<string | null>(null)
  const [isResetting, setIsResetting] = useState(false)

  const pwCheck = checkPassword(newPassword)
  const pwValid = Object.values(pwCheck).every(Boolean)

  // ── Step 1: 인증키 확인 ─────────────────────────
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!authKey.trim()) {
      setAuthKeyError("학원 인증키를 입력해주세요.")
      return
    }
    setAuthKeyError(null)
    setIsVerifying(true)

    // TODO: 실제 인증키 검증 API 연동
    // 현재는 임시로 1초 후 통과 처리
    await new Promise((r) => setTimeout(r, 1000))
    setIsVerifying(false)
    setStep("reset")
  }

  // ── Step 2: 새 비밀번호 설정 ────────────────────
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwError(null)

    if (!pwValid) {
      setPwError("비밀번호 조건을 모두 충족해주세요.")
      return
    }
    if (newPassword !== confirmPassword) {
      setPwError("비밀번호가 일치하지 않아요.")
      return
    }

    setIsResetting(true)
    // TODO: 실제 비밀번호 변경 API 연동 (supabase.auth.updateUser)
    await new Promise((r) => setTimeout(r, 1000))
    setIsResetting(false)
    setStep("done")
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
          <p className="text-[#777] mt-2 font-semibold">비밀번호 재설정</p>
        </div>

        <div className="bg-white rounded-3xl p-8 border-2 border-[#e5e5e5]">

          {/* ── Step Indicator ── */}
          <div className="flex items-center gap-2 mb-8">
            <StepDot active={step === "verify"} done={step !== "verify"} label="인증키 확인" />
            <div className={`flex-1 h-[2px] rounded-full transition-colors ${step !== "verify" ? "bg-[#58cc02]" : "bg-[#e5e5e5]"}`} />
            <StepDot active={step === "reset"} done={step === "done"} label="비밀번호 설정" />
            <div className={`flex-1 h-[2px] rounded-full transition-colors ${step === "done" ? "bg-[#58cc02]" : "bg-[#e5e5e5]"}`} />
            <StepDot active={step === "done"} done={false} label="완료" />
          </div>

          {/* ── Step 1: 인증키 입력 ── */}
          {step === "verify" && (
            <form onSubmit={handleVerify} className="space-y-5">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-[#1cb0f6]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <KeyRound className="w-8 h-8 text-[#1cb0f6]" />
                </div>
                <h2 className="text-xl font-bold text-[#3c3c3c]">학원 인증키 확인</h2>
                <p className="text-[#777] text-sm font-semibold mt-1">
                  학원에서 발급받은 인증키를 입력해주세요.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-[#3c3c3c]">학원 인증키</label>
                <input
                  type="text"
                  placeholder="인증키를 입력해주세요"
                  value={authKey}
                  onChange={(e) => setAuthKey(e.target.value)}
                  className={`w-full px-4 py-3.5 rounded-2xl border-2 bg-[#f7f7f7] text-[#3c3c3c] font-semibold placeholder:text-[#afafaf] placeholder:font-normal focus:outline-none focus:bg-white transition-all text-sm ${
                    authKeyError ? "border-[#ff4b4b]" : "border-transparent focus:border-[#1cb0f6]"
                  }`}
                />
                {authKeyError && <ErrorTooltip message={authKeyError} />}
              </div>

              <button
                type="submit"
                disabled={isVerifying}
                className={`w-full py-4 rounded-2xl font-bold text-lg text-white bg-[#1cb0f6] border-b-4 border-[#1899d6] hover:bg-[#1cb0f6]/90 active:border-b-0 active:mt-1 transition-all ${isVerifying ? "opacity-70" : ""}`}
              >
                {isVerifying ? (
                  <span className="flex items-center justify-center gap-2">
                    <Spinner /> 확인 중...
                  </span>
                ) : (
                  "인증키 확인"
                )}
              </button>
            </form>
          )}

          {/* ── Step 2: 새 비밀번호 설정 ── */}
          {step === "reset" && (
            <form onSubmit={handleReset} className="space-y-5">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-[#3c3c3c]">새로운 비밀번호 설정</h2>
                <p className="text-[#777] text-sm font-semibold mt-1">
                  새로운 비밀번호를 입력해주세요.
                </p>
              </div>

              {pwError && <ErrorTooltip message={pwError} />}

              {/* 새 비밀번호 */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-[#3c3c3c]">새로운 비밀번호</label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    placeholder="대·소문자·숫자 포함 8자 이상"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3.5 pr-12 rounded-2xl border-2 border-transparent bg-[#f7f7f7] text-[#3c3c3c] font-semibold placeholder:text-[#afafaf] placeholder:font-normal focus:outline-none focus:bg-white focus:border-[#1cb0f6] transition-all text-sm"
                  />
                  <button type="button" onClick={() => setShowNew(!showNew)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#afafaf] hover:text-[#777]">
                    {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {/* 강도 표시 */}
                {newPassword.length > 0 && (
                  <div className="grid grid-cols-2 gap-1 mt-2">
                    <PwRule ok={pwCheck.length} label="8자 이상" />
                    <PwRule ok={pwCheck.upper} label="대문자 포함" />
                    <PwRule ok={pwCheck.lower} label="소문자 포함" />
                    <PwRule ok={pwCheck.number} label="숫자 포함" />
                  </div>
                )}
              </div>

              {/* 비밀번호 확인 */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-[#3c3c3c]">새로운 비밀번호 확인</label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="비밀번호를 다시 입력해주세요"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full px-4 py-3.5 pr-12 rounded-2xl border-2 bg-[#f7f7f7] text-[#3c3c3c] font-semibold placeholder:text-[#afafaf] placeholder:font-normal focus:outline-none focus:bg-white transition-all text-sm ${
                      confirmPassword && confirmPassword !== newPassword
                        ? "border-[#ff4b4b]"
                        : confirmPassword && confirmPassword === newPassword
                        ? "border-[#58cc02]"
                        : "border-transparent focus:border-[#1cb0f6]"
                    }`}
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#afafaf] hover:text-[#777]">
                    {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {confirmPassword && confirmPassword === newPassword && (
                  <p className="text-[#58cc02] text-xs font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 비밀번호가 일치해요!
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isResetting}
                className={`w-full py-4 rounded-2xl font-bold text-lg text-white bg-[#58cc02] border-b-4 border-[#46a302] hover:bg-[#58cc02]/90 active:border-b-0 active:mt-1 transition-all ${isResetting ? "opacity-70" : ""}`}
              >
                {isResetting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Spinner /> 변경 중...
                  </span>
                ) : (
                  "비밀번호 변경"
                )}
              </button>
            </form>
          )}

          {/* ── Step 3: 완료 ── */}
          {step === "done" && (
            <div className="text-center py-4 space-y-4">
              <div className="w-20 h-20 bg-[#58cc02]/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-[#58cc02]" />
              </div>
              <h2 className="text-xl font-bold text-[#3c3c3c]">비밀번호가 변경됐어요!</h2>
              <p className="text-[#777] text-sm font-semibold">
                새로운 비밀번호로 로그인해 주세요.
              </p>
              <Link
                href="/login"
                className="block w-full py-4 rounded-2xl font-bold text-lg text-white bg-[#58cc02] border-b-4 border-[#46a302] hover:bg-[#58cc02]/90 active:border-b-0 active:mt-1 transition-all text-center"
              >
                로그인하러 가기
              </Link>
            </div>
          )}
        </div>

        {/* Back to login */}
        {step !== "done" && (
          <p className="text-center mt-6 text-[#777] font-semibold">
            <Link href="/login" className="text-[#1cb0f6] hover:underline font-bold">
              ← 로그인으로 돌아가기
            </Link>
          </p>
        )}
      </div>
    </main>
  )
}

// ── 재사용 컴포넌트 ──────────────────────────────────

function StepDot({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-colors ${
        done ? "bg-[#58cc02] text-white" : active ? "bg-[#1cb0f6] text-white" : "bg-[#e5e5e5] text-[#afafaf]"
      }`}>
        {done ? <CheckCircle2 className="w-4 h-4" /> : active ? "●" : "○"}
      </div>
      <span className="text-[10px] font-semibold text-[#afafaf] whitespace-nowrap">{label}</span>
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

function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  )
}
