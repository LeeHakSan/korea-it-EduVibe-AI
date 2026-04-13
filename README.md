# EduVibe-AI

> AI와 함께하는 즐거운 IT 학습 플랫폼 | 바이브 코딩 공모전 출품작

게임처럼 재미있게, AI 튜터와 함께 효과적으로 코딩을 배울 수 있는 웹 서비스입니다.

---

## 주요 기능

- **AI 맞춤 학습** — Claude AI가 학습 패턴을 분석해 최적화된 커리큘럼과 질문을 제공합니다.
- **게이미피케이션** — XP, 스트릭, 레벨업 시스템으로 게임처럼 동기부여를 유지합니다.
- **AI 챗봇** — 언제든지 궁금한 내용을 Claude AI 튜터에게 물어볼 수 있습니다.
- **퀴즈** — 학습한 내용을 퀴즈로 점검하고 결과를 확인합니다.
- **코드 실행** — 배운 내용을 브라우저에서 바로 실행해볼 수 있습니다.
- **화이트보드** — 자유롭게 개념을 정리하고 시각화합니다.
- **PDF 업로드** — 학습 자료를 업로드하면 AI가 내용을 분석해 퀴즈와 요약을 생성합니다.
- **인터뷰 연습** — AI와의 모의 기술 면접으로 취업을 준비합니다.
- **선생님 모드** — 강의 자료 등록, 학생 Q&A 관리, 출석 확인 기능을 제공합니다.

---

## 기술 스택

| 분류 | 사용 기술 |
|------|-----------|
| 프레임워크 | Next.js 16, React 19, TypeScript |
| 스타일링 | Tailwind CSS 4 |
| 백엔드 / DB | Supabase (Auth + Database) |
| AI | Anthropic Claude (`@anthropic-ai/sdk`) |
| 이메일 | Nodemailer |
| 파일 처리 | pdf-parse |
| 아이콘 | lucide-react |
| 테마 | next-themes |

---

## 시작하기

### 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 아래 값을 채워주세요.

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

### 설치 및 실행

```bash
npm install
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열면 됩니다.

### 빌드

```bash
npm run build
npm run start
```

---

## 프로젝트 구조

```
app/
├── page.tsx              # 랜딩 페이지
├── login/                # 로그인
├── signup/               # 회원가입
├── forgot-password/      # 비밀번호 찾기
├── dashboard/            # 대시보드
│   ├── home/             # 홈
│   ├── learn/            # 학습
│   ├── quest/            # 퀘스트 (게이미피케이션)
│   ├── today/            # 오늘의 학습
│   ├── whiteboard/       # 화이트보드
│   ├── career/           # 커리어 / 면접 준비
│   ├── teacher/          # 선생님 모드
│   ├── notices/          # 공지사항
│   └── profile/          # 프로필
├── quiz/                 # 퀴즈
├── result/               # 퀴즈 결과
├── chatbot/              # AI 챗봇
└── api/                  # API 라우트
    ├── chat/             # AI 채팅
    ├── quiz/             # 퀴즈 생성
    ├── quiz-results/     # 퀴즈 결과 저장
    ├── code/             # 코드 실행
    ├── course/           # 강의 관련
    ├── upload/           # PDF 업로드
    ├── questions/        # 학습 질문
    ├── student-qa/       # 학생 Q&A
    ├── teacher/          # 선생님 API
    ├── attendance/       # 출석
    ├── generate-missions/# 미션 생성
    └── interview-requests/ # 인터뷰 요청
```
테스트용 가계정 ID, PWD

관리자 id pw
id : admin@test.com
pw : admin@test.com

학생 id pw
id : student@test.com
pw : student@test.com

강사
id : teacher@test.com
pw : teacher@test.com


---

## 라이선스

[MIT](./LICENSE)
