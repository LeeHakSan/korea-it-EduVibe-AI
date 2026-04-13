/**
 * GET /api/code/validate?code=XXXXXXXX
 * 공개 엔드포인트: 초대코드 유효성 검증 + 메타데이터 반환
 */
import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"
import type { InviteCode } from "@/app/api/admin/codes/route"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("code") ?? ""
  const code = raw.trim().toUpperCase()

  if (!code) {
    return NextResponse.json({ valid: false, error: "코드를 입력해주세요." })
  }
  if (code.length !== 8) {
    return NextResponse.json({ valid: false, error: "코드는 8자리입니다." })
  }

  const admin = getSupabaseAdmin()

  // 모든 관리자 계정에서 코드 탐색
  let page = 1
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 50 })
    if (error || !data?.users.length) break

    for (const user of data.users) {
      if (user.user_metadata?.role !== "admin") continue

      const codes = (user.user_metadata?.invite_codes as InviteCode[]) ?? []
      const found = codes.find((c) => c.code === code && !c.used)

      if (found) {
        return NextResponse.json({
          valid: true,
          type: found.type,            // "teacher" | "student"
          courseName: found.courseName,
          instructorName: found.instructorName,
          preAuthKey: found.preAuthKey, // 강사용: 미리 생성된 auth_key
          courseCode: found.courseCode, // 학생용: 강사의 auth_key
          adminId: user.id,             // 코드 사용 후 mark-used 에 필요
        })
      }
    }

    if (data.users.length < 50) break
    page++
  }

  return NextResponse.json({ valid: false, error: "유효하지 않은 코드이거나 이미 사용된 코드예요." })
}
