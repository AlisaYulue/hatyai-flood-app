-- MySQL Workbench: เปิดไฟล์นี้ในแท็บ SQL แล้วกด Execute (ไอคอนสายฟ้า) ทั้งไฟล์
-- แก้ชื่อ schema ให้ตรงกับของคุณก่อนรัน
USE hatyai_flood_db;

-- ตารางจุดจอดรถหนีน้ำ (สอดคล้องกับ ER เดิม: ใช้ INT/TINYINT/TIMESTAMP แบบเดียวกัน)
CREATE TABLE IF NOT EXISTS parking_groups (
    id         VARCHAR(50)  PRIMARY KEY,
    label      VARCHAR(255) NOT NULL,
    note       TEXT,
    sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS parking_spots (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    group_id   VARCHAR(50)  NOT NULL,
    name       VARCHAR(255) NOT NULL,
    latitude   DECIMAL(10,8) NULL,
    longitude  DECIMAL(11,8) NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_active  TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES parking_groups(id)
);

INSERT INTO parking_groups (id, label, note, sort_order) VALUES
('municipality','เทศบาลนครหาดใหญ่','ข้อมูลจากแผนเตรียมความพร้อมของเทศบาล ไม่ได้หมายความว่าทุกแห่งจะเปิดรับรถพร้อมกันทุกครั้ง',1),
('psu','ม.อ. หาดใหญ่','ประกาศเปิดรับในเหตุอุทกภัยปี 2567 — ติดชื่อและเบอร์ติดต่อไว้ที่รถ',2),
('khohong','เทศบาลเมืองคอหงส์','ข้อมูลรวบรวมโดย PSU Broadcast',3);

INSERT INTO parking_spots (group_id, name, sort_order) VALUES
('municipality','สวนสาธารณะเทศบาลนครหาดใหญ่',1),
('municipality','มหาวิทยาลัยสงขลานครินทร์',2),
('municipality','ศูนย์การค้าเทสโก้โลตัส',3),
('municipality','ศูนย์วิจัยการยางฯ',4),
('municipality','ศูนย์การค้าโรบินสัน',5),
('municipality','โรงแรมหรรษาเจบี',6),
('municipality','ศูนย์การค้าเซ็นทรัลเฟสติวัลหาดใหญ่',7),
('municipality','สถานีขนส่งผู้โดยสารอำเภอหาดใหญ่',8),
('municipality','ศูนย์การค้าไดอาน่า',9),
('municipality','ศูนย์การค้าเทสโก้โลตัส หาดใหญ่ใน',10),
('psu','ลานจอดรถคณะทรัพยากรธรรมชาติ (หน้าตลาดเกษตร ม.อ.)',1),
('psu','ลานจอดรถข้างร้านยาเภสัชฯ ม.อ.',2),
('psu','ลานจอดรถคณะเศรษฐศาสตร์',3),
('psu','ลานจอดรถข้างสำนักงานอธิการบดี',4),
('psu','ลานจอดรถสำนักนวัตกรรมดิจิทัลและระบบอัจฉริยะ',5),
('psu','ลานจอดรถทางเชื่อมศูนย์ประชุม ม.อ. และคณะสัตวแพทยศาสตร์',6),
('khohong','สำนักงานเทศบาลเมืองคอหงส์',1),
('khohong','โรงแรม TR Rock Hill หาดใหญ่',2),
('khohong','ศูนย์ประชุมนานาชาติฉลองสิริราชสมบัติครบ 60 ปี',3),
('khohong','ศาลเจ้าแม่กวนอิม 100 ปี บ้านปลักธง',4),
('khohong','แม็คโคร หาดใหญ่',5);
