/**
 * GET /api/code/validate?code=XXXXXX|XXXXXXXX
 * 공개 엔드포인트: 코드 유효성 검증 + 메타데이터 반환
 * - 8자리: 강사 회원가입 코드
 * - 6자리: 학생 과정코드(auth_key)
 */
import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"
import type { InviteCode, RegisteredInstructor } from "@/app/api/admin/codes/route"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("code") ?? ""
  const code = raw.trim().toUpperCase()

  if (!code) {
    return NextResponse.json({ valid: false, error: "코드를 입력해주세요." })
  }
  if (code.length !== 6 && code.length !== 8) {
    return NextResponse.json({ valid: false, error: "코드는 6자리 또는 8자리입니다." })
  }

  const admin = getSupabaseAdmin()

  // 모든 관리자 계정에서 코드 탐색
  let page = 1
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 50 })
    if (error || !data?.users.length) break

    for (const user of data.users) {
      // isAdminUser() 와 동일 로직: teacher·student 가 아니면 관리자
      const userRole = user.user_metadata?.role as string | undefined
      if (userRole === "teacher" || userRole === "student") continue

      // 8자리: 초대코드 검증
      if (code.length === 8) {
        const codes = (user.user_metadata?.invite_codes as InviteCode[]) ?? []
        const found = codes.find((c) => c.code === code && !c.used)

        if (found) {
          const normalizedType = found.type === "instructor" || found.type === "teacher"
            ? "teacher"
            : "student"
          return NextResponse.json({
            valid: true,
            type: normalizedType,
            courseName: found.courseName,
            instructorName: found.instructorName,
            preAuthKey: found.preAuthKey, // 강사용: 미리 생성된 auth_key
            courseCode: found.courseCode, // 학생용: 강사의 auth_key
            adminId: user.id,             // 코드 사용 후 mark-used 에 필요
          })
        }
      }

      // 6자리: 등록된 강사의 과정코드(authKey) 검증
      if (code.length === 6) {
        const instructors = (user.user_metadata?.registered_instructors as RegisteredInstructor[]) ?? []
        const foundInstructor = instructors.find((ins) => ins.authKey === code)
        if (foundInstructor) {
          return NextResponse.json({
            valid: true,
            type: "student",
            courseName: foundInstructor.courseName,
            instructorName: foundInstructor.name,
            courseCode: foundInstructor.authKey,
          })
        }
      }
    }

    if (data.users.length < 50) break
    page++
  }

  return NextResponse.json({ valid: false, error: "유효하지 않은 코드예요." })
}
