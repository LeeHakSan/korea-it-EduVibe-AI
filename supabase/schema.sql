-- ══════════════════════════════════════════════════════════════════
-- EduVibe-AI  Supabase 스키마 (앱 코드 기준)
-- Supabase 대시보드 → SQL Editor 에 붙여넣어 실행하세요.
-- 기존 프로젝트: 정책/트리거 충돌 시 아래 DROP 구문이 정리합니다.
-- ══════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────────
-- 1. profiles  (auth.users 와 1:1, 퀴즈 API의 역할 검증에 사용)
--    ※ 역할의 소스 오브 트루스는 앱에서 user_metadata 이기도 하지만,
--      questions / quiz_results API는 여기 role 컬럼을 봅니다.
--      관리자가 update-role 로 메타만 바꾸면 불일치할 수 있으니 운영 시 동기화 권장.
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  role        TEXT NOT NULL DEFAULT 'student',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 이미 예전 스키마로 만들어진 DB: role 에 admin 반영
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check CHECK (role IN ('student', 'instructor', 'admin'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r TEXT;
BEGIN
  r := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
  IF r NOT IN ('student', 'instructor', 'admin') THEN
    r := 'student';
  END IF;
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    r
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles: 본인 조회" ON public.profiles;
DROP POLICY IF EXISTS "profiles: 본인 수정" ON public.profiles;
DROP POLICY IF EXISTS "profiles: 강사가 제출 결과 학생 프로필 조회" ON public.profiles;

CREATE POLICY "profiles: 본인 조회"
  ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles: 본인 수정"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- quiz_results 조회 시 PostgREST embed profiles!student_id 가 동작하도록
CREATE POLICY "profiles: 강사가 제출 결과 학생 프로필 조회"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quiz_results qr
      JOIN public.questions q ON q.id = qr.question_id
      WHERE qr.student_id = profiles.id
        AND q.instructor_id = auth.uid()
    )
  );


-- ──────────────────────────────────────────────────────────────────
-- 2. questions
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.questions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  content       TEXT NOT NULL,
  options       JSONB,
  answer        TEXT,
  topic         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "questions: 인증 사용자 조회" ON public.questions;
DROP POLICY IF EXISTS "questions: 강사 생성" ON public.questions;
DROP POLICY IF EXISTS "questions: 강사 수정" ON public.questions;
DROP POLICY IF EXISTS "questions: 강사 삭제" ON public.questions;

CREATE POLICY "questions: 인증 사용자 조회"
  ON public.questions FOR SELECT
  USING (auth.role() = 'authenticated');

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
-- 3. quiz_results
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.quiz_results (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id  UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  answer       TEXT NOT NULL,
  is_correct   BOOLEAN NOT NULL,
  score        NUMERIC(5, 2),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "quiz_results: 학생 본인 조회" ON public.quiz_results;
DROP POLICY IF EXISTS "quiz_results: 학생 제출" ON public.quiz_results;
DROP POLICY IF EXISTS "quiz_results: 강사 조회" ON public.quiz_results;

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
-- 4. materials  (PDF 업로드 / 퀴즈 자료)
--    컬럼: app/api/upload/route.ts, app/quiz/page.tsx 와 동일
--    보안: 업로드가 anon 키(lib/supabase.ts)라면 아래 완화 정책이 필요함.
--         운영에서는 서비스 롤 클라이언트로 업로드만 바꾸는 것을 권장.
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.materials (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id   TEXT NOT NULL,
  filename   TEXT NOT NULL,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_materials_class_id ON public.materials (class_id);

ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "materials: 누구나 읽기" ON public.materials;
DROP POLICY IF EXISTS "materials: 누구나 삽입" ON public.materials;

CREATE POLICY "materials: 누구나 읽기"
  ON public.materials FOR SELECT
  USING (true);

CREATE POLICY "materials: 누구나 삽입"
  ON public.materials FOR INSERT
  WITH CHECK (true);


-- ──────────────────────────────────────────────────────────────────
-- 5. updated_at 트리거
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
