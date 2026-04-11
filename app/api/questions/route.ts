import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

/**
 * GET /api/questions
 * 문제 목록 조회 (모든 인증 사용자 가능)
 * Query: ?topic=조건문  (선택 필터)
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const topic = request.nextUrl.searchParams.get("topic")

  let query = supabase
    .from("questions")
    .select("id, title, content, options, topic, created_at, instructor_id")
    .order("created_at", { ascending: false })

  if (topic) {
    query = query.eq("topic", topic)
  }

  const { data, error } = await query

  if (error) {
    console.error("[GET /api/questions]", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

/**
 * POST /api/questions
 * 문제 생성 (강사 전용)
 * Body: { title, content, options?, answer?, topic? }
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // 역할 확인
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "instructor") {
    return NextResponse.json(
      { error: "강사만 문제를 생성할 수 있습니다." },
      { status: 403 }
    )
  }

  const body = await request.json()
  const { title, content, options, answer, topic } = body

  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json(
      { error: "title 과 content 는 필수입니다." },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from("questions")
    .insert({
      instructor_id: user.id,
      title: title.trim(),
      content: content.trim(),
      options: options ?? null,
      answer: answer ?? null,
      topic: topic ?? null,
    })
    .select()
    .single()

  if (error) {
    console.error("[POST /api/questions]", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
