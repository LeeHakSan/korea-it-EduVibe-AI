/**
 * POST /api/code/mark-used
 * 더 이상 사용되지 않는 엔드포인트 (관리자 초대코드 시스템 제거됨)
 */
import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function POST() {
  return NextResponse.json({ ok: true })
}
