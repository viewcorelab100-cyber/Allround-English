-- ============================================================
-- 알림톡 로그 테이블 컬럼 보강
-- notification_logs 단일 테이블 사용 확정
-- ============================================================

-- 1. notification_logs 테이블에 누락 컬럼 추가 (이미 있으면 무시)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'notification_logs' AND column_name = 'submission_id') THEN
        ALTER TABLE public.notification_logs ADD COLUMN submission_id UUID;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'notification_logs' AND column_name = 'notification_type') THEN
        ALTER TABLE public.notification_logs ADD COLUMN notification_type VARCHAR(50);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'notification_logs' AND column_name = 'recipient_phone') THEN
        ALTER TABLE public.notification_logs ADD COLUMN recipient_phone VARCHAR(20);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'notification_logs' AND column_name = 'status') THEN
        ALTER TABLE public.notification_logs ADD COLUMN status VARCHAR(10) DEFAULT 'sent';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'notification_logs' AND column_name = 'error_message') THEN
        ALTER TABLE public.notification_logs ADD COLUMN error_message TEXT;
    END IF;
END $$;

-- 2. 결과 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'notification_logs'
ORDER BY ordinal_position;
