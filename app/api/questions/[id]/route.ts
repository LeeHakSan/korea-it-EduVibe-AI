import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

type RouteContext = { params: Promise<{ id: string }> }

/**
 * PATCH /api/questions/[id]
 * 문제 수정 (본인 강사 전용)
 * Body: { title?, content?, options?, answer?, topic? }
 */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { title, content, options, answer, topic } = body

  // RLS 정책이 본인 instructor_id 인지 검사하므로 별도 role 확인 불필요
  const { data, error } = await supabase
    .from("questions")
    .update({
      ...(title !== undefined && { title: title.trim() }),
      ...(content !== undefined && { content: content.trim() }),
      ...(options !== undefined && { options }),
      ...(answer !== undefined && { answer }),
      ...(topic !== undefined && { topic }),
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("[PATCH /api/questions/[id]]", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json(
      { error: "문제를 찾을 수 없거나 권한이 없습니다." },
      { status: 404 }
    )
  }

  return NextResponse.json(data)
}

/**
 * DELETE /api/questions/[id]
 * 문제 삭제 (본인 강사 전용)
 */
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { error, count } = await supabase
    .from("questions")
    .delete({ count: "exact" })
    .eq("id", id)

  if (error) {
    console.error("[DELETE /api/questions/[id]]", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (count === 0) {
    return NextResponse.json(
      { error: "문제를 찾을 수 없거나 권한이 없습니다." },
      { status: 404 }
    )
  }

  return new NextResponse(null, { status: 204 })
}
