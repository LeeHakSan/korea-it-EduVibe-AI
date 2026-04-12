/**
 * GET /api/admin/users
 * 관리자 전용: 전체 사용자 목록과 과정 통계를 반환합니다.
 */
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
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
  if (user.user_metadata?.role !== "admin") {
    return NextResponse.json({ error: "관리자 권한이 필요해요." }, { status: 403 })
  }

  // 2. 전체 사용자 조회
  try {
    const admin = getSupabaseAdmin()
    const allUsers: {
      id: string
      email: string
      role: string
      full_name: string
      course_name: string
      course_code: string
      createdAt: string
    }[] = []

    let page = 1
    while (true) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
      if (error) throw error
      if (!data.users.length) break

      for (const u of data.users) {
        const meta = u.user_metadata ?? {}
        const role = (meta.role as string) ?? "student"
        allUsers.push({
          id: u.id,
          email: u.email ?? "",
          role,
          full_name: (meta.full_name as string) ?? "",
          course_name: (meta.course_name as string) ?? "",
          course_code:
            role === "instructor"
              ? (meta.auth_key as string) ?? ""
              : (meta.course_code as string) ?? "",
          createdAt: u.created_at,
        })
      }

      if (data.users.length < 1000) break
      page++
    }

    // 3. 과정별 통계 (강사 기준)
    const instructors = allUsers.filter((u) => u.role === "instructor")
    const courses = instructors.map((inst) => ({
      courseName: inst.course_name || `${inst.full_name}의 과정`,
      instructorName: inst.full_name,
      courseCode: inst.course_code,
      studentCount: allUsers.filter(
        (u) => u.role === "student" && u.course_code === inst.course_code
      ).length,
    }))

    return NextResponse.json({
      users: allUsers,
      courses,
      stats: {
        total: allUsers.length,
        admins: allUsers.filter((u) => u.role === "admin").length,
        instructors: instructors.length,
        students: allUsers.filter((u) => u.role === "student").length,
      },
    })
  } catch (err) {
    console.error("[GET /api/admin/users]", err)
    const msg = err instanceof Error ? err.message : "서버 오류"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
