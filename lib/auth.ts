/**
 * Auth 유틸리티
 * 서버/클라이언트 양쪽에서 역할 정보를 꺼내는 헬퍼들
 */

export type UserRole = "admin" | "instructor" | "student"

type UserLike = {
  user_metadata?: Record<string, unknown>
  app_metadata?: Record<string, unknown>
} | null

/** Supabase user 객체에서 역할 추출
 *
 * ※ Supabase 대시보드에서 직접 생성한 계정은 role 메타데이터가 없음.
 *   role 이 명시되지 않은(undefined/null/"") 계정은 관리자로 처리한다.
 *   (회원가입 페이지를 통한 계정은 항상 role 을 명시적으로 저장함)
 */
export function getRoleFromUser(user: UserLike): UserRole {
  if (!user) return "student"
  const role =
    (user.user_metadata?.role as string | undefined) ??
    (user.app_metadata?.role as string | undefined)

  // role 이 명시적으로 "instructor" 또는 "student" 인 경우에만 해당 역할 반환
  if (role === "instructor") return "instructor"
  if (role === "student") return "student"

  // role 이 "admin" 이거나 아예 미설정(Supabase 대시보드 직접 생성)이면 관리자
  return "admin"
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

/**
 * API 라우트에서 사용하는 관리자 여부 판단
 *
 * Supabase 대시보드에서 직접 생성한 계정은 role 메타데이터가 없으므로
 * role 이 "instructor" 또는 "student" 로 명시된 경우만 관리자가 아닌 것으로 처리.
 */
export function isAdminUser(user: UserLike): boolean {
  if (!user) return false
  const role =
    (user.user_metadata?.role as string | undefined) ??
    (user.app_metadata?.role as string | undefined)
  // 명시적으로 일반 역할인 경우만 제외
  if (role === "instructor" || role === "student") return false
  return true // "admin" 이거나 미설정 모두 관리자
}
