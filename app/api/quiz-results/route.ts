import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

/**
 * GET /api/quiz-results
 * 결과 조회
 *
 * - 학생: 본인 결과만 반환 (RLS 적용)
 * - 강사: 자신이 만든 문제의 모든 학생 결과 반환 (RLS 적용)
 *
 * Query:
 *   ?question_id=uuid  (특정 문제 필터, 선택)
 *   ?student_id=uuid   (강사가 특정 학생 필터, 선택)
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = request.nextUrl
  const questionId = searchParams.get("question_id")
  const studentId = searchParams.get("student_id")

  let query = supabase
    .from("quiz_results")
    .select(
      `id, student_id, question_id, answer, is_correct, score, submitted_at,
       questions(title, topic),
       profiles!student_id(full_name)`
    )
    .order("submitted_at", { ascending: false })

  if (questionId) query = query.eq("question_id", questionId)
  if (studentId) query = query.eq("student_id", studentId)

  const { data, error } = await query

  if (error) {
    console.error("[GET /api/quiz-results]", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

/**
 * POST /api/quiz-results
 * 퀴즈 제출 (학생 전용)
 * Body: { question_id, answer, is_correct, score? }
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // 학생 역할 확인
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "student") {
    return NextResponse.json(
      { error: "학생만 퀴즈를 제출할 수 있습니다." },
      { status: 403 }
    )
  }

  const body = await request.json()
  const { question_id, answer, is_correct, score } = body

  if (!question_id || answer === undefined || is_correct === undefined) {
    return NextResponse.json(
      { error: "question_id, answer, is_correct 는 필수입니다." },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from("quiz_results")
    .insert({
      student_id: user.id,
      question_id,
      answer: String(answer),
      is_correct: Boolean(is_correct),
      score: score ?? null,
    })
    .select()
    .single()

  if (error) {
    console.error("[POST /api/quiz-results]", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
