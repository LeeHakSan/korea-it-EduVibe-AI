import { createBrowserClient } from "@supabase/ssr"

/**
 * 클라이언트 컴포넌트 전용 Supabase 클라이언트 (브라우저 쿠키 세션)
 * "use client" 파일에서만 import 하세요.
 *
 * 싱글톤 패턴: 컴포넌트가 리렌더링돼도 인스턴스를 재사용합니다.
 */
let client: ReturnType<typeof createBrowserClient> | null = null

export function getSupabaseBrowser() {
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return client
}
