import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

/**
 * Google OAuth 콜백 핸들러
 * Supabase가 OAuth 완료 후 ?code=... 를 이 URL로 돌려보냄
 * code를 세션 쿠키로 교환한 뒤, 역할(role)에 따라 대시보드로 리다이렉트
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/dashboard"

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error("[auth/callback] exchangeCodeForSession error:", error.message)
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  // 로그인 성공 → 역할 기반 리다이렉트는 /dashboard 미들웨어에서 처리
  return NextResponse.redirect(`${origin}${next}`)
}
