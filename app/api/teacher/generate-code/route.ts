/**
 * POST /api/teacher/generate-code
 * 강사 과정코드(auth_key) 발급 또는 재발급
 * - 기존 코드가 없으면 신규 발급
 * - force=true 이면 재발급 (기존 수강생 연결 유지 여부는 프론트에서 확인)
 */
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

export const runtime = "nodejs"

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // 혼동 가능한 문자 제외 (I, O, 0, 1)
  let code = ""
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

async function verifyTeacher(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? ""
  if (!auth.startsWith("Bearer ")) return null
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: { user } } = await supabase.auth.getUser(auth.slice(7))
  if (!user) return null
  if (user.user_metadata?.role !== "teacher") return null
  return user
}

export async function POST(req: NextRequest) {
  const user = await verifyTeacher(req)
  if (!user) return NextResponse.json({ error: "강사 권한이 필요합니다." }, { status: 403 })

  const body = await req.json().catch(() => ({})) as { force?: boolean }
  const existingKey = user.user_metadata?.auth_key as string | undefined

  // 이미 코드가 있고 force가 아니면 기존 코드 반환
  if (existingKey && !body.force) {
    return NextResponse.json({ ok: true, authKey: existingKey, isNew: false })
  }

  // 중복 없는 코드 생성 (최대 10회 시도)
  const admin = getSupabaseAdmin()
  let newCode = ""
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = generateCode()
    // 다른 강사가 쓰고 있는지 확인
    let duplicate = false
    let page = 1
    outerLoop: while (true) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 })
      if (error || !data.users.length) break
      for (const u of data.users) {
        if (u.id === user.id) continue
        if (u.user_metadata?.role === "teacher" && u.user_metadata?.auth_key === candidate) {
          duplicate = true
          break outerLoop
        }
      }
      if (data.users.length < 100) break
      page++
    }
    if (!duplicate) { newCode = candidate; break }
  }

  if (!newCode) return NextResponse.json({ error: "코드 생성에 실패했어요. 잠시 후 다시 시도해주세요." }, { status: 500 })

  const { error } = await admin.auth.admin.updateUserById(user.id, {
    user_metadata: { ...user.user_metadata, auth_key: newCode },
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, authKey: newCode, isNew: true })
}
