/**
 * /api/student-qa
 * 학생·강사 → 관리자 질문 (Q&A)
 * GET  : 본인 질문 반환. 관리자 → 전체 질문
 * POST : 질문 제출 { title, content }
 * PATCH: 관리자 답변 { authorId, questionId, answer }
 */
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getSupabaseAdmin } from "@/lib/supabase-admin"
import { isAdminUser } from "@/lib/auth"

export const runtime = "nodejs"

export interface StudentQA {
  id: string
  title: string
  content: string
  author: string
  authorId: string
  authorRole: string
  courseCode?: string
  courseName?: string
  createdAt: string
  answered: boolean
  answer?: string
  answeredAt?: string
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
    const all: StudentQA[] = []
    while (true) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
      if (error || !data.users.length) break
      for (const u of data.users) {
        const qs: StudentQA[] = (u.user_metadata?.student_qa as StudentQA[]) ?? []
        const meta = u.user_metadata ?? {}
        for (const q of qs) all.push({
          ...q,
          courseCode: q.courseCode ?? (meta.course_code as string) ?? (meta.auth_key as string) ?? "",
          courseName: q.courseName ?? (meta.course_name as string) ?? "",
        })
      }
      if (data.users.length < 1000) break
      page++
    }
    all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return NextResponse.json({ questions: all })
  }

  const qs: StudentQA[] = (user.user_metadata?.student_qa as StudentQA[]) ?? []
  return NextResponse.json({
    questions: [...qs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
  })
}

export async function POST(req: NextRequest) {
  const user = await verifyUser(req)
  if (!user) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 })
  const body = await req.json() as { title: string; content: string }
  if (!body.title?.trim() || !body.content?.trim())
    return NextResponse.json({ error: "제목과 내용을 입력해주세요." }, { status: 400 })

  const admin = getSupabaseAdmin()
  const existing: StudentQA[] = (user.user_metadata?.student_qa as StudentQA[]) ?? []
  const meta = user.user_metadata ?? {}
  const newQ: StudentQA = {
    id: crypto.randomUUID(),
    title: body.title.trim(),
    content: body.content.trim(),
    author: (meta.full_name as string) ?? user.email ?? "익명",
    authorId: user.id,
    authorRole: (meta.role as string) ?? "student",
    courseCode: (meta.course_code as string) ?? (meta.auth_key as string) ?? "",
    courseName: (meta.course_name as string) ?? "",
    createdAt: new Date().toISOString(),
    answered: false,
  }
  const { error } = await admin.auth.admin.updateUserById(user.id, {
    user_metadata: { ...meta, student_qa: [...existing, newQ] },
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, question: newQ })
}

export async function PATCH(req: NextRequest) {
  const user = await verifyUser(req)
  if (!user || !isAdminUser(user)) return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 })
  const body = await req.json() as { authorId: string; questionId: string; answer: string }
  if (!body.authorId || !body.questionId || !body.answer?.trim())
    return NextResponse.json({ error: "필수 항목 누락." }, { status: 400 })

  const admin = getSupabaseAdmin()
  const { data: { user: target } } = await admin.auth.admin.getUserById(body.authorId)
  if (!target) return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 })

  const qs: StudentQA[] = (target.user_metadata?.student_qa as StudentQA[]) ?? []
  const updated = qs.map((q) =>
    q.id === body.questionId
      ? { ...q, answered: true, answer: body.answer.trim(), answeredAt: new Date().toISOString() }
      : q
  )
  const { error } = await admin.auth.admin.updateUserById(body.authorId, {
    user_metadata: { ...target.user_metadata, student_qa: updated },
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
