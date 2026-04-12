/**
 * GET  /api/admin/codes  - 초대코드 + 등록된 강사 목록 조회
 * POST /api/admin/codes  - 강사 등록(코드 생성) / 학생 코드 발급
 */
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getSupabaseAdmin } from "@/lib/supabase-admin"
import { isAdminUser } from "@/lib/auth"

export const runtime = "nodejs"

// ── 타입 ──────────────────────────────────────────────────────
export interface InviteCode {
  code: string              // 8자리 초대코드
  type: "instructor" | "student"
  courseName: string
  instructorName: string
  preAuthKey: string        // 강사 코드: 미리 생성된 auth_key
  courseCode: string        // 학생 코드: 강사의 auth_key
  used: boolean
  usedBy: string
  createdAt: string
}

export interface RegisteredInstructor {
  name: string
  courseName: string
  signupCode: string        // 강사 회원가입용 코드
  authKey: string           // 학생이 입력하는 과정코드
  registeredAt: string
}

// ── 코드 생성 헬퍼 ────────────────────────────────────────────
function genCode(len: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  return Array.from({ length: len }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("")
}

// ── 관리자 검증 ───────────────────────────────────────────────
async function verifyAdmin(token: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user || !isAdminUser(user)) return null
  return user
}

// ── GET ───────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "") ?? ""
  const requester = await verifyAdmin(token)
  if (!requester) return NextResponse.json({ error: "관리자 권한이 필요해요." }, { status: 403 })

  const adminClient = getSupabaseAdmin()
  const { data: { user: adminUser } } = await adminClient.auth.admin.getUserById(requester.id)

  const codes = (adminUser?.user_metadata?.invite_codes as InviteCode[]) ?? []
  const instructors = (adminUser?.user_metadata?.registered_instructors as RegisteredInstructor[]) ?? []

  return NextResponse.json({ codes, instructors })
}

// ── POST ──────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "") ?? ""
  const requester = await verifyAdmin(token)
  if (!requester) return NextResponse.json({ error: "관리자 권한이 필요해요." }, { status: 403 })

  const body = await req.json()
  const { action, instructorName, courseName, courseCode } = body as {
    action: "register_instructor" | "issue_student_code"
    instructorName?: string
    courseName?: string
    courseCode?: string  // 학생코드 발급 시: 강사의 authKey
  }

  const adminClient = getSupabaseAdmin()
  const { data: { user: adminUser } } = await adminClient.auth.admin.getUserById(requester.id)
  if (!adminUser) return NextResponse.json({ error: "관리자 계정을 찾을 수 없어요." }, { status: 404 })

  const existingCodes: InviteCode[] =
    (adminUser.user_metadata?.invite_codes as InviteCode[]) ?? []
  const existingInstructors: RegisteredInstructor[] =
    (adminUser.user_metadata?.registered_instructors as RegisteredInstructor[]) ?? []

  // ── 강사 등록 ──────────────────────────────────────────────
  if (action === "register_instructor") {
    if (!instructorName || !courseName) {
      return NextResponse.json({ error: "강사명과 과정명을 입력해주세요." }, { status: 400 })
    }

    const signupCode = genCode(8)
    const authKey    = genCode(6)

    const newCode: InviteCode = {
      code: signupCode,
      type: "instructor",
      courseName,
      instructorName,
      preAuthKey: authKey,
      courseCode: "",
      used: false,
      usedBy: "",
      createdAt: new Date().toISOString(),
    }

    const newInstructor: RegisteredInstructor = {
      name: instructorName,
      courseName,
      signupCode,
      authKey,
      registeredAt: new Date().toISOString(),
    }

    const { error } = await adminClient.auth.admin.updateUserById(adminUser.id, {
      user_metadata: {
        ...adminUser.user_metadata,
        invite_codes: [...existingCodes, newCode],
        registered_instructors: [...existingInstructors, newInstructor],
      },
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ signupCode, authKey, courseName, instructorName })
  }

  // ── 학생 코드 발급 ─────────────────────────────────────────
  if (action === "issue_student_code") {
    if (!courseCode) {
      return NextResponse.json({ error: "과정코드(강사 authKey)가 필요해요." }, { status: 400 })
    }

    const instructor = existingInstructors.find((i) => i.authKey === courseCode)
    const signupCode = genCode(8)

    const newCode: InviteCode = {
      code: signupCode,
      type: "student",
      courseName: instructor?.courseName ?? courseName ?? "",
      instructorName: instructor?.name ?? "",
      preAuthKey: "",
      courseCode,
      used: false,
      usedBy: "",
      createdAt: new Date().toISOString(),
    }

    const { error } = await adminClient.auth.admin.updateUserById(adminUser.id, {
      user_metadata: {
        ...adminUser.user_metadata,
        invite_codes: [...existingCodes, newCode],
      },
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ signupCode, courseName: newCode.courseName })
  }

  return NextResponse.json({ error: "알 수 없는 액션이에요." }, { status: 400 })
}
