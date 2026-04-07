'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Home, BookOpen, User, Trophy, Flame, Star, Lock } from 'lucide-react';

// ─────────────────────────────────────────
// 먼지 로고 SVG
// ─────────────────────────────────────────
function DustLogo({ size = 68 }: { size?: number }) {
  return (
    <svg viewBox="0 0 680 520" xmlns="http://www.w3.org/2000/svg" width={size} height={size}>
      <style>{`
        @keyframes dbob {0%,100%{transform:translateY(0px) rotate(0deg)}25%{transform:translateY(-10px) rotate(-2deg)}75%{transform:translateY(-5px) rotate(2deg)}}
        @keyframes dblink {0%,88%,100%{transform:scaleY(1)}93%{transform:scaleY(0.08)}}
        @keyframes dwobble {0%,100%{transform:scale(1,1)}40%{transform:scale(1.05,0.96)}70%{transform:scale(0.96,1.05)}}
        @keyframes dsparkle {0%,100%{opacity:0;transform:scale(0.2)}50%{opacity:1;transform:scale(1)}}
        @keyframes ddrift {0%,100%{transform:translate(0,0)}50%{transform:translate(2px,-5px)}}
        @keyframes dlegNW {0%,100%{transform:rotate(-14deg)}50%{transform:rotate(14deg)}}
        @keyframes dlegNE {0%,100%{transform:rotate(14deg)}50%{transform:rotate(-14deg)}}
        @keyframes dlegSW {0%,100%{transform:rotate(10deg)}50%{transform:rotate(-10deg)}}
        @keyframes dlegSE {0%,100%{transform:rotate(-10deg)}50%{transform:rotate(10deg)}}
        .dbody2{animation:dbob 2.6s ease-in-out infinite,dwobble 2.6s ease-in-out infinite;transform-origin:340px 255px}
        .deyeL2{animation:dblink 4s ease-in-out infinite;transform-origin:316px 244px}
        .deyeR2{animation:dblink 4s ease-in-out infinite 0.1s;transform-origin:360px 242px}
        .dlegNW2{animation:dlegNW 0.6s ease-in-out infinite;transform-origin:272px 210px}
        .dlegNE2{animation:dlegNE 0.6s ease-in-out infinite 0.1s;transform-origin:408px 210px}
        .dlegSW2{animation:dlegSW 0.6s ease-in-out infinite 0.05s;transform-origin:272px 300px}
        .dlegSE2{animation:dlegSE 0.6s ease-in-out infinite 0.15s;transform-origin:408px 300px}
        .ds12{animation:dsparkle 2s ease-in-out infinite 0s;transform-origin:210px 195px}
        .ds22{animation:dsparkle 2s ease-in-out infinite 0.5s;transform-origin:472px 195px}
        .ds32{animation:dsparkle 2s ease-in-out infinite 1s;transform-origin:340px 148px}
        .dp12{animation:ddrift 3s ease-in-out infinite}
        .dp22{animation:ddrift 2.8s ease-in-out infinite 0.7s}
        .dp32{animation:ddrift 3.4s ease-in-out infinite 1.2s}
      `}</style>
      <g className="dp12"><circle cx="225" cy="220" r="4" fill="rgba(255,255,255,0.3)"/></g>
      <g className="dp22"><circle cx="460" cy="215" r="3" fill="rgba(255,255,255,0.25)"/></g>
      <g className="dp32"><circle cx="340" cy="165" r="3" fill="rgba(255,255,255,0.25)"/></g>
      <g className="ds12"><path d="M210 188 L212 195 L210 202 L208 195Z" fill="rgba(255,255,255,0.6)"/><path d="M203 195 L210 197 L217 195 L210 193Z" fill="rgba(255,255,255,0.6)"/></g>
      <g className="ds22"><path d="M472 188 L474 195 L472 202 L470 195Z" fill="rgba(255,255,255,0.6)"/><path d="M465 195 L472 197 L479 195 L472 193Z" fill="rgba(255,255,255,0.6)"/></g>
      <g className="ds32"><path d="M340 141 L342 148 L340 155 L338 148Z" fill="rgba(255,255,255,0.6)"/><path d="M333 148 L340 150 L347 148 L340 146Z" fill="rgba(255,255,255,0.6)"/></g>
      <g className="dbody2">
        <g className="dlegNW2"><path d="M272 210 L230 178 L230 145" fill="none" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/></g>
        <g className="dlegNE2"><path d="M408 210 L450 178 L450 145" fill="none" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/></g>
        <g className="dlegSW2"><path d="M272 300 L230 332 L230 368" fill="none" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/></g>
        <g className="dlegSE2"><path d="M408 300 L450 332 L450 368" fill="none" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/></g>
        <ellipse cx="308" cy="190" rx="12" ry="14" fill="white"/><ellipse cx="326" cy="179" rx="8" ry="11" fill="white"/>
        <ellipse cx="342" cy="176" rx="11" ry="13" fill="white"/><ellipse cx="360" cy="181" rx="9" ry="10" fill="white"/>
        <ellipse cx="376" cy="190" rx="13" ry="11" fill="white"/><ellipse cx="391" cy="204" rx="10" ry="9" fill="white"/>
        <ellipse cx="402" cy="220" rx="9" ry="11" fill="white"/><ellipse cx="408" cy="238" rx="7" ry="9" fill="white"/>
        <ellipse cx="410" cy="257" rx="9" ry="10" fill="white"/><ellipse cx="407" cy="276" rx="8" ry="9" fill="white"/>
        <ellipse cx="400" cy="292" rx="11" ry="9" fill="white"/><ellipse cx="388" cy="305" rx="10" ry="8" fill="white"/>
        <ellipse cx="372" cy="315" rx="9" ry="8" fill="white"/><ellipse cx="354" cy="321" rx="8" ry="7" fill="white"/>
        <ellipse cx="338" cy="325" rx="11" ry="8" fill="white"/><ellipse cx="320" cy="322" rx="8" ry="7" fill="white"/>
        <circle cx="304" cy="314" r="8" fill="white"/><ellipse cx="290" cy="303" rx="11" ry="9" fill="white"/>
        <ellipse cx="277" cy="288" rx="10" ry="9" fill="white"/><ellipse cx="270" cy="270" rx="8" ry="10" fill="white"/>
        <ellipse cx="269" cy="250" rx="9" ry="9" fill="white"/><ellipse cx="272" cy="231" rx="8" ry="10" fill="white"/>
        <ellipse cx="280" cy="214" rx="10" ry="9" fill="white"/><ellipse cx="292" cy="200" rx="12" ry="10" fill="white"/>
        <ellipse cx="318" cy="173" rx="5" ry="7" fill="rgba(255,255,255,0.7)"/>
        <ellipse cx="363" cy="175" rx="4" ry="6" fill="rgba(255,255,255,0.65)"/>
        <ellipse cx="350" cy="328" rx="5" ry="4" fill="rgba(255,255,255,0.55)"/>
        <g className="deyeL2"><ellipse cx="316" cy="244" rx="10" ry="12" fill="white"/></g>
        <g className="deyeR2"><ellipse cx="362" cy="242" rx="9" ry="11" fill="white"/></g>
      </g>
    </svg>
  );
}

// ─────────────────────────────────────────
// 챗봇 타입
// ─────────────────────────────────────────
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

// ─────────────────────────────────────────
// 플로팅 챗봇
// ─────────────────────────────────────────
function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { type: 'ai', text: '안녕하세요! 수업 도우미 AI 튜터예요 😊\n오늘 배운 내용에서 막히는 부분을 편하게 질문해보세요!', time: '오전 10:00' },
  ]);
  const [mode, setMode] = useState<'h' | 'f'>('h');
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [faqOpen, setFaqOpen] = useState(false);
  const [faqItems, setFaqItems] = useState<string[]>(FAQ_DEFAULT);
  const [qCounts, setQCounts] = useState<Record<string, number>>({});
  const [faqNotify, setFaqNotify] = useState(false);
  const [unread, setUnread] = useState(0);

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

  async function send(textOverride?: string) {
    if (busy) return;
    const raw = (textOverride ?? input).trim();
    if (!raw) return;
    setBusy(true);
    setInput('');
    setTimeout(() => inputRef.current?.focus(), 50);
    setMessages(prev => [...prev, { type: 'user', text: raw, time: getTime() }]);
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
              content: `당신은 IT 교육 전용 AI 튜터입니다.
힌트 레벨: ${mode === 'h' ? 'HINT - 힌트만 제공하세요.' : 'FULL - 정답과 예제를 알려주세요.'}
수업 범위 밖 질문은 "이 수업 범위가 아닙니다. 강사님께 질문해주세요." 라고만 답하세요.
답변은 한국어로 작성하세요.`,
            },
            { role: 'user', content: raw },
          ],
          stream: false,
        }),
      });
      const data = await res.json();
      const answer = data.content ?? data.answer ?? '답변을 가져올 수 없습니다.';
      const isOutOfRange = answer.includes('수업 범위가 아닙니다');
      setIsTyping(false);
      setMessages(prev => [...prev, { type: 'ai', text: answer, time: getTime(), blocked: isOutOfRange, mode }]);
      if (!isOpen) setUnread(u => u + 1);
    } catch {
      setIsTyping(false);
      showToast('오류가 발생했습니다.');
      setMessages(prev => [...prev, { type: 'ai', text: '일시적인 오류가 발생했습니다.', time: getTime(), mode }]);
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

  const AvatarIcon = () => (
    <div className="w-[24px] h-[24px] min-w-[24px] rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#378ADD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        <circle cx="12" cy="16" r="1" fill="#378ADD"/>
      </svg>
    </div>
  );

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">

      {/* 챗봇 패널 */}
      {isOpen && (
        <div className="w-[390px] flex flex-col h-[600px] bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(2,8,23,0.22)] relative">

          {/* 토스트 */}
          {toast && (
            <div className="absolute top-[60px] left-1/2 -translate-x-1/2 bg-[#1E3A5F] text-white px-4 py-2 rounded-full text-[12px] whitespace-nowrap z-50 shadow-lg">
              {toast}
            </div>
          )}
          {faqNotify && (
            <div className="absolute top-[60px] left-1/2 -translate-x-1/2 bg-[#0C447C] text-white px-4 py-2 rounded-full text-[12px] whitespace-nowrap z-50">
              ✨ FAQ가 자동 업데이트됐어요!
            </div>
          )}

          {/* 헤더 */}
          <div className="px-4 py-3 bg-gradient-to-r from-[#185FA5] to-[#2f78c4] flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2z"/>
                <path d="M8 12h.01M12 12h.01M16 12h.01"/>
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-[14px] font-medium text-white">수업 도우미 AI 튜터</div>
              <div className="text-[10px] text-white/75">수업 내용 중심으로 도와드려요</div>
            </div>
            <button onClick={() => { setIsOpen(false); setUnread(0); }} className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/30 transition-colors">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
          </div>

          {/* 답변 모드 */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100 bg-gray-50 flex-shrink-0">
            <span className="text-[11px] text-gray-500 font-medium flex-shrink-0">모드</span>
            <div className="flex gap-1.5 flex-1">
              <button onClick={() => setMode('h')} className={`flex-1 py-1.5 rounded-lg text-[12px] font-medium transition-all border ${mode === 'h' ? 'bg-blue-50 text-[#0C447C] border-[#185FA5]' : 'bg-white text-gray-400 border-gray-200'}`}>
                💡 힌트
              </button>
              <button onClick={() => setMode('f')} className={`flex-1 py-1.5 rounded-lg text-[12px] font-medium transition-all border ${mode === 'f' ? 'bg-green-50 text-[#27500A] border-[#639922]' : 'bg-white text-gray-400 border-gray-200'}`}>
                ✅ 전체
              </button>
            </div>
          </div>

          {/* FAQ */}
          <div className="border-b border-gray-100 bg-gray-50 flex-shrink-0">
            <button onClick={() => setFaqOpen(o => !o)} className="w-full px-4 py-2 flex items-center justify-between text-[12px] font-medium text-gray-500 hover:bg-gray-100 transition-colors">
              <span>FAQ <span className="ml-1 bg-[#185FA5] text-white text-[9px] font-medium px-1.5 py-0.5 rounded-full">{faqItems.length}</span></span>
              <svg className={`w-3.5 h-3.5 transition-transform text-gray-400 ${faqOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            {faqOpen && (
              <div className="px-4 pb-2 flex flex-col gap-1">
                {faqItems.map((item, i) => (
                  <button key={i} onClick={() => { setFaqOpen(false); send(item); }}
                    className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-[12px] text-[#185FA5] text-left hover:bg-blue-50 transition-colors">
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 메시지 */}
          <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 items-end w-full ${msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {msg.type === 'ai' && <AvatarIcon />}
                <div className={`flex flex-col max-w-[78%] ${msg.type === 'user' ? 'items-end' : 'items-start'}`}>
                  {msg.type === 'ai' && !msg.blocked && msg.mode && (
                    <div className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full mb-1 ${msg.mode === 'h' ? 'bg-blue-50 text-[#185FA5]' : 'bg-green-50 text-[#3B6D11]'}`}>
                      {msg.mode === 'h' ? '💡 힌트' : '✅ 전체'}
                    </div>
                  )}
                  <div className={`px-3 py-2 rounded-2xl text-[13px] leading-relaxed break-words whitespace-pre-wrap ${msg.type === 'ai' ? 'bg-gray-100 border border-gray-200 rounded-bl-sm text-gray-800' : 'bg-[#185FA5] text-white rounded-br-sm'}`}>
                    {msg.text}
                    {msg.blocked && (
                      <div className="flex items-center gap-1 mt-1 px-2 py-1 bg-orange-50 border border-orange-200 rounded-lg text-[11px] text-orange-700">
                        강사님께 직접 질문해주세요.
                      </div>
                    )}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5 px-1">{msg.time}</div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-2 items-end">
                <AvatarIcon />
                <div className="flex gap-1 px-3 py-2.5 bg-gray-100 border border-gray-200 rounded-2xl rounded-bl-sm">
                  {[0, 0.2, 0.4].map((d, i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: `${d}s` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* 입력창 */}
          <div className="px-4 py-3 border-t border-gray-100 bg-white flex-shrink-0">
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onCompositionStart={() => { composingRef.current = true; }}
                onCompositionEnd={() => { composingRef.current = false; }}
                placeholder="예) for문이 언제 쓰이나요?"
                rows={1}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-full text-[13px] resize-none outline-none bg-gray-50 text-gray-800 leading-relaxed max-h-[80px] overflow-y-auto focus:border-blue-400 placeholder-gray-400"
                onInput={e => {
                  const el = e.currentTarget;
                  el.style.height = 'auto';
                  el.style.height = Math.min(el.scrollHeight, 80) + 'px';
                }}
              />
              <button onClick={() => send()} disabled={busy} className="w-8 h-8 min-w-[32px] rounded-full bg-[#185FA5] flex items-center justify-center hover:bg-[#0C447C] active:scale-95 transition-all disabled:opacity-50">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 먼지 FAB 버튼 */}
      <button
        onClick={() => { setIsOpen(o => !o); setUnread(0); }}
        className="relative rounded-full bg-[#185FA5] p-1.5 shadow-[0_12px_30px_rgba(24,95,165,0.38)] ring-4 ring-[#dcecff] hover:-translate-y-1 active:scale-95 transition-transform"
      >
        {unread > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 border-2 border-white text-[10px] text-white font-medium flex items-center justify-center z-10">
            {unread}
          </div>
        )}
        <DustLogo size={64} />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────
// 메인 대시보드
// ─────────────────────────────────────────
export default function EduVibeDashboard() {
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gradient-to-b from-[#f7fbff] via-white to-[#f4f8ff] font-sans text-[#4b4b4b]">

      {/* 사이드바 */}
      <nav className="hidden md:flex flex-col w-68 border-r border-gray-200/70 p-5 fixed h-full bg-white/90 backdrop-blur-sm z-20 shadow-[0_0_20px_rgba(17,24,39,0.04)]">
        <h1 className="text-3xl font-black text-[#58cc02] mb-2 px-4 italic tracking-tight">EduVibe</h1>
        <p className="text-[12px] text-gray-500 px-4 mb-8">학원 수업용 학습 대시보드</p>
        <div className="space-y-2">
          <NavItem icon={<Home size={28} />} label="홈" active />
          <NavItem icon={<BookOpen size={28} />} label="오늘 수업" />
          <NavItem icon={<Trophy size={28} />} label="퀘스트" />
          <NavItem icon={<User size={28} />} label="내 학습현황" />
        </div>
      </nav>

      {/* 메인 */}
      <main className="flex-1 md:ml-68 p-4 md:p-8 pb-24 md:pb-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-gradient-to-br from-[#58cc02] to-[#42b400] rounded-3xl p-7 text-white mb-12 shadow-[0_14px_28px_rgba(70,163,2,0.28)] border border-[#46a302]">
            <h2 className="text-lg font-bold opacity-90 uppercase tracking-[0.2em] mb-1">JAVA 기초반</h2>
            <h3 className="text-3xl font-black mb-3">이번 주 학습: 조건문과 반복문</h3>
            <p className="text-sm text-white/90 mb-5">오늘 목표: 핵심 개념 이해 + 예제 3개 완주</p>
            <button className="bg-white text-[#58cc02] font-extrabold py-3 px-8 rounded-xl shadow-[0_6px_0_0_#e7e7e7] hover:brightness-95 hover:-translate-y-0.5 active:translate-y-1 active:shadow-none transition-all uppercase tracking-tighter">
              오늘 수업 자료 보기
            </button>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-8 shadow-sm">
            <h4 className="font-black text-lg mb-3">오늘 해야 할 학습</h4>
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2"><span className="text-green-600">-</span> for문 / while문 차이 이해하기</p>
              <p className="flex items-center gap-2"><span className="text-green-600">-</span> 조건문(if, else) 예제 2개 풀기</p>
              <p className="flex items-center gap-2"><span className="text-green-600">-</span> 모르는 부분은 오른쪽 아래 AI 튜터로 질문하기</p>
            </div>
          </div>
          <div className="flex flex-col items-center space-y-10 relative">
            <PathNode status="completed" icon={<Star size={32} fill="white" />} label="OT/환경설정" />
            <PathNode status="current" icon={<Flame size={32} fill="white" />} label="조건문 기초" offset="ml-32" />
            <PathNode status="locked" icon={<Lock size={32} />} label="반복문 기초" offset="-ml-32" />
            <PathNode status="locked" icon={<Lock size={32} />} label="배열 입문" />
            <PathNode status="locked" icon={<Lock size={32} />} label="주간 복습 테스트" offset="ml-24" />
          </div>
        </div>
      </main>

      {/* 우측 위젯 */}
      <aside className="hidden lg:block w-80 p-8 border-l border-gray-100 sticky top-0 h-screen bg-white/70 backdrop-blur-sm">
        <div className="space-y-6">
          <div className="flex items-center justify-between border border-gray-200 rounded-2xl p-5 bg-white shadow-sm hover:bg-gray-50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <Flame size={28} className="text-orange-500" fill="currentColor" />
              <span className="font-black text-xl">5</span>
            </div>
            <div className="flex items-center gap-3">
              <Star size={28} className="text-yellow-400" fill="currentColor" />
              <span className="font-black text-xl text-yellow-500">420</span>
            </div>
          </div>
          <div className="border border-gray-200 rounded-2xl p-6 bg-white shadow-sm">
            <h4 className="font-black text-xl mb-4">오늘의 목표</h4>
            <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
              <div className="bg-[#58cc02] h-4 rounded-full w-2/3"></div>
            </div>
            <p className="text-gray-500 font-bold">2 / 3 개념 완료</p>
          </div>
        </div>
      </aside>

      {/* 모바일 하단 네비 */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-gray-200 flex justify-around p-4 z-40">
        <MobileNavItem icon={<Home size={32} />} active />
        <MobileNavItem icon={<BookOpen size={32} />} />
        <MobileNavItem icon={<Trophy size={32} />} />
        <MobileNavItem icon={<User size={32} />} />
      </nav>

      {/* 플로팅 챗봇 */}
      <FloatingChatbot />
    </div>
  );
}

// ─────────────────────────────────────────
// 보조 컴포넌트
// ─────────────────────────────────────────
interface NavItemProps { icon: React.ReactNode; label: string; active?: boolean; }
function NavItem({ icon, label, active = false }: NavItemProps) {
  return (
    <div className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer font-black transition-all border-2 ${active ? 'bg-[#ddf4ff] border-[#84d8ff] text-[#1cb0f6]' : 'border-transparent hover:bg-gray-100 text-gray-500'}`}>
      {icon}<span className="text-lg">{label}</span>
    </div>
  );
}

interface PathNodeProps { status: 'completed' | 'current' | 'locked'; icon: React.ReactNode; label: string; offset?: string; }
function PathNode({ status, icon, label, offset = "" }: PathNodeProps) {
  const statusStyles = {
    completed: "bg-[#58cc02] shadow-[0_6px_0_0_#46a302] text-white border-[#46a302]",
    current: "bg-[#1cb0f6] shadow-[0_6px_0_0_#1899d6] text-white border-[#1899d6]",
    locked: "bg-[#e5e5e5] shadow-[0_6px_0_0_#afafaf] text-gray-400 border-[#afafaf]"
  };
  return (
    <div className={`flex flex-col items-center ${offset}`}>
      <div className={`w-20 h-16 rounded-full border-2 flex items-center justify-center cursor-pointer active:translate-y-1 active:shadow-none transition-all ${statusStyles[status]}`}>
        {icon}
      </div>
      <span className="mt-3 font-black text-lg tracking-tight">{label}</span>
    </div>
  );
}

interface MobileNavItemProps { icon: React.ReactNode; active?: boolean; }
function MobileNavItem({ icon, active = false }: MobileNavItemProps) {
  return (
    <div className={`p-2 rounded-2xl transition-colors ${active ? 'bg-[#ddf4ff] text-[#1cb0f6]' : 'text-gray-400'}`}>
      {icon}
    </div>
  );
}