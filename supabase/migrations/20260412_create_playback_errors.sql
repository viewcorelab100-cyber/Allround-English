-- ============================================================
-- playback_errors: Vimeo 재생 에러 자동 로깅 테이블
-- 학생 → 원장님 → PM 핑퐁 루프 차단을 위한 에러 적재
-- 관련 문서: docs/02-design/features/vimeo-error-and-inapp-detection.design.md
-- ============================================================

CREATE TABLE IF NOT EXISTS public.playback_errors (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    lesson_id       UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
    course_id       UUID REFERENCES public.courses(id) ON DELETE SET NULL,
    -- 에러 분류
    error_name      TEXT NOT NULL,
    error_message   TEXT,
    error_method    TEXT,
    -- 환경 정보
    ua              TEXT NOT NULL,
    is_kakao_inapp  BOOLEAN DEFAULT false,
    is_inapp        BOOLEAN DEFAULT false,
    inapp_type      TEXT,
    page_url        TEXT,
    -- 메타
    occurred_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 조회 성능 인덱스
CREATE INDEX IF NOT EXISTS idx_playback_errors_user_id
    ON public.playback_errors(user_id);
CREATE INDEX IF NOT EXISTS idx_playback_errors_occurred_at
    ON public.playback_errors(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_playback_errors_error_name
    ON public.playback_errors(error_name);
CREATE INDEX IF NOT EXISTS idx_playback_errors_lesson_id
    ON public.playback_errors(lesson_id) WHERE lesson_id IS NOT NULL;

-- RLS 활성화
ALTER TABLE public.playback_errors ENABLE ROW LEVEL SECURITY;

-- 정책 1: 본인은 자기 에러만 조회 가능
DROP POLICY IF EXISTS "playback_errors_select_own" ON public.playback_errors;
CREATE POLICY "playback_errors_select_own"
    ON public.playback_errors
    FOR SELECT
    USING (auth.uid() = user_id);

-- 정책 2: 관리자는 모든 에러 조회 가능
DROP POLICY IF EXISTS "playback_errors_select_admin" ON public.playback_errors;
CREATE POLICY "playback_errors_select_admin"
    ON public.playback_errors
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role = 'admin'
        )
    );

-- 정책 3: 본인만 insert (자기 에러를 자기 계정으로)
DROP POLICY IF EXISTS "playback_errors_insert_own" ON public.playback_errors;
CREATE POLICY "playback_errors_insert_own"
    ON public.playback_errors
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 정책 4: 비로그인 사용자도 insert 가능 (user_id NULL)
DROP POLICY IF EXISTS "playback_errors_insert_anon" ON public.playback_errors;
CREATE POLICY "playback_errors_insert_anon"
    ON public.playback_errors
    FOR INSERT
    WITH CHECK (auth.uid() IS NULL AND user_id IS NULL);

-- 코멘트 (대시보드에서 식별하기 쉽도록)
COMMENT ON TABLE public.playback_errors IS 'Vimeo 재생 에러 자동 로깅. PM 디버깅용. 학생 화면은 단순 4종 메시지, 백엔드 로그는 6종+ 분류.';
COMMENT ON COLUMN public.playback_errors.error_name IS 'PrivacyError, PasswordError, NotFoundError, NotPlayableError, UnsupportedError, RangeError, TypeError, Unknown';
COMMENT ON COLUMN public.playback_errors.inapp_type IS 'kakao | naver | instagram | facebook | line | NULL';
