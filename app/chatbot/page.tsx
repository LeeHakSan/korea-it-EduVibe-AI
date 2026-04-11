"use client";

import { FormEvent, useState } from "react";

type Message = {
  role: "user" | "model";
  text: string;
};

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      text: "안녕하세요! 수업 도우미 AI 튜터예요 😊\n오늘 배운 내용에서 막히는 부분을 편하게 질문해보세요!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const text = input.trim();
    if (!text || loading) return;

    const userMessage: Message = {
      role: "user",
      text,
    };

    const historyForServer = messages;

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text,
          history: historyForServer,
        }),
      });

      const raw = await res.text();
      console.log("RAW RESPONSE:", raw);

      let data: {
        ok?: boolean;
        reply?: string;
        error?: string;
        detail?: string;
      };

      try {
        data = JSON.parse(raw);
      } catch {
        throw new Error(`서버가 JSON이 아닌 응답을 반환했습니다: ${raw}`);
      }

      if (!res.ok) {
        throw new Error(data.detail || data.error || "요청 실패");
      }

      if (!data.reply) {
        throw new Error("응답 본문에 reply가 없습니다.");
      }

      const botMessage: Message = {
        role: "model",
        text: data.reply,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "알 수 없는 오류";

      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: `오류: ${errorMessage}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col bg-white p-6">
      <h1 className="mb-6 text-2xl font-bold text-black">AI 챗봇</h1>

      <section className="mb-4 flex-1 overflow-y-auto rounded-2xl border border-gray-200 bg-gray-50 p-4">
        <div className="space-y-4">
          {messages.map((msg, index) => {
            const isUser = msg.role === "user";

            return (
              <div
                key={`${msg.role}-${index}`}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                    isUser
                      ? "bg-black text-white"
                      : "border border-gray-200 bg-white text-gray-900"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm">
                답변 생성 중...
              </div>
            </div>
          )}
        </div>
      </section>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="질문을 입력하세요"
          disabled={loading}
          className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          전송
        </button>
      </form>
    </main>
  );
}