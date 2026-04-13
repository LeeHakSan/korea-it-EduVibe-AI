import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

/**
 * Next.js Middleware — 세션 갱신 + 역할 기반 라우트 보호
 *
 * 역할 판단 규칙:
 *   - user_metadata.role === "teacher"  → 강사
 *   - user_metadata.role === "student"     → 수강생
 *   - role === "admin" 또는 미설정(Supabase 대시보드 직접 생성) → 관리자
 *
 * 동작:
 *   1. Supabase 세션 쿠키 갱신
 *   2. 비인증 사용자가 /dashboard/* 접근 → /login 리다이렉트
 *   3. /dashboard (루트) 접근 → 역할별 홈으로 리다이렉트
 *   4. /dashboard/admin/* 접근 → 관리자만 허용, 나머지는 /dashboard/home
 *   5. 로그인/회원가입 페이지를 이미 로그인한 채로 접근 → 역할별 홈으로 리다이렉트
 */

/** user_metadata 로부터 역할 반환 (Edge 런타임에서 lib/auth.ts 대신 인라인 사용) */
function resolveRole(user: { user_metadata?: Record<string, unknown> } | null): "admin" | "teacher" | "student" {
  if (!user) return "student"
  const role = user.user_metadata?.role as string | undefined
  if (role === "teacher") return "teacher"
  if (role === "student") return "student"
  return "admin" // "admin" 이거나 미설정 → 관리자
}

/** 역할별 기본 랜딩 경로 */
function homePath(role: "admin" | "teacher" | "student"): string {
  if (role === "admin") return "/dashboard/admin"
  if (role === "teacher") return "/dashboard/teacher"
  return "/dashboard/home"
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { pathname } = request.nextUrl

  const redirect = (path: string) => {
    const url = request.nextUrl.clone()
    url.pathname = path
    return NextResponse.redirect(url)
  }

  // ── 0. 공개 페이지 (/) → 인증 체크 없이 통과 ─────────────────
  // 단, 로그인된 사용자는 대시보드로 리다이렉트
  if (pathname === "/" || pathname === "") {
    // 세션 확인 (실패해도 랜딩 페이지 정상 표시)
    const { data: { user: landingUser } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }))
    if (landingUser) return redirect(homePath(resolveRole(landingUser)))
    return supabaseResponse
  }

  // ※ getUser() 이전에 절대 다른 응답을 반환하지 말 것 (세션 갱신을 위해)
  const { data: { user } } = await supabase.auth.getUser()
  const role = resolveRole(user)

  // ── 1. 비인증 사용자 → /login ────────────────────────────────
  const isProtected = pathname.startsWith("/dashboard") || pathname.startsWith("/api/questions") || pathname.startsWith("/api/quiz-results")
  if (isProtected && !user) return redirect("/login")

  // ── 2. /dashboard (루트) → 역할별 홈 ─────────────────────────
  if (pathname === "/dashboard" || pathname === "/dashboard/") {
    return redirect(homePath(role))
  }

  // ── 3. 역할별 라우트 보호 ─────────────────────────────────────
  // /dashboard/admin/* → 관리자만 허용
  if (pathname.startsWith("/dashboard/admin") && role !== "admin") {
    return redirect(homePath(role))
  }
  // /dashboard/teacher/* → 강사만 허용
  if (pathname.startsWith("/dashboard/teacher") && role !== "teacher") {
    return redirect(homePath(role))
  }
  // /dashboard/home/* → 수강생만 허용 (강사·관리자는 자신의 홈으로)
  if (pathname.startsWith("/dashboard/home") && role !== "student") {
    return redirect(homePath(role))
  }

  // ── 4. 이미 로그인된 사용자가 /login·/signup 접근 ────────────
  if ((pathname === "/login" || pathname === "/signup") && user) {
    return redirect(homePath(role))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
