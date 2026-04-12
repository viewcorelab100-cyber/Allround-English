-- ============================================================
-- playback_errors: insert_anon 정책 제거
--
-- 이유: anon key는 클라이언트 JS에 노출되어 누구나 임의 데이터를
--      무제한 insert 가능 → DoS / DB 폭탄 위험 (CTO 코드 분석 C-1)
--
-- 결정: 비로그인 상태 재생 에러는 로깅 포기.
--      학원 사이트 특성상 모든 강의가 로그인 게이트라 실용 가치 거의 0.
--
-- 효과: 로그인 사용자만 자기 user_id로 insert 가능 (insert_own 정책 유지)
-- ============================================================

DROP POLICY IF EXISTS "playback_errors_insert_anon" ON public.playback_errors;
