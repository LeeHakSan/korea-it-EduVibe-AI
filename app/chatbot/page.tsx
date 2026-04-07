'use client';

import { useState, useRef, useEffect } from 'react';

type Message = {
  type: 'ai' | 'user';
  text: string;
  time: string;
  blocked?: boolean;
  mode?: 'h' | 'f';
};

const FAQ_DEFAULT = [
  'for문에서 i++와 ++i의 차이가 뭔가요?',
  '배열의 인덱스가 왜 0부터 시작하나요?',
  'while문과 for문은 어떨 때 쓰나요?',
];

function getTime() {
  return new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

function DustLogo() {
  return (
    <svg
      viewBox="0 0 680 520"
      xmlns="http://www.w3.org/2000/svg"
      width="72"
      height="72"
      style={{ transform: 'scale(1.35)', transformOrigin: '50% 50%' }}
    >
      <style>{`
        @keyframes bob2 {
          0%,100%{transform:translateY(0px) rotate(0deg)}
          25%{transform:translateY(-10px) rotate(-2deg)}
          75%{transform:translateY(-5px) rotate(2deg)}
        }
        @keyframes blink2 {
          0%,88%,100%{transform:scaleY(1)}
          93%{transform:scaleY(0.08)}
        }
        @keyframes wobble2 {
          0%,100%{transform:scale(1,1)}
          40%{transform:scale(1.05,0.96)}
          70%{transform:scale(0.96,1.05)}
        }
        @keyframes sparkle2 {
          0%,100%{opacity:0;transform:scale(0.2)}
          50%{opacity:1;transform:scale(1)}
        }
        @keyframes drift2 {
          0%,100%{transform:translate(0,0)}
          50%{transform:translate(2px,-5px)}
        }
        @keyframes legSwingNW2 {
          0%,100%{transform:rotate(-14deg)}
          50%{transform:rotate(14deg)}
        }
        @keyframes legSwingNE2 {
          0%,100%{transform:rotate(14deg)}
          50%{transform:rotate(-14deg)}
        }
        @keyframes legSwingSW2 {
          0%,100%{transform:rotate(10deg)}
          50%{transform:rotate(-10deg)}
        }
        @keyframes legSwingSE2 {
          0%,100%{transform:rotate(-10deg)}
          50%{transform:rotate(10deg)}
        }
        .dbody { animation: bob2 2.6s ease-in-out infinite, wobble2 2.6s ease-in-out infinite; transform-origin:340px 255px; }
        .deyeL { animation: blink2 4s ease-in-out infinite; transform-origin:316px 244px; }
        .deyeR { animation: blink2 4s ease-in-out infinite 0.1s; transform-origin:360px 242px; }
        .dlegNW { animation: legSwingNW2 0.6s ease-in-out infinite; transform-origin:272px 210px; }
        .dlegNE { animation: legSwingNE2 0.6s ease-in-out infinite 0.1s; transform-origin:408px 210px; }
        .dlegSW { animation: legSwingSW2 0.6s ease-in-out infinite 0.05s; transform-origin:272px 300px; }
        .dlegSE { animation: legSwingSE2 0.6s ease-in-out infinite 0.15s; transform-origin:408px 300px; }
        .ds1{animation:sparkle2 2s ease-in-out infinite 0s;transform-origin:210px 195px}
        .ds2{animation:sparkle2 2s ease-in-out infinite 0.5s;transform-origin:472px 195px}
        .ds3{animation:sparkle2 2s ease-in-out infinite 1s;transform-origin:340px 148px}
        .dp1{animation:drift2 3s ease-in-out infinite}
        .dp2{animation:drift2 2.8s ease-in-out infinite 0.7s}
        .dp3{animation:drift2 3.4s ease-in-out infinite 1.2s}
      `}</style>

      <g className="dp1"><circle cx="225" cy="220" r="4" fill="rgba(255,255,255,0.3)"/></g>
      <g className="dp2"><circle cx="460" cy="215" r="3" fill="rgba(255,255,255,0.25)"/></g>
      <g className="dp3"><circle cx="340" cy="165" r="3" fill="rgba(255,255,255,0.25)"/></g>

      <g className="ds1">
        <path d="M210 188 L212 195 L210 202 L208 195Z" fill="rgba(255,255,255,0.6)"/>
        <path d="M203 195 L210 197 L217 195 L210 193Z" fill="rgba(255,255,255,0.6)"/>
      </g>
      <g className="ds2">
        <path d="M472 188 L474 195 L472 202 L470 195Z" fill="rgba(255,255,255,0.6)"/>
        <path d="M465 195 L472 197 L479 195 L472 193Z" fill="rgba(255,255,255,0.6)"/>
      </g>
      <g className="ds3">
        <path d="M340 141 L342 148 L340 155 L338 148Z" fill="rgba(255,255,255,0.6)"/>
        <path d="M333 148 L340 150 L347 148 L340 146Z" fill="rgba(255,255,255,0.6)"/>
      </g>

      <g className="dbody">
        <g className="dlegNW">
          <path d="M272 210 L230 178 L230 145" fill="none" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
        <g className="dlegNE">
          <path d="M408 210 L450 178 L450 145" fill="none" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
        <g className="dlegSW">
          <path d="M272 300 L230 332 L230 368" fill="none" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
        <g className="dlegSE">
          <path d="M408 300 L450 332 L450 368" fill="none" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
        </g>

        <ellipse cx="308" cy="190" rx="12" ry="14" fill="white"/>
        <ellipse cx="326" cy="179" rx="8" ry="11" fill="white"/>
        <ellipse cx="342" cy="176" rx="11" ry="13" fill="white"/>
        <ellipse cx="360" cy="181" rx="9" ry="10" fill="white"/>
        <ellipse cx="376" cy="190" rx="13" ry="11" fill="white"/>
        <ellipse cx="391" cy="204" rx="10" ry="9" fill="white"/>
        <ellipse cx="402" cy="220" rx="9" ry="11" fill="white"/>
        <ellipse cx="408" cy="238" rx="7" ry="9" fill="white"/>
        <ellipse cx="410" cy="257" rx="9" ry="10" fill="white"/>
        <ellipse cx="407" cy="276" rx="8" ry="9" fill="white"/>
        <ellipse cx="400" cy="292" rx="11" ry="9" fill="white"/>
        <ellipse cx="388" cy="305" rx="10" ry="8" fill="white"/>
        <ellipse cx="372" cy="315" rx="9" ry="8" fill="white"/>
        <ellipse cx="354" cy="321" rx="8" ry="7" fill="white"/>
        <ellipse cx="338" cy="325" rx="11" ry="8" fill="white"/>
        <ellipse cx="320" cy="322" rx="8" ry="7" fill="white"/>
        <circle cx="304" cy="314" r="8" fill="white"/>
        <ellipse cx="290" cy="303" rx="11" ry="9" fill="white"/>
        <ellipse cx="277" cy="288" rx="10" ry="9" fill="white"/>
        <ellipse cx="270" cy="270" rx="8" ry="10" fill="white"/>
        <ellipse cx="269" cy="250" rx="9" ry="9" fill="white"/>
        <ellipse cx="272" cy="231" rx="8" ry="10" fill="white"/>
        <ellipse cx="280" cy="214" rx="10" ry="9" fill="white"/>
        <ellipse cx="292" cy="200" rx="12" ry="10" fill="white"/>

        <ellipse cx="318" cy="173" rx="5" ry="7" fill="rgba(255,255,255,0.7)"/>
        <ellipse cx="363" cy="175" rx="4" ry="6" fill="rgba(255,255,255,0.65)"/>
        <ellipse cx="274" cy="202" rx="5" ry="4" fill="rgba(255,255,255,0.6)"/>
        <ellipse cx="350" cy="328" rx="5" ry="4" fill="rgba(255,255,255,0.55)"/>
        <ellipse cx="298" cy="320" rx="4" ry="5" fill="rgba(255,255,255,0.55)"/>

        <g className="deyeL">
          <ellipse cx="316" cy="244" rx="10" ry="12" fill="white"/>
        </g>
        <g className="deyeR">
          <ellipse cx="362" cy="242" rx="9" ry="11" fill="white"/>
        </g>
      </g>
    </svg>
  );
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      type: 'ai',
      text: '안녕하세요! Java 기초반 AI 튜터입니다. 답변 모드를 선택하고 질문해주세요 😊',
      time: '오전 10:00',
    },
  ]);
  const [mode, setMode] = useState<'h' | 'f'>('h');
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [faqOpen, setFaqOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [unread, setUnread] = useState(0);
  const [faqItems, setFaqItems] = useState<string[]>(FAQ_DEFAULT);
  const [qCounts, setQCounts] = useState<Record<string, number>>({});
  const [faqNotify, setFaqNotify] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const composingRef = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  function showToast(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }

  function trackQuestion(text: string) {
    const key = text.toLowerCase();
    const newCounts = { ...qCounts, [key]: (qCounts[key] || 0) + 1 };
    setQCounts(newCounts);
    if (newCounts[key] >= 5 && !faqItems.includes(text)) {
      setFaqItems(prev => [...prev, text]);
      setFaqNotify(true);
      setTimeout(() => setFaqNotify(false), 3000);
    }
  }

  async function callGeminiDirect(raw: string) {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI API 키가 없습니다.');

    const directPrompt = `중요 규칙:
- 답변은 반드시 한국어(ko-KR)로만 작성하세요.
- 영어 문장으로 답하지 마세요.
- 한국인 학습자를 위한 친절한 존댓말로 답변하세요.

당신은 Java 수업 전용 AI 튜터입니다.
힌트 레벨: ${mode === 'h' ? 'HINT - 정답을 바로 알려주지 말고 힌트만 제공하세요.' : 'FULL - 정답과 예제 코드를 바로 알려주세요.'}
수업 범위 밖의 질문(Spring, React, Python 등)은 "해당 내용은 이 수업 범위가 아닙니다. 강사님께 직접 질문해주세요." 라고만 답하세요.
답변은 한국어로 작성하세요.

user: ${raw}`;

    const versions = ['v1', 'v1beta'];
    const preferredOrder = [
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite',
      'gemini-1.5-flash-latest',
      'gemini-1.5-flash',
      'gemini-1.5-pro-latest',
      'gemini-1.5-pro',
    ];

    let lastError = 'Gemini API 호출 실패';

    for (const version of versions) {
      const modelsRes = await fetch(`https://generativelanguage.googleapis.com/${version}/models?key=${apiKey}`);
      const modelsJson = await modelsRes.json();
      if (!modelsRes.ok) {
        lastError = modelsJson?.error?.message ?? lastError;
        continue;
      }

      const models = (modelsJson?.models ?? []) as Array<{ name?: string; supportedGenerationMethods?: string[] }>;
      const generatable = models
        .filter((m) => (m.supportedGenerationMethods ?? []).includes('generateContent'))
        .map((m) => (m.name ?? '').replace(/^models\//, ''))
        .filter(Boolean);

      const model =
        preferredOrder.find((p) => generatable.includes(p)) ??
        generatable.find((m) => m.includes('gemini') && !m.includes('vision') && !m.includes('embedding')) ??
        generatable[0];

      if (!model) {
        lastError = '사용 가능한 Gemini 모델이 없습니다.';
        continue;
      }

      const res = await fetch(
        `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: directPrompt }] }],
          }),
        }
      );

      const json = await res.json();
      if (!res.ok) {
        lastError = json?.error?.message ?? lastError;
        continue;
      }

      const text = json?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('').trim();
      if (text) return text;
    }

    throw new Error(lastError);
  }

  async function send(textOverride?: string) {
    if (busy) return;
    const raw = (textOverride ?? input).trim();
    if (!raw) return;

    setBusy(true);
    setInput('');
    setTimeout(() => inputRef.current?.focus(), 50);

    const time = getTime();
    setMessages(prev => [...prev, { type: 'user', text: raw, time }]);
    trackQuestion(raw);
    setIsTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `당신은 Java 수업 전용 AI 튜터입니다.
힌트 레벨: ${mode === 'h' ? 'HINT - 정답을 바로 알려주지 말고 힌트만 제공하세요.' : 'FULL - 정답과 예제 코드를 바로 알려주세요.'}
수업 범위 밖의 질문(Spring, React, Python 등)은 "해당 내용은 이 수업 범위가 아닙니다. 강사님께 직접 질문해주세요." 라고만 답하세요.
답변은 한국어로 작성하세요.`,
            },
            { role: 'user', content: raw },
          ],
          stream: false,
        }),
      });

      const data = await res.json();
      let answer: string;

      if (res.ok) {
        answer = data.content ?? data.answer ?? '답변을 가져올 수 없습니다.';
      } else if (res.status === 404) {
        // dev 서버에서 API 라우트 인식이 깨질 때를 대비한 안전장치
        answer = await callGeminiDirect(raw);
      } else {
        const msg = data?.error ?? `API 오류 (${res.status})`;
        throw new Error(msg);
      }
      const isOutOfRange = answer.includes('수업 범위가 아닙니다');

      setIsTyping(false);
      setMessages(prev => [
        ...prev,
        { type: 'ai', text: answer, time: getTime(), blocked: isOutOfRange, mode },
      ]);
      if (!isOpen) setUnread(u => u + 1);
    } catch (err) {
      const message = err instanceof Error ? err.message : '오류가 발생했습니다. 다시 시도해주세요.';
      setIsTyping(false);
      showToast(message);
      setMessages(prev => [
        ...prev,
        { type: 'ai', text: message, time: getTime(), mode },
      ]);
    } finally {
      setBusy(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (composingRef.current) return;
      e.preventDefault();
      send();
    }
  }

  function toggleOpen() {
    setIsOpen(o => {
      if (!o) setUnread(0);
      return !o;
    });
  }

  const AvatarIcon = () => (
    <div className="w-[26px] h-[26px] min-w-[26px] rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#378ADD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        <circle cx="12" cy="16" r="1" fill="#378ADD"/>
      </svg>
    </div>
  );

  return (
    <div className="flex flex-col items-end gap-3 pb-2 max-w-[480px] mx-auto p-4">
      {isOpen && (
        <div className="w-full flex flex-col h-[720px] bg-white border border-gray-200 rounded-2xl overflow-hidden relative shadow-lg">

          {toast && (
            <div className="absolute top-[70px] left-1/2 -translate-x-1/2 bg-[#1E3A5F] text-white px-4 py-2 rounded-full text-[13px] whitespace-nowrap z-50 shadow-lg">
              {toast}
            </div>
          )}
          {faqNotify && (
            <div className="absolute top-[70px] left-1/2 -translate-x-1/2 bg-[#0C447C] text-white px-4 py-2 rounded-full text-[13px] whitespace-nowrap z-50">
              ✨ FAQ가 자동 업데이트됐어요!
            </div>
          )}

          <div className="px-5 py-3 bg-[#185FA5] flex items-center gap-3 flex-shrink-0">
            <div className="w-[34px] h-[34px] rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2z"/>
                <path d="M8 12h.01M12 12h.01M16 12h.01"/>
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-[15px] font-medium text-white">Java 기초반 AI 튜터</div>
              <div className="text-[11px] text-white/75 mt-[1px]">수강기간: 2026.04.06 ~ 2026.05.06</div>
            </div>
            <div className="text-[11px] px-3 py-1 rounded-full bg-white/20 text-white flex-shrink-0">수강 중</div>
            <button onClick={toggleOpen} className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center ml-1 hover:bg-white/30 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
          </div>

          <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 bg-gray-50 flex-shrink-0">
            <span className="text-[12px] text-gray-500 font-medium flex-shrink-0">답변 모드</span>
            <div className="flex gap-2 flex-1">
              <button onClick={() => setMode('h')} className={`flex-1 py-2 rounded-xl text-[13px] font-medium flex items-center justify-center gap-1.5 transition-all border ${mode === 'h' ? 'bg-blue-50 text-[#0C447C] border-[#185FA5] shadow-[inset_0_0_0_1px_#B5D4F4]' : 'bg-white text-gray-400 border-gray-200 hover:border-blue-400 hover:text-blue-400 hover:bg-blue-50'}`}>
                <span>💡</span><span>힌트만 줘요</span>
                {mode === 'h' && <div className="w-4 h-4 rounded-full bg-[#185FA5] flex items-center justify-center"><svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><polyline points="2 6 5 9 10 3"/></svg></div>}
              </button>
              <button onClick={() => setMode('f')} className={`flex-1 py-2 rounded-xl text-[13px] font-medium flex items-center justify-center gap-1.5 transition-all border ${mode === 'f' ? 'bg-green-50 text-[#27500A] border-[#639922] shadow-[inset_0_0_0_1px_#C0DD97]' : 'bg-white text-gray-400 border-gray-200 hover:border-green-500 hover:text-green-600 hover:bg-green-50'}`}>
                <span>✅</span><span>전부 알려줘요</span>
                {mode === 'f' && <div className="w-4 h-4 rounded-full bg-[#639922] flex items-center justify-center"><svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><polyline points="2 6 5 9 10 3"/></svg></div>}
              </button>
            </div>
          </div>

          <div className="border-b border-gray-100 bg-gray-50 flex-shrink-0">
            <button onClick={() => setFaqOpen(o => !o)} className="w-full px-5 py-2.5 flex items-center justify-between text-[13px] font-medium text-gray-500 hover:bg-gray-100 transition-colors">
              <span>자주 묻는 질문 FAQ <span className="ml-1.5 bg-[#185FA5] text-white text-[10px] font-medium px-2 py-0.5 rounded-full">{faqItems.length}</span></span>
              <svg className={`w-4 h-4 transition-transform text-gray-400 ${faqOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            {faqOpen && (
              <div className="px-5 pb-3 flex flex-col gap-1.5">
                {faqItems.map((item, i) => (
                  <button key={i} onClick={() => { setFaqOpen(false); send(item); }} className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] text-[#185FA5] text-left flex items-center gap-2 hover:bg-blue-50 transition-colors">
                    <span className="flex-1">{item}</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-[#185FA5] rounded-lg flex-shrink-0">AI 자동생성</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3.5">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 items-end w-full ${msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {msg.type === 'ai' && <AvatarIcon />}
                <div className={`flex flex-col max-w-[74%] ${msg.type === 'user' ? 'items-end' : 'items-start'}`}>
                  {msg.type === 'ai' && !msg.blocked && msg.mode && (
                    <div className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full mb-1 ${msg.mode === 'h' ? 'bg-blue-50 text-[#185FA5]' : 'bg-green-50 text-[#3B6D11]'}`}>
                      {msg.mode === 'h' ? '💡 힌트 모드' : '✅ 전체 답변 모드'}
                    </div>
                  )}
                  <div className={`px-3 py-2 rounded-2xl text-[14px] leading-relaxed break-words whitespace-pre-wrap ${msg.type === 'ai' ? 'bg-gray-100 border border-gray-200 rounded-bl-sm text-gray-800' : 'bg-[#185FA5] text-white rounded-br-sm'}`}>
                    {msg.text}
                    {msg.blocked && (
                      <div className="flex items-center gap-1.5 mt-1.5 px-2.5 py-1.5 bg-orange-50 border border-orange-200 rounded-lg text-[12px] text-orange-700">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
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
                <AvatarIcon />
                <div className="flex gap-1 px-3 py-3 bg-gray-100 border border-gray-200 rounded-2xl rounded-bl-sm">
                  {[0, 0.2, 0.4].map((d, i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: `${d}s` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="px-5 py-3 border-t border-gray-100 bg-white flex-shrink-0">
            <div className="text-[11px] text-gray-400 text-center mb-2">수강 만료까지 30일 남았습니다</div>
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onCompositionStart={() => { composingRef.current = true; }}
                onCompositionEnd={() => { composingRef.current = false; }}
                placeholder="Java 수업 내용에 대해 질문하세요..."
                rows={1}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-full text-[14px] resize-none outline-none bg-gray-50 text-gray-800 leading-relaxed max-h-[100px] overflow-y-auto focus:border-blue-400 placeholder-gray-400"
                onInput={e => {
                  const el = e.currentTarget;
                  el.style.height = 'auto';
                  el.style.height = Math.min(el.scrollHeight, 100) + 'px';
                }}
              />
              <button onClick={() => send()} disabled={busy} className="w-9 h-9 min-w-[36px] rounded-full bg-[#185FA5] flex items-center justify-center hover:bg-[#0C447C] active:scale-95 transition-all disabled:opacity-50">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 먼지 FAB 로고 */}
      {!isOpen && (
        <div
          onClick={toggleOpen}
          className="relative self-end cursor-pointer hover:-translate-y-0.5 active:scale-95 transition-transform rounded-full bg-[#185FA5] w-[72px] h-[72px] flex items-center justify-center overflow-hidden"
        >
          {unread > 0 && (
            <div className="absolute top-0 right-0 w-[18px] h-[18px] rounded-full bg-red-500 border-2 border-white text-[9px] text-white font-medium flex items-center justify-center z-10">
              {unread}
            </div>
          )}
          <DustLogo />
        </div>
      )}
    </div>
  );
}
