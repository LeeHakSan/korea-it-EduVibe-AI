import { createClient } from '@supabase/supabase-js'

// 환경 변수에서 URL과 Anon Key를 가져옵니다.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 만약 환경 변수가 없다면 에러를 발생시켜 개발자가 알 수 있게 합니다.
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL 또는 Anon Key가 설정되지 않았습니다. .env.local 파일을 확인하세요.')
}

// Supabase 클라이언트를 생성하여 내보냅니다.
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 서버 라우트(handler)에서 사용할 Supabase 클라이언트.
// 현재 프로젝트는 anon key 기반이므로, 클라이언트와 동일 인스턴스를 반환합니다.
export function getSupabaseServer() {
  return supabase;
}