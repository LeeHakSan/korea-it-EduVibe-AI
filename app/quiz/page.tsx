"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  CircleHelp,
  ClipboardList,
  Sparkles,
  FileText,
  Brain,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type MaterialItem = {
  id: number;
  class_id?: string | null;
  filename: string;
  content: string;
};

type Question = {
  id: number;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
  unit: string;
};

export default function QuizPage() {
  const router = useRouter();

  const [materialsClassId, setMaterialsClassId] = useState("1");
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState<number | null>(null);
  const [materialsLoading, setMaterialsLoading] = useState(true);
  const [materialsError, setMaterialsError] = useState<string | null>(null);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);

  const selectedMaterial =
    materials.find((m) => m.id === selectedMaterialId) ?? null;

  useEffect(() => {
    async function loadMaterials() {
      setMaterialsLoading(true);
      setMaterialsError(null);

      try {
        const { data, error } = await supabase
          .from("materials")
          .select("id, class_id, filename, content")
          .eq("class_id", materialsClassId);

        if (error) {
          setMaterialsError(error.message);
          setMaterials([]);
          setSelectedMaterialId(null);
          return;
        }

        const safe = (data ?? []).filter(
          (item) =>
            typeof item?.filename === "string" && typeof item?.content === "string"
        ) as MaterialItem[];

        setMaterials(safe);
        setSelectedMaterialId(safe[0]?.id ?? null);
      } catch {
        setMaterialsError("자료를 불러오지 못했습니다.");
        setMaterials([]);
        setSelectedMaterialId(null);
      } finally {
        setMaterialsLoading(false);
      }
    }

    void loadMaterials();
  }, [materialsClassId]);

  const generateQuiz = async () => {
    if (!selectedMaterial) {
      setQuizError("문제 생성에 사용할 자료를 먼저 선택하세요.");
      return;
    }

    setQuizLoading(true);
    setQuizError(null);
    setQuestions([]);
    setAnswers([]);
    setCurrent(0);

    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: selectedMaterial.filename,
          content: selectedMaterial.content,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error ?? `문제 생성 실패 (${res.status})`);
      }

      const quiz = Array.isArray(data?.quiz) ? data.quiz : [];

      if (quiz.length === 0) {
        throw new Error("생성된 문제가 없습니다.");
      }

      setQuestions(quiz);
      setAnswers(Array(quiz.length).fill(null));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "문제 생성 중 오류가 발생했습니다.";
      setQuizError(message);
    } finally {
      setQuizLoading(false);
    }
  };

  const currentQuestion = questions[current];
  const selectedAnswer = answers[current];

  const answeredCount = answers.filter((v) => v !== null).length;
  const remainingCount = questions.length - answeredCount;
  const progress = questions.length
    ? Math.round((answeredCount / questions.length) * 100)
    : 0;

  const weakUnits = useMemo(() => {
    const wrongUnits = questions
      .map((q, i) =>
        answers[i] !== null && answers[i] !== q.answer ? q.unit : null
      )
      .filter(Boolean) as string[];

    return [...new Set(wrongUnits)];
  }, [answers, questions]);

  const handleSelect = (index: number) => {
    const next = [...answers];
    next[current] = index;
    setAnswers(next);
  };

  const handlePrev = () => {
    if (current > 0) setCurrent(current - 1);
  };

  const handleNext = () => {
    if (current < questions.length - 1) setCurrent(current + 1);
  };

  const handleSubmit = () => {
    if (!questions.length) return;

    const score = questions.reduce((acc, q, i) => {
      return acc + (answers[i] === q.answer ? 1 : 0);
    }, 0);

    const payload = {
      score,
      total: questions.length,
      results: questions.map((q, i) => ({
        id: q.id,
        question: q.question,
        options: q.options,
        userAnswer: answers[i],
        correctAnswer: q.answer,
        explanation: q.explanation,
        unit: q.unit,
        isCorrect: answers[i] === q.answer,
      })),
      weakUnits,
      materialTitle: selectedMaterial?.filename ?? "",
    };

    localStorage.setItem("quizResult", JSON.stringify(payload));
    router.push("/result");
  };

  return (
    <main className="min-h-screen bg-[#f7f7f7] p-4 md:p-8 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-80px] left-[-80px] w-[240px] h-[240px] rounded-full bg-[#ddf4ff]" />
        <div className="absolute top-[100px] right-[-60px] w-[200px] h-[200px] rounded-full bg-[#f0fff0]" />
        <div className="absolute bottom-[-100px] left-[15%] w-[280px] h-[280px] rounded-full bg-[#fff7e6]" />
        <div className="absolute bottom-[80px] right-[8%] w-[150px] h-[150px] rounded-full bg-[#ffeaf4]" />
        <div className="absolute top-[45%] left-[48%] w-[120px] h-[120px] rounded-full bg-[#eef9ff]" />
      </div>

      <div className="mx-auto max-w-7xl relative z-10">
        <div className="mb-6 bg-white/90 backdrop-blur-sm rounded-[28px] p-6 border-2 border-[#e5e5e5] shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
            <div>
              <p className="text-sm font-black text-[#1cb0f6]">EduVibe-AI</p>
              <h1 className="text-3xl md:text-4xl font-black text-[#3c3c3c] mt-1">
                AI 자동 쪽지시험
              </h1>
              <p className="mt-2 text-[#777] font-semibold leading-6">
                수업 자료를 선택하면 AI가 핵심 개념 기반으로 문제 5개를 자동 생성합니다.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="px-4 py-3 rounded-2xl bg-[#eaf7ff] border border-[#cdeeff]">
                <p className="text-xs font-bold text-[#1cb0f6]">문제 수</p>
                <p className="text-lg font-black text-[#3c3c3c]">5문항</p>
              </div>
              <div className="px-4 py-3 rounded-2xl bg-[#f0fff0] border border-[#d7f5b5]">
                <p className="text-xs font-bold text-[#58cc02]">생성 방식</p>
                <p className="text-lg font-black text-[#3c3c3c]">AI 자동 생성</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 bg-white rounded-3xl p-5 border-2 border-[#e5e5e5] shadow-[0_8px_24px_rgba(0,0,0,0.03)]">
          <div className="grid grid-cols-1 lg:grid-cols-[120px_1fr_auto] gap-3 items-center">
            <label className="text-sm font-bold text-[#3c3c3c]">class_id</label>

            <input
              value={materialsClassId}
              onChange={(e) => setMaterialsClassId(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-2xl text-[14px] outline-none bg-white text-gray-800 focus:border-blue-400"
            />

            <button
              type="button"
              onClick={generateQuiz}
              disabled={materialsLoading || quizLoading || !selectedMaterial}
              className="px-5 py-3 rounded-2xl bg-[#58cc02] text-white font-bold border-b-4 border-[#46a302] hover:bg-[#58cc02]/90 active:border-b-0 active:translate-y-1 transition-all disabled:opacity-50"
            >
              {quizLoading ? "문제 생성 중..." : "AI 문제 생성"}
            </button>
          </div>

          <div className="mt-4">
            {materialsLoading ? (
              <p className="text-[#777] font-semibold text-sm">자료 불러오는 중...</p>
            ) : materialsError ? (
              <p className="text-red-600 font-bold text-sm">{materialsError}</p>
            ) : materials.length === 0 ? (
              <p className="text-[#777] font-semibold text-sm">
                해당 class_id에 자료가 없습니다.
              </p>
            ) : (
              <select
                value={selectedMaterialId ?? ""}
                onChange={(e) => setSelectedMaterialId(Number(e.target.value))}
                className="w-full px-3 py-3 border border-gray-300 rounded-2xl text-[14px] outline-none bg-white text-gray-800 focus:border-blue-400"
              >
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.filename}
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedMaterial && (
            <div className="mt-4 bg-[#fafafa] rounded-2xl border border-[#e5e5e5] p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-[#58cc02]" />
                <p className="font-bold text-[#3c3c3c] text-sm">선택 자료 미리보기</p>
              </div>
              <pre className="text-[#777] font-semibold text-sm whitespace-pre-wrap max-h-44 overflow-auto">
                {selectedMaterial.content.slice(0, 700)}
                {selectedMaterial.content.length > 700 ? "..." : ""}
              </pre>
            </div>
          )}

          {quizError && (
            <p className="mt-4 text-red-600 font-bold text-sm">{quizError}</p>
          )}
        </div>

        {!questions.length ? (
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
            <div className="bg-white rounded-3xl p-10 border-2 border-[#e5e5e5] text-center shadow-[0_8px_24px_rgba(0,0,0,0.03)]">
              <div className="w-16 h-16 rounded-full bg-[#ddf4ff] mx-auto flex items-center justify-center mb-4">
                <Brain className="w-8 h-8 text-[#1cb0f6]" />
              </div>
              <p className="text-[#3c3c3c] font-black text-xl">
                자료를 선택하고 AI 문제 생성을 눌러라
              </p>
              <p className="mt-2 text-[#777] font-semibold">
                지금은 생성된 문제가 없어서 시험 화면을 띄우지 않았다.
              </p>
            </div>

            <aside className="space-y-6">
              <div className="bg-white rounded-3xl p-5 border-2 border-[#e5e5e5] shadow-[0_8px_24px_rgba(0,0,0,0.03)]">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-[#58cc02]" />
                  <h3 className="text-lg font-black text-[#3c3c3c]">이 화면에서 되는 것</h3>
                </div>
                <ul className="space-y-2 text-sm text-[#777] font-semibold leading-6">
                  <li>• Supabase에 저장된 수업 자료 불러오기</li>
                  <li>• 선택한 자료 기준으로 AI 문제 자동 생성</li>
                  <li>• 제출 후 결과 페이지에서 오답 확인</li>
                </ul>
              </div>

              <div className="bg-[#fff7e6] rounded-3xl p-5 border-2 border-[#ffc800] shadow-[0_8px_24px_rgba(0,0,0,0.03)]">
                <h3 className="text-lg font-black text-[#ff9600] mb-2">학습 팁</h3>
                <p className="text-sm font-semibold text-[#8a5a00] leading-6">
                  class_id가 맞아야 자료가 보인다. 먼저 업로드한 PDF가 있는지부터 확인해라.
                </p>
              </div>
            </aside>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
            <section className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-3xl p-5 border-2 border-[#e5e5e5] shadow-[0_8px_24px_rgba(0,0,0,0.03)]">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-[#ddf4ff] flex items-center justify-center">
                      <ClipboardList className="w-5 h-5 text-[#1cb0f6]" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#777]">진행 문제</p>
                      <p className="text-2xl font-black text-[#3c3c3c]">
                        {current + 1} / {questions.length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-5 border-2 border-[#e5e5e5] shadow-[0_8px_24px_rgba(0,0,0,0.03)]">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-[#f0fff0] flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-[#58cc02]" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#777]">완료 문항</p>
                      <p className="text-2xl font-black text-[#3c3c3c]">
                        {answeredCount}개
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-5 border-2 border-[#e5e5e5] shadow-[0_8px_24px_rgba(0,0,0,0.03)]">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-[#fff7e6] flex items-center justify-center">
                      <CircleHelp className="w-5 h-5 text-[#ff9600]" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#777]">남은 문항</p>
                      <p className="text-2xl font-black text-[#3c3c3c]">
                        {remainingCount}개
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-5 border-2 border-[#e5e5e5] shadow-[0_8px_24px_rgba(0,0,0,0.03)]">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <p className="font-black text-[#3c3c3c]">학습 진행률</p>
                  <p className="text-sm font-bold text-[#58cc02]">{progress}%</p>
                </div>
                <div className="relative h-4 bg-[#e5e5e5] rounded-full overflow-hidden">
                  <div
                    className="absolute left-0 top-0 h-full bg-[#58cc02] rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 md:p-8 border-2 border-[#e5e5e5] shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                  <span className="px-3 py-1 rounded-full bg-[#eaf7ff] text-[#1cb0f6] text-sm font-bold border border-[#cdeeff]">
                    {currentQuestion.unit}
                  </span>
                  <span className="text-sm font-bold text-[#777]">
                    문제 {current + 1}
                  </span>
                </div>

                <h2 className="text-2xl font-black text-[#3c3c3c] leading-relaxed mb-6">
                  {currentQuestion.question}
                </h2>

                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => {
                    const isSelected = selectedAnswer === index;

                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleSelect(index)}
                        className={`w-full text-left px-4 py-4 rounded-2xl font-bold border-b-4 transition-all ${
                          isSelected
                            ? "bg-[#1cb0f6] text-white border-[#1899d6]"
                            : "bg-white text-[#3c3c3c] border-[#e5e5e5] hover:bg-[#f7f7f7]"
                        }`}
                      >
                        <span className="mr-2">{index + 1}.</span>
                        {option}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handlePrev}
                    disabled={current === 0}
                    className="px-5 py-3 rounded-2xl bg-white text-[#3c3c3c] font-bold border-2 border-[#e5e5e5] disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    이전 문제
                  </button>

                  {current === questions.length - 1 ? (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      className="px-6 py-3 rounded-2xl bg-[#58cc02] text-white font-bold border-b-4 border-[#46a302] hover:bg-[#58cc02]/90 active:border-b-0 active:translate-y-1 transition-all"
                    >
                      제출하기
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="px-6 py-3 rounded-2xl bg-[#1cb0f6] text-white font-bold border-b-4 border-[#1899d6] hover:bg-[#1cb0f6]/90 active:border-b-0 active:translate-y-1 transition-all"
                    >
                      다음 문제
                    </button>
                  )}
                </div>
              </div>
            </section>

            <aside className="space-y-6">
              <div className="bg-white rounded-3xl p-5 border-2 border-[#e5e5e5] shadow-[0_8px_24px_rgba(0,0,0,0.03)]">
                <h3 className="text-lg font-black text-[#3c3c3c] mb-4">문제 이동</h3>
                <div className="grid grid-cols-5 gap-2">
                  {questions.map((_, index) => {
                    const isCurrent = current === index;
                    const isAnswered = answers[index] !== null;

                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setCurrent(index)}
                        className={`h-11 rounded-2xl font-black transition-all ${
                          isCurrent
                            ? "bg-[#1cb0f6] text-white border-b-4 border-[#1899d6]"
                            : isAnswered
                            ? "bg-[#58cc02] text-white border-b-4 border-[#46a302]"
                            : "bg-[#f7f7f7] text-[#777] border-2 border-[#e5e5e5]"
                        }`}
                      >
                        {index + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white rounded-3xl p-5 border-2 border-[#e5e5e5] shadow-[0_8px_24px_rgba(0,0,0,0.03)]">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-[#58cc02]" />
                  <h3 className="text-lg font-black text-[#3c3c3c]">학습 안내</h3>
                </div>
                <ul className="space-y-2 text-sm text-[#777] font-semibold leading-6">
                  <li>• 문제는 선택한 수업 자료 기준으로 자동 생성됨</li>
                  <li>• 틀린 문제는 결과 페이지에서 바로 복습 가능</li>
                  <li>• 약한 단원은 보충자료 생성 기능으로 이어붙이면 된다</li>
                </ul>
              </div>

              <div className="bg-white rounded-3xl p-5 border-2 border-[#e5e5e5] shadow-[0_8px_24px_rgba(0,0,0,0.03)]">
                <h3 className="text-lg font-black text-[#3c3c3c] mb-3">현재 상태</h3>
                <div className="space-y-3 text-sm font-semibold text-[#777]">
                  <div>
                    <p className="text-[#3c3c3c] font-bold">선택 자료</p>
                    <p>{selectedMaterial?.filename ?? "-"}</p>
                  </div>
                  <div>
                    <p className="text-[#3c3c3c] font-bold">현재 단원</p>
                    <p>{currentQuestion.unit}</p>
                  </div>
                  <div>
                    <p className="text-[#3c3c3c] font-bold">선택한 답</p>
                    <p>
                      {selectedAnswer !== null
                        ? `${selectedAnswer + 1}번 선택 완료`
                        : "아직 선택 안 함"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#3c3c3c] font-bold">예상 약점 단원</p>
                    <p>{weakUnits.length > 0 ? weakUnits.join(", ") : "아직 없음"}</p>
                  </div>
                </div>
              </div>

              <div className="bg-[#fff7e6] rounded-3xl p-5 border-2 border-[#ffc800] shadow-[0_8px_24px_rgba(0,0,0,0.03)]">
                <h3 className="text-lg font-black text-[#ff9600] mb-2">오늘 목표</h3>
                <p className="text-sm font-semibold text-[#8a5a00] leading-6">
                  5문항을 끝까지 풀고, 제출 후 틀린 문제 2개만 다시 읽어보자.
                </p>
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}