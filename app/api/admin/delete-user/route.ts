/**
 * DELETE /api/admin/delete-user
 * 관리자 전용: 사용자 계정 삭제
 * Body: { targetUserId: string }
 */
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getSupabaseAdmin } from "@/lib/supabase-admin"
import { isAdminUser } from "@/lib/auth"

export const runtime = "nodejs"

export async function DELETE(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? ""
  if (!auth.startsWith("Bearer ")) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: { user } } = await supabase.auth.getUser(auth.slice(7))
  if (!user || !isAdminUser(user)) return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 })

  const body = await req.json() as { targetUserId: string }
  if (!body.targetUserId) return NextResponse.json({ error: "사용자 ID가 필요합니다." }, { status: 400 })
  if (body.targetUserId === user.id) return NextResponse.json({ error: "자기 자신은 삭제할 수 없습니다." }, { status: 400 })

  const admin = getSupabaseAdmin()
  const { error } = await admin.auth.admin.deleteUser(body.targetUserId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
