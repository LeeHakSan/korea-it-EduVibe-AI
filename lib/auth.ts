/**
 * Auth 유틸리티
 * 서버/클라이언트 양쪽에서 역할 정보를 꺼내는 헬퍼들
 */

export type UserRole = "admin" | "instructor" | "student"

type UserLike = {
  user_metadata?: Record<string, unknown>
  app_metadata?: Record<string, unknown>
} | null

/** Supabase user 객체에서 역할 추출 */
export function getRoleFromUser(user: UserLike): UserRole {
  if (!user) return "student"
  const role =
    (user.user_metadata?.role as string) ??
    (user.app_metadata?.role as string) ??
    "student"
  if (role === "admin") return "admin"
  if (role === "instructor") return "instructor"
  return "student"
}

/**
 * 강사: auth_key = 학생이 입력하는 과정코드
 * 학생: course_code = 강사의 auth_key
 */
export function getCourseCodeFromUser(user: UserLike): string {
  if (!user) return ""
  const role = (user.user_metadata?.role as string) ?? "student"
  if (role === "instructor") return (user.user_metadata?.auth_key as string) ?? ""
  return (user.user_metadata?.course_code as string) ?? ""
}

export function getCourseNameFromUser(user: UserLike): string {
  if (!user) return ""
  return (user.user_metadata?.course_name as string) ?? ""
}

/** 6자리 대문자 과정코드 생성 */
export function generateCourseCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

/** 역할별 로그인 후 이동 경로 */
export function getRedirectPathForRole(role: UserRole): string {
  if (role === "admin") return "/dashboard/admin"
  return "/dashboard/home"
}
