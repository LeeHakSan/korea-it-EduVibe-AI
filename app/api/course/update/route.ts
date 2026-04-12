/**
 * POST /api/course/update
 * 강사가 업로드한 미션·언어 설정을 Supabase user_metadata 에 저장합니다.
 * Authorization: Bearer <access_token> 헤더가 필요합니다.
 */
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  // 1. JWT 검증
  const authHeader = req.headers.get("authorization") ?? ""
  if (!authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 })
  }
  const token = authHeader.slice(7)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: { user }, error: userErr } = await supabase.auth.getUser(token)

  if (userErr || !user) {
    return NextResponse.json({ error: "인증에 실패했어요." }, { status: 401 })
  }
  if (user.user_metadata?.role !== "instructor") {
    return NextResponse.json({ error: "강사 권한이 필요해요." }, { status: 403 })
  }

  // 2. 요청 본문 파싱
  let body: { missions: unknown; language: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식이에요." }, { status: 400 })
  }

  // 3. Admin 클라이언트로 user_metadata 업데이트
  try {
    const admin = getSupabaseAdmin()
    const { error } = await admin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        course_data: {
          missions: body.missions,
          language: body.language,
          updatedAt: new Date().toISOString(),
        },
      },
    })
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[POST /api/course/update]", err)
    const msg = err instanceof Error ? err.message : "저장 실패"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
