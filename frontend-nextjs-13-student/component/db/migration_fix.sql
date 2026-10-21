-- db/migration_fix.sql
-- รันใน MySQL Workbench ที่ schema `hatyai_flood_db`
-- ทำให้ตารางตรงกับ API ที่แก้ใหม่
USE hatyai_flood_db;

-- ------------------------------------------------------------------
-- 1) ตารางหมวดคู่มือ (ยังไม่มี = หน้า "คู่มือ" ในหน้า admin จะพังทันที)
-- ------------------------------------------------------------------
CREATE TABLE
    IF NOT EXISTS flood_guide_topics (
        id VARCHAR(50) NOT NULL PRIMARY KEY,
        icon VARCHAR(50) NOT NULL DEFAULT 'Package',
        color VARCHAR(20) NOT NULL DEFAULT '#2FBF83',
        title VARCHAR(255) NOT NULL,
        subtitle VARCHAR(255) NOT NULL DEFAULT '',
        sort_order INT NOT NULL DEFAULT 0,
        sections JSON NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ข้อมูลตัวอย่าง (รันครั้งเดียว จะได้เห็นของจริงในหน้า admin เลย)
INSERT IGNORE INTO flood_guide_topics (
    id,
    icon,
    color,
    title,
    subtitle,
    sort_order,
    sections
)
VALUES
    (
        'before',
        'Backpack',
        '#2FBF83',
        'ก่อนน้ำท่วม',
        'เตรียมของและวางแผนล่วงหน้า',
        1,
        JSON_ARRAY (
            JSON_OBJECT (
                'heading',
                'ของใช้จำเป็น',
                'items',
                JSON_ARRAY (
                    'น้ำดื่มสำรอง คนละ 3 ลิตร/วัน',
                    'ไฟฉาย ถ่านไฟฉาย และพาวเวอร์แบงก์',
                    'ยาประจำตัวและชุดปฐมพยาบาล'
                )
            ),
            JSON_OBJECT (
                'heading',
                'เอกสารสำคัญ',
                'items',
                JSON_ARRAY (
                    'ใส่ซองกันน้ำ เก็บไว้ที่สูง',
                    'ถ่ายรูปเก็บไว้ในโทรศัพท์เผื่อเอกสารเสียหาย'
                )
            )
        )
    ),
    (
        'during',
        'ShieldAlert',
        '#FF6B4A',
        'ระหว่างน้ำท่วม',
        'เอาตัวรอดให้ปลอดภัย',
        2,
        JSON_ARRAY (
            JSON_OBJECT (
                'heading',
                'ห้ามทำ',
                'items',
                JSON_ARRAY (
                    'ห้ามเดินลุยน้ำที่ไหลแรงเกินหัวเข่า',
                    'ห้ามแตะอุปกรณ์ไฟฟ้าขณะตัวเปียก'
                )
            ),
            JSON_OBJECT (
                'heading',
                'ควรทำ',
                'items',
                JSON_ARRAY (
                    'ตัดเบรกเกอร์ไฟก่อนน้ำเข้าบ้าน',
                    'ย้ายขึ้นที่สูงและติดตามประกาศจากเทศบาล'
                )
            )
        )
    ),
    (
        'after',
        'Wrench',
        '#1C6E8C',
        'หลังน้ำลด',
        'ทำความสะอาดและฟื้นฟู',
        3,
        JSON_ARRAY (
            JSON_OBJECT (
                'heading',
                'ตรวจความปลอดภัย',
                'items',
                JSON_ARRAY (
                    'ให้ช่างตรวจระบบไฟก่อนเปิดใช้',
                    'ระวังสัตว์มีพิษที่หนีน้ำเข้ามาในบ้าน'
                )
            ),
            JSON_OBJECT (
                'heading',
                'สุขอนามัย',
                'items',
                JSON_ARRAY (
                    'ล้างบ้านด้วยน้ำยาฆ่าเชื้อ',
                    'ต้มน้ำก่อนดื่มจนกว่าน้ำประปาจะปกติ'
                )
            )
        )
    );

-- ------------------------------------------------------------------
-- 2) ตรวจ flood_reports ให้มีคอลัมน์ที่ API ใช้จริง
--    (ถ้ารันแล้ว error ว่า Duplicate column แปลว่ามีอยู่แล้ว ข้ามได้เลย)
-- ------------------------------------------------------------------
-- ALTER TABLE flood_reports
--   ADD COLUMN status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
--   ADD COLUMN reported_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
-- ให้ค้นหา/กรองตามสถานะเร็วขึ้น
-- CREATE INDEX idx_flood_reports_status ON flood_reports (status, reported_at);
-- เช็คสคีมาจริงของตารางได้ด้วยคำสั่งนี้
-- SHOW COLUMNS FROM flood_reports;
-- SHOW COLUMNS FROM flood_alerts;