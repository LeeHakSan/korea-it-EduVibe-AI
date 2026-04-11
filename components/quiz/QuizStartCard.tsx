"use client";

import Link from "next/link";

export default function QuizStartCard() {
  return (
    <section className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6 shadow-lg">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="mb-2 text-sm text-neutral-400">EduVibe AI</p>
          <h2 className="text-2xl font-bold text-white">자료 기반 쪽지시험</h2>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-black">
          Demo
        </span>
      </div>

      <p className="mb-6 leading-7 text-neutral-300">
        업로드한 학습 자료를 바탕으로 핵심 개념을 점검하는 미니 테스트다.
        지금 버전은 데모용 더미 데이터 기반이지만, 나중에 API만 붙이면 바로 자동 생성형으로 확장 가능하다.
      </p>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-neutral-950 p-4">
          <p className="text-sm text-neutral-400">문항 수</p>
          <p className="mt-1 text-lg font-bold text-white">5문항</p>
        </div>
        <div className="rounded-2xl bg-neutral-950 p-4">
          <p className="text-sm text-neutral-400">평가 방식</p>
          <p className="mt-1 text-lg font-bold text-white">객관식</p>
        </div>
        <div className="rounded-2xl bg-neutral-950 p-4">
          <p className="text-sm text-neutral-400">결과 제공</p>
          <p className="mt-1 text-lg font-bold text-white">점수 + 해설</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/quiz"
          className="rounded-2xl bg-white px-5 py-3 font-bold text-black transition hover:opacity-90"
        >
          쪽지시험 시작하기
        </Link>

        <Link
          href="/result"
          className="rounded-2xl border border-neutral-700 px-5 py-3 font-bold text-white transition hover:bg-neutral-800"
        >
          최근 결과 보기
        </Link>
      </div>
    </section>
  );
}