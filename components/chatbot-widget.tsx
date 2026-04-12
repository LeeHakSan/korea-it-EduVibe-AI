"use client"

import { useEffect, useRef, useState } from "react"
import DustLogo from "@/components/dust-logo"

type Message = {
  type: "ai" | "user"
  text: string
  time: string
  blocked?: boolean
  mode?: "h" | "f"
}

function getTime() {
  return new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
}

async function callGeminiDirect(raw: string, mode: "h" | "f") {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
  if (!apiKey) throw new Error("GEMINI API 키가 없습니다.")

  const directPrompt = `중요 규칙:
- 답변은 반드시 한국어(ko-KR)로만 작성하세요.
- 영어 문장으로 답하지 마세요.
- 한국인 학습자를 위한 친절한 존댓말로 답변하세요.

당신은 Java 수업 전용 AI 튜터입니다.
힌트 레벨: ${
    mode === "h"
      ? "HINT - 정답을 바로 알려주지 말고 힌트만 제공하세요."
      : "FULL - 정답과 예제 코드를 바로 알려주세요."
  }
수업 범위 밖의 질문(Spring, React, Python 등)은 "해당 내용은 이 수업 범위가 아닙니다. 강사님께 직접 질문해주세요." 라고만 답하세요.
답변은 한국어로 작성하세요.

user: ${raw}`

  const versions = ["v1", "v1beta"]
  const preferredOrder = [
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash-latest",
    "gemini-1.5-flash",
    "gemini-1.5-pro-latest",
    "gemini-1.5-pro",
  ]

  let lastError = "Gemini API 호출 실패"
  for (const version of versions) {
    const modelsRes = await fetch(
      `https://generativelanguage.googleapis.com/${version}/models?key=${apiKey}`,
      { method: "GET" },
    )
    const modelsJson = await modelsRes.json()

    if (!modelsRes.ok) {
      lastError = modelsJson?.error?.message ?? lastError
      continue
    }

    const models = (modelsJson?.models ?? []) as Array<{
      name?: string
      supportedGenerationMethods?: string[]
    }>

    const generatable = models
      .filter((m) => (m.supportedGenerationMethods ?? []).includes("generateContent"))
      .map((m) => (m.name ?? "").replace(/^models\//, ""))
      .filter(Boolean)

    const model =
      preferredOrder.find((p) => generatable.includes(p)) ??
      generatable.find((m) => m.includes("gemini") && !m.includes("vision") && !m.includes("embedding")) ??
      generatable[0]

    if (!model) {
      lastError = "사용 가능한 Gemini 모델이 없습니다."
      continue
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: directPrompt }] }],
        }),
      },
    )

    const json = await res.json()
    if (!res.ok) {
      lastError = json?.error?.message ?? lastError
      continue
    }

    const text =
      json?.candidates?.[0]?.content?.parts
        ?.map((p: { text?: string }) => p.text ?? "")
        .join("")
        .trim() || ""

    if (text) return text
  }

  throw new Error(lastError)
}

// 전역 타입 확장 (layout에서 주입)
declare global {
  interface Window {
    __chatbotInitialMessage?: string
  }
}

export default function ChatbotWidget({
  isOpen,
  onRequestClose,
  onRequestOpen,
  unitContext,
}: {
  isOpen: boolean
  onRequestClose: () => void
  onRequestOpen: () => void
  unitContext?: string
}) {
  const [messages, setMessages] = useState<Message[]>([
    {
      type: "ai",
      text: "안녕하세요! EduVibe AI 튜터입니다. 답변 모드를 선택하고 질문해주세요 😊",
      time: getTime(),
    },
  ])
  const [mode, setMode] = useState<"h" | "f">("h")
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const composingRef = useRef(false)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  // 챗봇이 열릴 때 단원 컨텍스트 초기 메시지 주입
  useEffect(() => {
    if (isOpen && window.__chatbotInitialMessage) {
      const initMsg = window.__chatbotInitialMessage
      window.__chatbotInitialMessage = undefined
      const welcomeMsg: Message = {
        type: "ai",
        text: initMsg,
        time: getTime(),
      }
      setMessages([welcomeMsg])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  function showToast(msg: string) {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3200)
  }

  async function send(textOverride?: string) {
    if (busy) return
    const raw = (textOverride ?? input).trim()
    if (!raw) return

    setBusy(true)
    setInput("")
    setTimeout(() => inputRef.current?.focus(), 50)

    const time = getTime()
    setMessages((prev) => [...prev, { type: "user", text: raw, time }])
    setIsTyping(true)

    try {
      const payload = {
        messages: [
          {
            role: "system",
            content: `당신은 Java 수업 전용 AI 튜터입니다.${
              unitContext ? ` 현재 단원: ${unitContext}` : ""
            }
힌트 레벨: ${
              mode === "h"
                ? "HINT - 정답을 바로 알려주지 말고 힌트만 제공하세요."
                : "FULL - 정답과 예제 코드를 바로 알려주세요."
            }
수업 범위 밖의 질문(Spring, React, Python 등)은 "해당 내용은 이 수업 범위가 아닙니다. 강사님께 직접 질문해주세요." 라고만 답하세요.
답변은 한국어로 작성하세요.`,
          },
          { role: "user", content: raw },
        ],
        stream: false,
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      let answer: string

      if (res.ok) {
        answer = data.content ?? data.answer ?? "답변을 가져올 수 없습니다."
      } else if (res.status === 404) {
        // dev 환경에서 API 라우트 인식이 깨질 때를 대비한 안전장치
        answer = await callGeminiDirect(raw, mode)
      } else {
        const msg = data?.error ?? `API 오류 (${res.status})`
        throw new Error(msg)
      }

      const isOutOfRange = answer.includes("수업 범위가 아닙니다")
      setIsTyping(false)
      setMessages((prev) => [
        ...prev,
        { type: "ai", text: answer, time: getTime(), blocked: isOutOfRange, mode },
      ])
    } catch (err) {
      const message = err instanceof Error ? err.message : "오류가 발생했습니다. 다시 시도해주세요."
      setIsTyping(false)
      showToast(message)
      setMessages((prev) => [
        ...prev,
        { type: "ai", text: message, time: getTime(), mode },
      ])
    } finally {
      setBusy(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={onRequestOpen}
        aria-label="AI 도우미 열기"
        className="fixed bottom-6 right-6 z-50 cursor-pointer hover:-translate-y-0.5 active:scale-95 transition-transform rounded-full bg-[#185FA5] w-[72px] h-[72px] flex items-center justify-center overflow-hidden shadow-lg border-b-4 border-[#1899d6]"
      >
        <DustLogo size={64} />
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[360px] h-[620px] flex flex-col bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-lg">
      {toast && (
        <div className="absolute top-[10px] left-1/2 -translate-x-1/2 bg-[#1E3A5F] text-white px-4 py-2 rounded-full text-[13px] whitespace-nowrap z-50 shadow-lg">
          {toast}
        </div>
      )}

      <div className="px-4 py-3 bg-[#185FA5] flex items-center gap-3 flex-shrink-0">
        <div className="w-[34px] h-[34px] rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2z" />
            <path d="M8 12h.01M12 12h.01M16 12h.01" />
          </svg>
        </div>
        <div className="flex-1">
          <div className="text-[15px] font-medium text-white">EduVibe AI 튜터</div>
          <div className="text-[11px] text-white/75 mt-[1px]">
            {unitContext ? `📖 ${unitContext}` : "수업 중"}
          </div>
        </div>
        <button
          type="button"
          onClick={onRequestClose}
          className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center ml-1 hover:bg-white/30 transition-colors"
          aria-label="챗봇 닫기"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50 flex-shrink-0">
        <span className="text-[12px] text-gray-500 font-medium flex-shrink-0">답변 모드</span>
        <div className="flex gap-2 flex-1">
          <button
            type="button"
            onClick={() => setMode("h")}
            className={`flex-1 py-2 rounded-xl text-[13px] font-medium flex items-center justify-center gap-1.5 transition-all border ${
              mode === "h"
                ? "bg-blue-50 text-[#0C447C] border-[#185FA5] shadow-[inset_0_0_0_1px_#B5D4F4]"
                : "bg-white text-gray-400 border-gray-200 hover:border-blue-400 hover:text-blue-400 hover:bg-blue-50"
            }`}
          >
            <span>💡</span>
            <span>힌트만 줘요</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("f")}
            className={`flex-1 py-2 rounded-xl text-[13px] font-medium flex items-center justify-center gap-1.5 transition-all border ${
              mode === "f"
                ? "bg-green-50 text-[#27500A] border-[#639922] shadow-[inset_0_0_0_1px_#C0DD97]"
                : "bg-white text-gray-400 border-gray-200 hover:border-green-500 hover:text-green-600 hover:bg-green-50"
            }`}
          >
            <span>✅</span>
            <span>전부 알려줘요</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3.5">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-2 items-end w-full ${msg.type === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            {msg.type === "ai" && (
              <div className="w-[26px] h-[26px] min-w-[26px] rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#378ADD"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  <circle cx="12" cy="16" r="1" fill="#378ADD" />
                </svg>
              </div>
            )}
            <div className={`flex flex-col max-w-[74%] ${msg.type === "user" ? "items-end" : "items-start"}`}>
              {msg.type === "ai" && !msg.blocked && msg.mode && (
                <div
                  className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full mb-1 ${
                    msg.mode === "h" ? "bg-blue-50 text-[#185FA5]" : "bg-green-50 text-[#3B6D11]"
                  }`}
                >
                  {msg.mode === "h" ? "💡 힌트 모드" : "✅ 전체 답변 모드"}
                </div>
              )}

              <div
                className={`px-3 py-2 rounded-2xl text-[14px] leading-relaxed break-words whitespace-pre-wrap ${
                  msg.type === "ai"
                    ? "bg-gray-100 border border-gray-200 rounded-bl-sm text-gray-800"
                    : "bg-[#185FA5] text-white rounded-br-sm"
                }`}
              >
                {msg.text}
                {msg.blocked && (
                  <div className="flex items-center gap-1.5 mt-1.5 px-2.5 py-1.5 bg-orange-50 border border-orange-200 rounded-lg text-[12px] text-orange-700">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    강사님께 직접 질문해주세요.
                  </div>
                )}
              </div>
              <div className="text-[11px] text-gray-400 mt-1 px-1">{msg.time}</div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-2 items-end">
            <div className="w-[26px] h-[26px] min-w-[26px] rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <DustLogo size={24} />
            </div>
            <div className="flex gap-1 px-3 py-3 bg-gray-100 border border-gray-200 rounded-2xl rounded-bl-sm">
              {[0, 0.2, 0.4].map((d, i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce"
                  style={{ animationDelay: `${d}s` }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 py-3 border-t border-gray-100 bg-white flex-shrink-0">
        <div className="text-[11px] text-gray-400 text-center mb-2">수강 만료까지 30일 남았습니다</div>
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                if (composingRef.current) return
                e.preventDefault()
                void send()
              }
            }}
            onCompositionStart={() => {
              composingRef.current = true
            }}
            onCompositionEnd={() => {
              composingRef.current = false
            }}
            placeholder="Java 수업 내용에 대해 질문하세요..."
            rows={1}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-full text-[14px] resize-none outline-none bg-gray-50 text-gray-800 leading-relaxed max-h-[100px] overflow-y-auto focus:border-blue-400 placeholder-gray-400"
          />
          <button
            type="button"
            onClick={() => void send()}
            disabled={busy}
            className="w-9 h-9 min-w-[36px] rounded-full bg-[#185FA5] flex items-center justify-center hover:bg-[#0C447C] active:scale-95 transition-all disabled:opacity-50"
            aria-label="전송"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

