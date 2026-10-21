USE hatyai_flood_db;

ALTER TABLE flood_reports
ADD COLUMN reporter_email VARCHAR(255) NULL AFTER status,
ADD COLUMN auto_approved TINYINT (1) NOT NULL DEFAULT 0 AFTER reporter_email,
ADD INDEX idx_reports_geo (latitude, longitude),
ADD INDEX idx_reports_time (reported_at);

-- ตรวจสอบค่าใน enum ว่ามี Warning / Danger / Critical และ pending / approved ครบ
SHOW COLUMNS
FROM
    flood_reports LIKE 'risk_level';

SHOW COLUMNS
FROM
    flood_reports LIKE 'status';