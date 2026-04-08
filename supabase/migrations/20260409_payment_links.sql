-- ============================================================
-- payment_links: 학부모 결제 링크 테이블
-- 관리자가 생성 → 학부모에게 SMS 발송 → 토큰으로 결제 접근
-- ============================================================

CREATE TABLE IF NOT EXISTS payment_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token VARCHAR(64) UNIQUE NOT NULL,
  student_id UUID NOT NULL REFERENCES profiles(id),
  course_id UUID NOT NULL REFERENCES courses(id),
  amount INTEGER NOT NULL,
  textbook_amount INTEGER DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_by UUID NOT NULL REFERENCES profiles(id),
  guardian_phone VARCHAR(20) NOT NULL,
  student_name VARCHAR(100),
  course_title VARCHAR(200),
  expires_at TIMESTAMPTZ NOT NULL,
  paid_at TIMESTAMPTZ,
  order_id VARCHAR(100),
  payment_key VARCHAR(200),
  sms_sent_at TIMESTAMPTZ,
  sms_status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_payment_links_token ON payment_links(token);
CREATE INDEX IF NOT EXISTS idx_payment_links_status ON payment_links(status);
CREATE INDEX IF NOT EXISTS idx_payment_links_student ON payment_links(student_id);
CREATE INDEX IF NOT EXISTS idx_payment_links_created_by ON payment_links(created_by);

-- RLS 활성화
ALTER TABLE payment_links ENABLE ROW LEVEL SECURITY;

-- 관리자: 모든 CRUD
CREATE POLICY "admin_all" ON payment_links FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 학생: 본인이 생성한 링크 INSERT + 본인 링크 SELECT/UPDATE
CREATE POLICY "student_insert_own" ON payment_links FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = student_id AND auth.uid() = created_by);

CREATE POLICY "student_select_own" ON payment_links FOR SELECT
  TO authenticated USING (auth.uid() = student_id OR auth.uid() = created_by);

CREATE POLICY "student_update_own" ON payment_links FOR UPDATE
  TO authenticated
  USING (auth.uid() = student_id OR auth.uid() = created_by)
  WITH CHECK (auth.uid() = student_id OR auth.uid() = created_by);

-- 비로그인(anon): token 기반 SELECT (학부모 결제 페이지 접근용)
CREATE POLICY "anon_select" ON payment_links FOR SELECT
  TO anon USING (true);
