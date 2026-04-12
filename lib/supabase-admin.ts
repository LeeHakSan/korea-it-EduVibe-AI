/**
 * Supabase Admin 클라이언트 (서버사이드 전용)
 * API Route 에서만 import 하세요. 클라이언트 컴포넌트에서는 절대 사용 금지.
 *
 * 환경변수 필요:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY  ← Supabase 대시보드 > Settings > API > service_role
 */
import { createClient } from "@supabase/supabase-js"

export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY 환경변수를 .env.local 에 추가해주세요.\n" +
      "Supabase 대시보드 > Settings > API > service_role secret"
    )
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
