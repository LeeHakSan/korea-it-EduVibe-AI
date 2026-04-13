/**
 * POST /api/admin/change-password
 * 관리자 전용: 특정 사용자의 비밀번호 변경
 * Body: { targetUserId: string, newPassword: string }
 */
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getSupabaseAdmin } from "@/lib/supabase-admin"
import { isAdminUser } from "@/lib/auth"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? ""
  if (!auth.startsWith("Bearer ")) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: { user } } = await supabase.auth.getUser(auth.slice(7))
  if (!user || !isAdminUser(user)) return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 })

  const body = await req.json() as { targetUserId: string; newPassword: string }
  if (!body.targetUserId || !body.newPassword?.trim())
    return NextResponse.json({ error: "사용자 ID와 새 비밀번호를 입력해주세요." }, { status: 400 })
  if (body.newPassword.length < 6)
    return NextResponse.json({ error: "비밀번호는 최소 6자 이상이어야 합니다." }, { status: 400 })

  const admin = getSupabaseAdmin()
  const { error } = await admin.auth.admin.updateUserById(body.targetUserId, {
    password: body.newPassword,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
