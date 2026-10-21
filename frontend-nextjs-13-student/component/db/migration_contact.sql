-- ตารางเก็บข้อความ/ปัญหาที่ผู้ใช้แจ้งเข้ามา (แยกจาก reports ที่เป็นรายงานระดับน้ำท่วม)
CREATE TABLE
    IF NOT EXISTS contact_messages (
        id SERIAL PRIMARY KEY,
        name TEXT,
        email TEXT NOT NULL,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'replied'
        admin_reply TEXT,
        replied_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW ()
    );

CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages (status);

CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages (created_at DESC);