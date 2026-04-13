import Link from "next/link"
import { ArrowRight, Sparkles, Code, Gamepad2 } from "lucide-react"

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b-2 border-[#e5e5e5]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <h1 className="text-2xl md:text-3xl font-black text-[#58cc02]">
              EduVibe<span className="text-[#1cb0f6]">-AI</span>
            </h1>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-5 py-2.5 bg-[#58cc02] text-white font-bold rounded-xl border-b-4 border-[#46a302] hover:bg-[#58cc02]/90 active:border-b-0 active:mt-1 transition-all"
            >
              로그인
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-16 md:py-24 px-4 overflow-hidden">
        <div className="max-w-6xl mx-auto text-center">
          {/* Mascot Placeholder */}
          <div className="w-32 h-32 md:w-40 md:h-40 mx-auto mb-8 bg-gradient-to-br from-[#58cc02] to-[#1cb0f6] rounded-full flex items-center justify-center shadow-xl">
            <Sparkles className="w-16 h-16 md:w-20 md:h-20 text-white" />
          </div>

          <h2 className="text-4xl md:text-6xl font-black text-[#3c3c3c] mb-4 text-balance">
            AI와 함께하는
            <br />
            <span className="text-[#58cc02]">즐거운</span> IT학습
          </h2>

          <p className="text-lg md:text-xl text-[#777] font-semibold max-w-2xl mx-auto mb-10 text-pretty">
            게임처럼 재미있게, AI 튜터와 함께 효과적으로!
            <br />
            5분만 투자하면 코딩 실력이 쑥쑥 올라요.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="w-full sm:w-auto px-10 py-4 bg-[#58cc02] text-white text-lg font-bold rounded-2xl border-b-4 border-[#46a302] hover:bg-[#58cc02]/90 active:border-b-0 active:mt-1 transition-all flex items-center justify-center gap-2"
            >
              학습 시작하기
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-4 h-4 bg-[#ffc800] rounded-full opacity-60" />
        <div className="absolute top-40 right-20 w-6 h-6 bg-[#ff4b4b] rounded-full opacity-60" />
        <div className="absolute bottom-20 left-1/4 w-5 h-5 bg-[#1cb0f6] rounded-full opacity-60" />
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 px-4 bg-[#f7f7f7]">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl md:text-4xl font-black text-[#3c3c3c] text-center mb-12">
            왜 <span className="text-[#58cc02]">EduVibe-AI</span>일까요?
          </h3>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-white rounded-3xl p-8 border-2 border-[#e5e5e5] hover:border-[#58cc02] transition-all hover:-translate-y-1">
              <div className="w-16 h-16 bg-[#58cc02]/10 rounded-2xl flex items-center justify-center mb-6">
                <Sparkles className="w-8 h-8 text-[#58cc02]" />
              </div>
              <h4 className="text-xl font-bold text-[#3c3c3c] mb-3">
                AI 맞춤 학습
              </h4>
              <p className="text-[#777] font-semibold">
                당신의 학습 패턴을 분석해 최적화된 커리큘럼을 제공해요.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-3xl p-8 border-2 border-[#e5e5e5] hover:border-[#1cb0f6] transition-all hover:-translate-y-1">
              <div className="w-16 h-16 bg-[#1cb0f6]/10 rounded-2xl flex items-center justify-center mb-6">
                <Gamepad2 className="w-8 h-8 text-[#1cb0f6]" />
              </div>
              <h4 className="text-xl font-bold text-[#3c3c3c] mb-3">
                게이미피케이션
              </h4>
              <p className="text-[#777] font-semibold">
                XP, 스트릭, 레벨업! 게임하듯 재미있게 코딩을 배워요.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-3xl p-8 border-2 border-[#e5e5e5] hover:border-[#ffc800] transition-all hover:-translate-y-1">
              <div className="w-16 h-16 bg-[#ffc800]/10 rounded-2xl flex items-center justify-center mb-6">
                <Code className="w-8 h-8 text-[#ffc800]" />
              </div>
              <h4 className="text-xl font-bold text-[#3c3c3c] mb-3">
                실전 프로젝트
              </h4>
              <p className="text-[#777] font-semibold">
                배운 내용을 바로 적용하는 미니 프로젝트로 실력을 키워요.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl md:text-4xl font-black text-[#3c3c3c] mb-6">
            지금 바로 시작하세요!
          </h3>
          <p className="text-lg text-[#777] font-semibold mb-8">
            AI와 함께 코딩 마스터가 되어보세요.
          </p>
          <Link
            href="/login"
            className="inline-block px-12 py-5 bg-[#58cc02] text-white text-xl font-bold rounded-2xl border-b-4 border-[#46a302] hover:bg-[#58cc02]/90 active:border-b-0 active:mt-1 transition-all"
          >
            로그인하고 시작하기
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#3c3c3c] text-white py-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-2xl font-black text-[#58cc02] mb-4">
            EduVibe<span className="text-[#1cb0f6]">-AI</span>
          </h1>
          <p className="text-[#afafaf] font-semibold">
            AI 코딩 학습 플랫폼
          </p>
          <div className="mt-6 flex items-center justify-center gap-6 text-sm text-[#afafaf]">
            <Link href="#" className="hover:text-white transition-colors">
              이용약관
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              개인정보처리방침
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              문의하기
            </Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
