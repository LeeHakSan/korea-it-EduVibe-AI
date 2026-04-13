/**
 * POST /api/admin/update-role
 * 관리자가 특정 사용자의 역할을 변경
 */
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getSupabaseAdmin } from "@/lib/supabase-admin"
import { isAdminUser } from "@/lib/auth"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  // 관리자 검증
  const token = req.headers.get("authorization")?.replace("Bearer ", "") ?? ""
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
  if (authErr || !user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 })
  }

  if (!isAdminUser(user)) {
    return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 })
  }

  const { targetUserId, newRole } = (await req.json()) as {
    targetUserId: string
    newRole: "admin" | "teacher" | "student"
  }

  if (!targetUserId || !newRole) {
    return NextResponse.json({ error: "targetUserId 와 newRole 이 필요합니다." }, { status: 400 })
  }

  const adminClient = getSupabaseAdmin()
  const { data: { user: targetUser } } = await adminClient.auth.admin.getUserById(targetUserId)
  if (!targetUser) {
    return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 })
  }

  const { error } = await adminClient.auth.admin.updateUserById(targetUserId, {
    user_metadata: {
      ...targetUser.user_metadata,
      role: newRole,
    },
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, userId: targetUserId, role: newRole })
}
