/**
 * POST /api/auth/signup
 * 과정코드 기반 회원가입 — Admin SDK 사용으로 이메일 인증 없이 바로 계정 생성
 */
import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    email: string
    password: string
    fullName: string
    username: string
    phone: string
    inviteCode: string
    role: "teacher" | "student"
    courseName: string
    authKey?: string      // 강사: preAuthKey (미리 생성된 6자리)
    courseCode?: string   // 학생: 강사 authKey
  }

  const { email, password, fullName, username, phone, role, courseName, authKey, courseCode } = body

  if (!email || !password || !fullName || !role) {
    return NextResponse.json({ error: "필수 정보가 누락됐어요." }, { status: 400 })
  }

  const admin = getSupabaseAdmin()

  // ── 사용자 생성 (email_confirm: true → 이메일 인증 없이 바로 활성화) ──
  const metadata: Record<string, unknown> = {
    full_name: fullName,
    username,
    phone,
    role,
    course_name: courseName ?? "",
  }
  if (role === "teacher") metadata.auth_key = authKey ?? ""
  else metadata.course_code = courseCode ?? ""

  const { data, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: metadata,
  })

  if (createErr) {
    const msg = createErr.message ?? ""
    if (msg.includes("already registered") || msg.includes("already been registered")) {
      return NextResponse.json({ error: "이미 가입된 이메일이에요. 로그인해 주세요." }, { status: 409 })
    }
    return NextResponse.json({ error: msg || "계정 생성 중 오류가 발생했어요." }, { status: 500 })
  }

  return NextResponse.json({ ok: true, userId: data.user.id })
}
