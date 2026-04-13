/**
 * /api/attendance
 * GET  : 본인 출석 데이터 / 강사 → 담당 학생 전체
 * POST : 오늘 출석 체크 (중복 방지)
 */
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

export const runtime = "nodejs"

function todayKST() {
  // Returns YYYY-MM-DD in KST timezone
  const d = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }))
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

async function verifyUser(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? ""
  if (!auth.startsWith("Bearer ")) return null
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: { user } } = await supabase.auth.getUser(auth.slice(7))
  return user
}

export async function GET(req: NextRequest) {
  const user = await verifyUser(req)
  if (!user) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 })
  const admin = getSupabaseAdmin()

  // 강사: 담당 과정의 학생 전체 출석 반환
  if (user.user_metadata?.role === "teacher") {
    const teacherAuthKey = (user.user_metadata?.auth_key as string) ?? ""
    let page = 1
    const all: { userId: string; name: string; email: string; courseCode: string; courseName: string; attendance: string[]; xp: number }[] = []
    while (true) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
      if (error || !data.users.length) break
      for (const u of data.users) {
        const meta = u.user_metadata ?? {}
        const role = (meta.role as string) ?? ""
        if (role !== "student") continue
        if (teacherAuthKey && (meta.course_code as string) !== teacherAuthKey) continue
        all.push({
          userId: u.id,
          name: (meta.full_name as string) ?? u.email ?? "",
          email: u.email ?? "",
          courseCode: (meta.course_code as string) ?? "",
          courseName: (meta.course_name as string) ?? "",
          attendance: (meta.attendance as string[]) ?? [],
          xp: (meta.xp as number) ?? 0,
        })
      }
      if (data.users.length < 1000) break
      page++
    }
    return NextResponse.json({ students: all })
  }

  return NextResponse.json({
    attendance: (user.user_metadata?.attendance as string[]) ?? [],
    xp: (user.user_metadata?.xp as number) ?? 0,
  })
}

export async function POST(req: NextRequest) {
  const user = await verifyUser(req)
  if (!user) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 })

  const today = todayKST()
  const existing: string[] = (user.user_metadata?.attendance as string[]) ?? []
  if (existing.includes(today))
    return NextResponse.json({ ok: true, alreadyChecked: true, date: today })

  const admin = getSupabaseAdmin()
  const updated = [...existing, today]
  const { error } = await admin.auth.admin.updateUserById(user.id, {
    user_metadata: { ...user.user_metadata, attendance: updated },
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, alreadyChecked: false, date: today, total: updated.length })
}
