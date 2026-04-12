"use client"

import { useEffect, useState } from "react"
import { Eye, EyeOff, CheckCircle2, AlertCircle, User, Mail, Phone, Key, Hash, Lock, ShieldCheck } from "lucide-react"
import { getSupabaseBrowser } from "@/lib/supabase-browser"

interface ProfileInfo {
  fullName: string
  username: string
  email: string
  phone: string
  authKey: string
  role: string
}

function checkPassword(pw: string) {
  return {
    length: pw.length >= 8,
    upper:  /[A-Z]/.test(pw),
    lower:  /[a-z]/.test(pw),
    number: /[0-9]/.test(pw),
  }
}

// ── 비밀번호 변경 단계 ──────────────────────────────────
// "verify"  → 현재 비밀번호 입력 후 확인
// "change"  → 새 비밀번호 + 확인 입력
// "done"    → 성공
type PwStep = "verify" | "change" | "done"

export default function ProfilePage() {
  const [profile, setProfile]   = useState<ProfileInfo | null>(null)
  const [loading, setLoading]   = useState(true)
  const [userEmail, setUserEmail] = useState("")

  // 단계
  const [pwStep, setPwStep] = useState<PwStep>("verify")

  // 현재 비밀번호 확인 단계
  const [currentPw,      setCurrentPw]      = useState("")
  const [showCurrent,    setShowCurrent]     = useState(false)
  const [verifyLoading,  setVerifyLoading]   = useState(false)
  const [verifyError,    setVerifyError]     = useState<string | null>(null)

  // 새 비밀번호 단계
  const [showNew,     setShowNew]     = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [newPw,       setNewPw]       = useState("")
  const [confirmPw,   setConfirmPw]   = useState("")
  const [pwError,     setPwError]     = useState<string | null>(null)
  const [pwLoading,   setPwLoading]   = useState(false)

  const pwCheck = checkPassword(newPw)
  const pwValid = Object.values(pwCheck).every(Boolean)

  useEffect(() => {
    const supabase = getSupabaseBrowser()
    supabase.auth.getUser().then(({ data }: { data: { user: import("@supabase/supabase-js").User | null } }) => {
      const user = data.user
      if (!user) return
      const meta = user.user_metadata ?? {}
      setUserEmail(user.email ?? "")
      setProfile({
        fullName: (meta.full_name as string) ?? "",
        username: (meta.username as string) ?? user.email?.split("@")[0] ?? "",
        email:    user.email ?? "",
        phone:    (meta.phone as string) ?? "",
        authKey:  (meta.auth_key as string) ?? "••••••",
        role:     (meta.role as string) === "instructor" ? "강사" : "학생",
      })
      setLoading(false)
    })
  }, [])

  // ── Step 1: 현재 비밀번호 확인 ──────────────────────────
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setVerifyError(null)
    if (!currentPw.trim()) { setVerifyError("현재 비밀번호를 입력해주세요."); return }

    setVerifyLoading(true)
    const supabase = getSupabaseBrowser()

    // signInWithPassword 로 현재 비밀번호 검증
    const { error } = await supabase.auth.signInWithPassword({
      email:    userEmail,
      password: currentPw,
    })
    setVerifyLoading(false)

    if (error) {
      setVerifyError("현재 비밀번호가 올바르지 않아요. 다시 확인해주세요.")
    } else {
      // 검증 성공 → 다음 단계
      setPwStep("change")
      setCurrentPw("")
    }
  }

  // ── Step 2: 새 비밀번호 변경 ─────────────────────────────
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwError(null)
    if (!pwValid)          { setPwError("비밀번호 조건을 모두 충족해주세요."); return }
    if (newPw !== confirmPw) { setPwError("새 비밀번호가 일치하지 않아요."); return }

    setPwLoading(true)
    const supabase = getSupabaseBrowser()
    const { error } = await supabase.auth.updateUser({ password: newPw })
    setPwLoading(false)

    if (error) {
      setPwError("비밀번호 변경에 실패했어요. 다시 시도해주세요.")
    } else {
      setPwStep("done")
      setNewPw(""); setConfirmPw("")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-[#58cc02] border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8">
      <h1 className="text-2xl font-black text-[#3c3c3c] mb-1">프로필</h1>
      <p className="text-[#777] font-semibold mb-8">가입 정보를 확인하고 비밀번호를 변경할 수 있어요.</p>

      {/* 프로필 카드 */}
      <div className="bg-white rounded-3xl border-2 border-[#e5e5e5] p-6 mb-6">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b-2 border-[#f7f7f7]">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#58cc02] to-[#1cb0f6] flex items-center justify-center text-white font-black text-2xl">
            {profile?.fullName?.slice(0, 1) ?? "?"}
          </div>
          <div>
            <p className="text-xl font-black text-[#3c3c3c]">{profile?.fullName}</p>
            <span className={`text-xs font-bold px-3 py-1 rounded-full inline-block ${
              profile?.role === "강사"
                ? "bg-[#58cc02]/10 text-[#58cc02]"
                : "bg-[#1cb0f6]/10 text-[#1cb0f6]"
            }`}>
              {profile?.role}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <InfoRow icon={<User  className="w-4 h-4" />} label="이름"   value={profile?.fullName ?? "-"} />
          <InfoRow icon={<Hash  className="w-4 h-4" />} label="아이디" value={profile?.username ?? "-"} />
          <InfoRow icon={<Mail  className="w-4 h-4" />} label="이메일" value={profile?.email ?? "-"} />
          <InfoRow icon={<Phone className="w-4 h-4" />} label="휴대폰" value={profile?.phone ?? "-"} />
          <InfoRow icon={<Key   className="w-4 h-4" />} label="인증키" value={profile?.authKey ?? "-"} secret />
        </div>
      </div>

      {/* 비밀번호 변경 */}
      <div className="bg-white rounded-3xl border-2 border-[#e5e5e5] p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 bg-[#ff9600]/10 rounded-xl flex items-center justify-center">
            <Lock className="w-4 h-4 text-[#ff9600]" />
          </div>
          <h2 className="text-lg font-black text-[#3c3c3c]">비밀번호 변경</h2>
        </div>

        {/* 단계 표시 */}
        {pwStep !== "done" && (
          <div className="flex items-center gap-2 mb-6">
            {(["verify", "change"] as PwStep[]).map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                  pwStep === step
                    ? "bg-[#1cb0f6] text-white"
                    : i < (pwStep === "change" ? 1 : 0)
                    ? "bg-[#58cc02] text-white"
                    : "bg-[#f7f7f7] text-[#afafaf]"
                }`}>
                  {i < (pwStep === "change" ? 1 : 0) ? "✓" : i + 1}
                </div>
                <span className={`text-xs font-bold ${pwStep === step ? "text-[#3c3c3c]" : "text-[#afafaf]"}`}>
                  {step === "verify" ? "현재 비밀번호 확인" : "새 비밀번호 설정"}
                </span>
                {i === 0 && <div className="w-6 h-0.5 bg-[#e5e5e5] mx-1" />}
              </div>
            ))}
          </div>
        )}

        {/* ─ Step 1: 현재 비밀번호 확인 ─ */}
        {pwStep === "verify" && (
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="p-4 bg-[#fff9e6] border border-[#ffc800]/30 rounded-2xl mb-2">
              <p className="text-sm font-semibold text-[#777]">
                <span className="font-bold text-[#ff9600]">보안을 위해</span> 비밀번호 변경 전 현재 비밀번호를 먼저 확인해요.
              </p>
            </div>

            {verifyError && (
              <div className="flex items-center gap-2 bg-[#fff0f0] border border-[#ff4b4b]/20 rounded-xl px-4 py-3">
                <AlertCircle className="w-5 h-5 text-[#ff4b4b] shrink-0" />
                <p className="text-[#ff4b4b] font-bold text-sm">{verifyError}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-[#3c3c3c]">현재 비밀번호</label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  placeholder="현재 사용 중인 비밀번호"
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  className="w-full px-4 py-3.5 pr-12 rounded-2xl border-2 border-transparent bg-[#f7f7f7] text-[#3c3c3c] font-semibold placeholder:text-[#afafaf] placeholder:font-normal focus:outline-none focus:bg-white focus:border-[#1cb0f6] transition-all text-sm"
                />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#afafaf]">
                  {showCurrent ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={verifyLoading || !currentPw.trim()}
              className="w-full py-4 rounded-2xl font-bold text-white bg-[#1cb0f6] border-b-4 border-[#1899d6] hover:bg-[#1cb0f6]/90 active:border-b-0 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {verifyLoading
                ? <><div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" /> 확인 중...</>
                : <><ShieldCheck className="w-5 h-5" /> 비밀번호 확인</>
              }
            </button>
          </form>
        )}

        {/* ─ Step 2: 새 비밀번호 입력 ─ */}
        {pwStep === "change" && (
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="p-3 bg-[#f0fff0] border border-[#58cc02]/20 rounded-xl mb-1 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#58cc02] shrink-0" />
              <p className="text-sm font-bold text-[#58cc02]">현재 비밀번호가 확인됐어요! 새 비밀번호를 설정해주세요.</p>
            </div>

            {pwError && (
              <div className="flex items-center gap-2 bg-[#fff0f0] border border-[#ff4b4b]/20 rounded-xl px-4 py-3">
                <AlertCircle className="w-5 h-5 text-[#ff4b4b]" />
                <p className="text-[#ff4b4b] font-bold text-sm">{pwError}</p>
              </div>
            )}

            {/* 새 비밀번호 */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-[#3c3c3c]">새로운 비밀번호</label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  placeholder="새 비밀번호 입력"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  className="w-full px-4 py-3.5 pr-12 rounded-2xl border-2 border-transparent bg-[#f7f7f7] text-[#3c3c3c] font-semibold placeholder:text-[#afafaf] placeholder:font-normal focus:outline-none focus:bg-white focus:border-[#1cb0f6] transition-all text-sm"
                />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#afafaf]">
                  {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {newPw.length > 0 && (
                <div className="grid grid-cols-2 gap-1 mt-2">
                  {[
                    { ok: pwCheck.length, label: "8자 이상" },
                    { ok: pwCheck.upper,  label: "대문자 포함" },
                    { ok: pwCheck.lower,  label: "소문자 포함" },
                    { ok: pwCheck.number, label: "숫자 포함" },
                  ].map(({ ok, label }) => (
                    <div key={label} className={`flex items-center gap-1 text-xs font-semibold ${ok ? "text-[#58cc02]" : "text-[#afafaf]"}`}>
                      <CheckCircle2 className={`w-3.5 h-3.5 ${ok ? "text-[#58cc02]" : "text-[#e5e5e5]"}`} />
                      {label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 새 비밀번호 확인 */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-[#3c3c3c]">새로운 비밀번호 확인</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="새 비밀번호 재입력"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  className={`w-full px-4 py-3.5 pr-12 rounded-2xl border-2 bg-[#f7f7f7] text-[#3c3c3c] font-semibold placeholder:text-[#afafaf] placeholder:font-normal focus:outline-none focus:bg-white transition-all text-sm ${
                    confirmPw && confirmPw !== newPw ? "border-[#ff4b4b]"
                    : confirmPw && confirmPw === newPw ? "border-[#58cc02]"
                    : "border-transparent focus:border-[#1cb0f6]"
                  }`}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#afafaf]">
                  {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {confirmPw && confirmPw === newPw && (
                <p className="text-[#58cc02] text-xs font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 비밀번호가 일치해요!
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setPwStep("verify"); setPwError(null); setNewPw(""); setConfirmPw("") }}
                className="px-5 py-3 rounded-2xl font-bold text-[#777] bg-[#f7f7f7] hover:bg-[#e5e5e5] transition-all"
              >
                이전
              </button>
              <button
                type="submit"
                disabled={pwLoading || !pwValid || newPw !== confirmPw}
                className="flex-1 py-3 rounded-2xl font-bold text-white bg-[#58cc02] border-b-4 border-[#46a302] hover:bg-[#58cc02]/90 active:border-b-0 transition-all disabled:opacity-60"
              >
                {pwLoading ? "변경 중..." : "비밀번호 변경"}
              </button>
            </div>
          </form>
        )}

        {/* ─ Step 3: 완료 ─ */}
        {pwStep === "done" && (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-[#58cc02]/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-9 h-9 text-[#58cc02]" />
            </div>
            <p className="font-black text-[#3c3c3c] text-lg mb-1">비밀번호 변경 완료!</p>
            <p className="text-sm text-[#777] font-semibold mb-5">새 비밀번호로 로그인해주세요.</p>
            <button
              type="button"
              onClick={() => { setPwStep("verify"); setVerifyError(null) }}
              className="px-6 py-3 bg-[#f7f7f7] rounded-2xl font-bold text-[#777] hover:bg-[#e5e5e5] transition-all text-sm"
            >
              다시 변경하기
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function InfoRow({ icon, label, value, secret }: {
  icon: React.ReactNode; label: string; value: string; secret?: boolean
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="flex items-center gap-3 py-3 border-b border-[#f7f7f7] last:border-0">
      <div className="w-8 h-8 rounded-xl bg-[#f7f7f7] flex items-center justify-center text-[#afafaf] shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-[#afafaf] uppercase tracking-wide">{label}</p>
        <p className="font-bold text-[#3c3c3c] text-sm truncate">
          {secret && !show ? "••••••••" : value}
        </p>
      </div>
      {secret && (
        <button type="button" onClick={() => setShow(!show)} className="text-[#afafaf] hover:text-[#3c3c3c]">
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      )}
    </div>
  )
}
