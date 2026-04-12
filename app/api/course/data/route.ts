/**
 * GET /api/course/data?code=COURSE_CODE
 * 과정코드(=강사의 auth_key)로 강사의 코스 데이터를 반환합니다.
 * 학생 대시보드에서 강사가 업로드한 미션·언어 설정을 불러올 때 사용합니다.
 */
import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")
  if (!code?.trim()) {
    return NextResponse.json({ error: "code 파라미터가 필요합니다." }, { status: 400 })
  }

  try {
    const admin = getSupabaseAdmin()

    // 모든 사용자 목록에서 해당 auth_key를 가진 강사 탐색
    let instructor: Record<string, unknown> | null = null
    let page = 1
    const perPage = 1000

    outer: while (true) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
      if (error) throw error
      if (!data.users.length) break

      for (const u of data.users) {
        if (
          u.user_metadata?.role === "instructor" &&
          u.user_metadata?.auth_key === code
        ) {
          instructor = u.user_metadata as Record<string, unknown>
          break outer
        }
      }

      if (data.users.length < perPage) break
      page++
    }

    if (!instructor) {
      return NextResponse.json(
        { error: "과정을 찾을 수 없어요. 과정코드를 다시 확인해주세요." },
        { status: 404 }
      )
    }

    return NextResponse.json({
      courseData: instructor.course_data ?? null,
      courseName: instructor.course_name ?? "",
      instructorName: instructor.full_name ?? "강사",
    })
  } catch (err) {
    console.error("[GET /api/course/data]", err)
    const msg = err instanceof Error ? err.message : "서버 오류"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
