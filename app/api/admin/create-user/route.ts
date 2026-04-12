/**
 * POST /api/admin/create-user
 * 관리자가 Supabase Admin API를 통해 사용자를 직접 생성
 */
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  // 관리자 검증
  const token = req.headers.get("authorization")?.replace("Bearer ", "") ?? ""
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
  if (authErr || !user || user.user_metadata?.role !== "admin") {
    return NextResponse.json({ error: "관리자 권한이 필요해요." }, { status: 403 })
  }

  const { email, password, full_name, role, phone } = (await req.json()) as {
    email: string
    password: string
    full_name?: string
    role?: string
    phone?: string
  }

  if (!email || !password) {
    return NextResponse.json({ error: "이메일과 비밀번호를 입력해주세요." }, { status: 400 })
  }

  const adminClient = getSupabaseAdmin()
  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // 이메일 인증 없이 바로 활성화
    user_metadata: {
      full_name: full_name ?? "",
      role: role ?? "admin",
      phone: phone ?? "",
    },
  })

  if (error) {
    return NextResponse.json(
      { error: error.message.includes("already registered")
          ? "이미 사용 중인 이메일이에요."
          : error.message
      },
      { status: 500 }
    )
  }

  return NextResponse.json({ user: { id: data.user.id, email: data.user.email, role } })
}
