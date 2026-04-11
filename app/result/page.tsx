"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, CircleX, Trophy } from "lucide-react";

type ResultItem = {
  id: number;
  question: string;
  options: string[];
  userAnswer: number | null;
  correctAnswer: number;
  explanation: string;
  unit: string;
  isCorrect: boolean;
};

type QuizResult = {
  score: number;
  total: number;
  results: ResultItem[];
  weakUnits: string[];
  materialTitle?: string;
};

export default function ResultPage() {
  const [data, setData] = useState<QuizResult | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("quizResult");
    if (stored) setData(JSON.parse(stored));
  }, []);

  if (!data) {
    return (
      <main className="min-h-screen bg-[#f7f7f7] p-6">
        <div className="max-w-3xl mx-auto bg-white rounded-3xl p-8 border-2 border-[#e5e5e5]">
          <h1 className="text-2xl font-black text-[#3c3c3c]">결과가 없습니다</h1>
          <p className="mt-2 text-[#777] font-semibold">먼저 시험을 풀고 와야 한다.</p>
          <Link
            href="/quiz"
            className="inline-block mt-5 px-5 py-3 rounded-2xl bg-[#1cb0f6] text-white font-bold border-b-4 border-[#1899d6]"
          >
            시험 보러 가기
          </Link>
        </div>
      </main>
    );
  }

  const wrongCount = data.total - data.score;
  const percent = Math.round((data.score / data.total) * 100);

  return (
    <main className="min-h-screen bg-[#f7f7f7] p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <p className="text-sm font-bold text-[#58cc02]">EduVibe-AI</p>
          <h1 className="text-3xl md:text-4xl font-black text-[#3c3c3c]">
            시험 결과
          </h1>
          {data.materialTitle && (
            <p className="mt-2 text-[#777] font-semibold">
              기준 자료: {data.materialTitle}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-3xl p-5 border-2 border-[#e5e5e5]">
            <p className="text-sm font-bold text-[#777]">점수</p>
            <p className="text-3xl font-black text-[#3c3c3c] mt-2">
              {data.score} / {data.total}
            </p>
          </div>

          <div className="bg-white rounded-3xl p-5 border-2 border-[#e5e5e5]">
            <p className="text-sm font-bold text-[#777]">정답률</p>
            <p className="text-3xl font-black text-[#1cb0f6] mt-2">{percent}%</p>
          </div>

          <div className="bg-white rounded-3xl p-5 border-2 border-[#e5e5e5]">
            <p className="text-sm font-bold text-[#777]">오답 수</p>
            <p className="text-3xl font-black text-[#ff4b4b] mt-2">{wrongCount}</p>
          </div>

          <div className="bg-white rounded-3xl p-5 border-2 border-[#e5e5e5]">
            <p className="text-sm font-bold text-[#777]">약점 단원</p>
            <p className="text-lg font-black text-[#3c3c3c] mt-2">
              {data.weakUnits.length > 0 ? data.weakUnits.join(", ") : "없음"}
            </p>
          </div>
        </div>

        <div className="bg-[#fff7e6] rounded-3xl p-5 border-2 border-[#ffc800] mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-[#ff9600]" />
            <p className="font-black text-[#ff9600]">AI 피드백</p>
          </div>
          <p className="text-[#8a5a00] font-semibold leading-6">
            {percent >= 80
              ? "좋다. 핵심 개념은 잘 잡혀 있다. 틀린 문제만 다시 보면 된다."
              : percent >= 60
              ? "기본은 이해했는데 헷갈리는 부분이 있다. 오답 위주 복습이 필요하다."
              : "아직 개념이 약하다. 단원 요약부터 다시 보고 문제를 한 번 더 풀어라."}
          </p>
        </div>

        <div className="space-y-4">
          {data.results.map((item, index) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl p-5 border-2 border-[#e5e5e5]"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div>
                  <p className="text-sm font-bold text-[#777]">문제 {index + 1}</p>
                  <h2 className="text-lg font-black text-[#3c3c3c]">
                    {item.question}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-[#f7f7f7] text-[#777] text-sm font-bold border border-[#e5e5e5]">
                    {item.unit}
                  </span>
                  {item.isCorrect ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#f0fff0] text-[#46a302] text-sm font-bold border border-[#cdecb5]">
                      <CheckCircle2 className="w-4 h-4" />
                      정답
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#fff0f0] text-[#ff4b4b] text-sm font-bold border border-[#ffd4d4]">
                      <CircleX className="w-4 h-4" />
                      오답
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-sm font-semibold text-[#777] leading-6">
                <p>
                  <span className="text-[#3c3c3c] font-bold">내 답:</span>{" "}
                  {item.userAnswer !== null ? item.options[item.userAnswer] : "선택 안 함"}
                </p>
                <p>
                  <span className="text-[#3c3c3c] font-bold">정답:</span>{" "}
                  {item.options[item.correctAnswer]}
                </p>
                <p>
                  <span className="text-[#3c3c3c] font-bold">해설:</span>{" "}
                  {item.explanation}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/quiz"
            className="px-6 py-3 rounded-2xl bg-[#1cb0f6] text-white font-bold border-b-4 border-[#1899d6]"
          >
            다시 풀기
          </Link>
          <Link
            href="/dashboard"
            className="px-6 py-3 rounded-2xl bg-white text-[#3c3c3c] font-bold border-2 border-[#e5e5e5]"
          >
            대시보드로 이동
          </Link>
        </div>
      </div>
    </main>
  );
}