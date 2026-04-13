/**
 * GET /api/code/validate?code=XXXXXX
 * 공개 엔드포인트: 6자리 학생 과정코드 유효성 검증
 * - 6자리: 강사의 auth_key 검색
 */
import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("code") ?? ""
  const code = raw.trim().toUpperCase()

  if (!code) {
    return NextResponse.json({ valid: false, error: "코드를 입력해주세요." })
  }
  if (code.length !== 6) {
    return NextResponse.json({ valid: false, error: "코드는 6자리입니다." })
  }

  const admin = getSupabaseAdmin()

  // 강사 계정에서 auth_key 직접 검색
  let page = 1
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 50 })
    if (error || !data?.users.length) break

    for (const user of data.users) {
      const userRole = user.user_metadata?.role as string | undefined
      if (userRole !== "teacher") continue

      const authKey = user.user_metadata?.auth_key as string | undefined
      if (authKey && authKey.toUpperCase() === code) {
        return NextResponse.json({
          valid: true,
          type: "student",
          courseName: user.user_metadata?.course_name as string ?? "",
          instructorName: user.user_metadata?.full_name as string ?? "",
          courseCode: authKey,
        })
      }
    }

    if (data.users.length < 50) break
    page++
  }

  return NextResponse.json({ valid: false, error: "유효하지 않은 과정코드예요." })
}
