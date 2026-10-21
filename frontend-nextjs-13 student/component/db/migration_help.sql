-- MySQL Workbench: เปิดไฟล์นี้ในแท็บ SQL แล้วกด Execute (ไอคอนสายฟ้า) ทั้งไฟล์
-- แก้ชื่อ schema ให้ตรงกับของคุณก่อนรัน
USE hatyai_flood_db;

-- ระบบขอความช่วยเหลือ (แทน flood_reports)
CREATE TABLE IF NOT EXISTS help_requests (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    user_email        VARCHAR(255) NOT NULL,
    contact_name      VARCHAR(255) NULL,
    phone             VARCHAR(30)  NOT NULL,
    show_phone_public TINYINT(1) NOT NULL DEFAULT 0,
    help_type         ENUM('rescue','medical','food_water','evacuate','other') NOT NULL,
    urgency           ENUM('critical','urgent','normal') NOT NULL DEFAULT 'urgent',
    people_count      INT NOT NULL DEFAULT 1,
    has_vulnerable    TINYINT(1) NOT NULL DEFAULT 0,   -- ผู้สูงอายุ/เด็ก/ผู้ป่วยติดเตียง
    location_name     VARCHAR(255) NOT NULL,
    details           TEXT,
    latitude          DECIMAL(10,8) NOT NULL,
    longitude         DECIMAL(11,8) NOT NULL,
    -- pending=รอแอดมินตรวจสอบ, open=รอความช่วยเหลือ, in_progress=กำลังช่วยเหลือ, resolved=เสร็จสิ้น, rejected=ปฏิเสธ
    status            ENUM('pending','open','in_progress','resolved','rejected') NOT NULL DEFAULT 'pending',
    admin_note        TEXT NULL,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_email (user_email)
);
