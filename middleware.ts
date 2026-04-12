import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

/**
 * Next.js Middleware — 세션 갱신 + 역할 기반 라우트 보호
 *
 * 동작 순서:
 * 1. Supabase 세션 쿠키를 갱신 (토큰 만료 방지)
 * 2. 보호된 경로(/dashboard, /api/questions, /api/quiz-results)에
 *    비인증 사용자가 접근하면 /login 으로 리다이렉트
 * 3. 이미 로그인한 사용자가 /login, /signup 에 접근하면 /dashboard 로 리다이렉트
 */
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

  // 세션 갱신 (절대 getUser() 이전에 다른 처리를 하지 말 것)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // 보호된 경로: 비인증 사용자 → /login
  const protectedRoutes = ["/dashboard", "/api/questions", "/api/quiz-results"]
  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  // 이미 로그인된 사용자가 auth 페이지 접근 → /dashboard
  const authRoutes = ["/login", "/signup"]
  if (authRoutes.includes(pathname) && user) {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * 다음 경로를 제외한 모든 요청에 미들웨어 적용:
     * - _next/static (정적 파일)
     * - _next/image (이미지 최적화)
     * - favicon.ico
     * - public 폴더 파일
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
