/**
 * Auth 유틸리티
 * 서버 컴포넌트와 클라이언트 컴포넌트 양쪽에서 역할 정보를 꺼내는 헬퍼들
 */

export type UserRole = "student" | "instructor"

/**
 * Supabase user 객체에서 역할을 추출합니다.
 * 저장 우선순위: user_metadata.role → app_metadata.role → 기본값 "student"
 */
export function getRoleFromUser(
  user: { user_metadata?: Record<string, unknown>; app_metadata?: Record<string, unknown> } | null
): UserRole {
  if (!user) return "student"
  const role =
    (user.user_metadata?.role as string) ??
    (user.app_metadata?.role as string) ??
    "student"
  return role === "instructor" ? "instructor" : "student"
}

/**
 * 역할별 대시보드 경로
 */
export function getDashboardPath(role: UserRole): string {
  return role === "instructor" ? "/dashboard/instructor" : "/dashboard/student"
}
