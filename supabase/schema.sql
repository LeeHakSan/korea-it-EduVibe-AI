-- ══════════════════════════════════════════════════════════════════
-- EduVibe-AI  Supabase Schema & RLS 정책
-- Supabase 대시보드 → SQL Editor 에 전체 붙여넣기 후 실행하세요.
-- ══════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────────
-- 1. profiles 테이블
--    auth.users 와 1:1 대응. 역할(role)을 여기서 관리합니다.
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  role        TEXT NOT NULL DEFAULT 'student'
                CHECK (role IN ('student', 'instructor')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 신규 가입 시 user_metadata 에서 role/full_name 을 읽어 profiles 에 자동 삽입
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS 활성화
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 본인만 자신의 프로필을 읽고 수정 가능
CREATE POLICY "profiles: 본인 조회"   ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles: 본인 수정"   ON public.profiles FOR UPDATE USING (auth.uid() = id);


-- ──────────────────────────────────────────────────────────────────
-- 2. questions 테이블
--    강사가 만든 퀴즈 문제. 학생은 읽기만 가능.
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.questions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  content      TEXT NOT NULL,
  options      JSONB,          -- 객관식 선택지 배열 (선택 사항)
  answer       TEXT,           -- 정답 (선택 사항)
  topic        TEXT,           -- 단원/주제 태그
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- 모든 인증 사용자가 문제를 읽을 수 있음
CREATE POLICY "questions: 인증 사용자 조회"
  ON public.questions FOR SELECT
  USING (auth.role() = 'authenticated');

-- 강사만 자신이 만든 문제를 생성/수정/삭제 가능
CREATE POLICY "questions: 강사 생성"
  ON public.questions FOR INSERT
  WITH CHECK (
    auth.uid() = instructor_id
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'instructor'
    )
  );

CREATE POLICY "questions: 강사 수정"
  ON public.questions FOR UPDATE
  USING (
    auth.uid() = instructor_id
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'instructor'
    )
  );

CREATE POLICY "questions: 강사 삭제"
  ON public.questions FOR DELETE
  USING (
    auth.uid() = instructor_id
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'instructor'
    )
  );


-- ──────────────────────────────────────────────────────────────────
-- 3. quiz_results 테이블
--    학생의 퀴즈 제출 결과 저장소.
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.quiz_results (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id  UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  answer       TEXT NOT NULL,           -- 학생이 제출한 답
  is_correct   BOOLEAN NOT NULL,
  score        NUMERIC(5, 2),           -- 0.00 ~ 100.00
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;

-- 학생: 본인 결과만 읽기/쓰기
CREATE POLICY "quiz_results: 학생 본인 조회"
  ON public.quiz_results FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "quiz_results: 학생 제출"
  ON public.quiz_results FOR INSERT
  WITH CHECK (
    auth.uid() = student_id
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'student'
    )
  );

-- 강사: 자신이 만든 문제에 대한 모든 학생 결과 조회 가능
CREATE POLICY "quiz_results: 강사 조회"
  ON public.quiz_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.questions q
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE q.id = quiz_results.question_id
        AND q.instructor_id = auth.uid()
        AND p.role = 'instructor'
    )
  );


-- ──────────────────────────────────────────────────────────────────
-- 4. updated_at 자동 갱신 트리거 (profiles, questions)
-- ──────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_questions_updated_at ON public.questions;
CREATE TRIGGER trg_questions_updated_at
  BEFORE UPDATE ON public.questions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
