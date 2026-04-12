// 대시보드 전역 공유 타입 & 데이터

export type UnitStatus = "completed" | "current" | "locked"

export type Unit = {
  id: number
  title: string
  status: UnitStatus
  xp: number
}

export type QuestionItem = {
  id: string
  text: string
  answer?: string
  createdAt: number
}

export type MaterialItem = {
  id: number
  class_id?: string | null
  filename: string
  content: string
}

export type ReviewNote = {
  id: string
  title: string
  content: string
  createdAt: number
}

export type Mission = {
  id: string
  title: string
  detail: string
}

export const learningPath: Unit[] = [
  { id: 1, title: "파이썬 기초", status: "completed", xp: 100 },
  { id: 2, title: "변수와 자료형", status: "completed", xp: 150 },
  { id: 3, title: "조건문", status: "current", xp: 200 },
  { id: 4, title: "반복문", status: "locked", xp: 200 },
  { id: 5, title: "함수", status: "locked", xp: 250 },
  { id: 6, title: "리스트와 튜플", status: "locked", xp: 250 },
  { id: 7, title: "딕셔너리", status: "locked", xp: 300 },
  { id: 8, title: "클래스", status: "locked", xp: 350 },
]

export const dailyMissions: Mission[] = [
  { id: "concept",  title: "개념 10분 정리",  detail: "핵심만 읽고, 키워드 3개만 적기" },
  { id: "practice", title: "연습 문제 5개",   detail: "오답은 체크만 하고 다음으로 넘어가기" },
  { id: "review",   title: "복습 5분",        detail: "틀린 개념을 다시 한 번 훑기" },
]

export function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString("ko-KR", {
    hour: "2-digit", minute: "2-digit", hour12: false,
  })
}

export function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("ko-KR", {
    year: "numeric", month: "2-digit", day: "2-digit",
  })
}
