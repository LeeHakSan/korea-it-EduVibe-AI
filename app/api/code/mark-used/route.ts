/**
 * POST /api/code/mark-used
 * 회원가입 완료 후 초대코드를 사용됨으로 표시
 */
import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"
import type { InviteCode } from "@/app/api/admin/codes/route"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  const { code, adminId, userEmail } = (await req.json()) as {
    code: string
    adminId: string
    userEmail: string
  }

  if (!code || !adminId) {
    return NextResponse.json({ error: "code와 adminId가 필요해요." }, { status: 400 })
  }

  const admin = getSupabaseAdmin()
  const { data: { user: adminUser } } = await admin.auth.admin.getUserById(adminId)

  if (!adminUser) {
    return NextResponse.json({ error: "관리자를 찾을 수 없어요." }, { status: 404 })
  }

  const codes = (adminUser.user_metadata?.invite_codes as InviteCode[]) ?? []
  const updated = codes.map((c) =>
    c.code === code ? { ...c, used: true, usedBy: userEmail } : c
  )

  const { error } = await admin.auth.admin.updateUserById(adminId, {
    user_metadata: {
      ...adminUser.user_metadata,
      invite_codes: updated,
    },
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
