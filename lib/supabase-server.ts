import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * 서버 컴포넌트 / Route Handler 전용 Supabase 클라이언트
 * 쿠키 기반 세션을 읽고 쓸 수 있어 RLS 정책이 올바르게 적용됩니다.
 *
 * 사용처: Server Components, Route Handlers (app/auth/callback, app/api/*)
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component에서 set 호출 시 무시 (읽기 전용 컨텍스트)
          }
        },
      },
    }
  )
}

/**
 * Service Role 클라이언트 — RLS 를 우회하는 관리자 권한
 * 반드시 서버 사이드에서만 사용할 것. 클라이언트 번들에 절대 포함하지 말 것.
 *
 * 사용처: 관리자 API Route (예: 강사가 수강생 전체 결과 조회)
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY 가 설정되지 않았습니다. .env.local 을 확인하세요."
    )
  }

  // Admin 클라이언트는 쿠키가 필요 없으므로 createServerClient 대신 직접 생성
  const { createClient } = require("@supabase/supabase-js")
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
