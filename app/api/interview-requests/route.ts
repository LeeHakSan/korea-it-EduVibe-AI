/**
 * /api/interview-requests
 * 학생 → 면담 요청 제출 / 관리자 → 전체 요청 조회 및 상태 업데이트
 * GET  : 본인 요청 / 관리자 → 전체
 * POST : 요청 제출 { reason, preferredDate? }
 * PATCH: 관리자 상태 변경 { studentId, requestId, status, adminNote? }
 */
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getSupabaseAdmin } from "@/lib/supabase-admin"
import { isAdminUser } from "@/lib/auth"

export const runtime = "nodejs"

export interface InterviewRequest {
  id: string
  studentName: string
  studentId: string
  courseCode: string
  courseName: string
  reason: string
  preferredDate?: string
  status: "pending" | "confirmed" | "rejected"
  createdAt: string
  adminNote?: string
}

async function verifyUser(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? ""
  if (!auth.startsWith("Bearer ")) return null
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: { user } } = await supabase.auth.getUser(auth.slice(7))
  return user
}

export async function GET(req: NextRequest) {
  const user = await verifyUser(req)
  if (!user) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 })
  const admin = getSupabaseAdmin()

  if (isAdminUser(user)) {
    let page = 1
    const all: InterviewRequest[] = []
    while (true) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
      if (error || !data.users.length) break
      for (const u of data.users) {
        const reqs: InterviewRequest[] = (u.user_metadata?.interview_requests as InterviewRequest[]) ?? []
        all.push(...reqs)
      }
      if (data.users.length < 1000) break
      page++
    }
    all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return NextResponse.json({ requests: all })
  }

  const reqs: InterviewRequest[] = (user.user_metadata?.interview_requests as InterviewRequest[]) ?? []
  return NextResponse.json({
    requests: [...reqs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
  })
}

export async function POST(req: NextRequest) {
  const user = await verifyUser(req)
  if (!user) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 })
  const body = await req.json() as { reason: string; preferredDate?: string }
  if (!body.reason?.trim()) return NextResponse.json({ error: "면담 사유를 입력해주세요." }, { status: 400 })

  const admin = getSupabaseAdmin()
  const meta = user.user_metadata ?? {}
  const existing: InterviewRequest[] = (meta.interview_requests as InterviewRequest[]) ?? []
  const newReq: InterviewRequest = {
    id: crypto.randomUUID(),
    studentName: (meta.full_name as string) ?? user.email ?? "익명",
    studentId: user.id,
    courseCode: (meta.course_code as string) ?? "",
    courseName: (meta.course_name as string) ?? "",
    reason: body.reason.trim(),
    preferredDate: body.preferredDate,
    status: "pending",
    createdAt: new Date().toISOString(),
  }
  const { error } = await admin.auth.admin.updateUserById(user.id, {
    user_metadata: { ...meta, interview_requests: [...existing, newReq] },
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, request: newReq })
}

export async function PATCH(req: NextRequest) {
  const user = await verifyUser(req)
  if (!user || !isAdminUser(user)) return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 })
  const body = await req.json() as { studentId: string; requestId: string; status: string; adminNote?: string }
  if (!body.studentId || !body.requestId || !body.status)
    return NextResponse.json({ error: "필수 항목 누락." }, { status: 400 })

  const admin = getSupabaseAdmin()
  const { data: { user: target } } = await admin.auth.admin.getUserById(body.studentId)
  if (!target) return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 })

  const reqs: InterviewRequest[] = (target.user_metadata?.interview_requests as InterviewRequest[]) ?? []
  const updated = reqs.map((r) =>
    r.id === body.requestId
      ? { ...r, status: body.status as InterviewRequest["status"], adminNote: body.adminNote }
      : r
  )
  const { error } = await admin.auth.admin.updateUserById(body.studentId, {
    user_metadata: { ...target.user_metadata, interview_requests: updated },
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
