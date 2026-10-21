// pages/api/help-requests.js
import db from '../../lib/db';

// กรอบพื้นที่หาดใหญ่โดยประมาณ — ปรับได้ตามต้องการ
const BOUNDS = { latMin: 6.9, latMax: 7.15, lngMin: 100.3, lngMax: 100.6 };
const TYPES = ['rescue', 'medical', 'food_water', 'evacuate', 'other'];
const URGENCY = ['critical', 'urgent', 'normal'];

// เบลอเบอร์ที่ฝั่งเซิร์ฟเวอร์ ก่อนส่งออกไปหน้าสาธารณะ เช่น 0801234567 -> 080***456*
// (เบอร์เต็มจะไม่ถูกส่งออกจาก endpoint นี้เลย — admin ดูจากหลังบ้านเท่านั้น)
function maskPhone(phone) {
    const p = String(phone || '').replace(/\D/g, '');
    if (p.length < 9) return '***';
    const head = p.length >= 10 ? 3 : 2;
    return `${p.slice(0, head)}***${p.slice(head + 3, head + 6)}*`;
}

// คอลัมน์ที่ API ต้องใช้ ถ้าตารางเดิมขาดตัวไหน จะเติมให้เองตอนเรียก API ครั้งแรก
// (กรณีสร้างตารางไว้ก่อนแล้วไม่ครบ ทำให้ SELECT/INSERT พัง)
const REQUIRED_COLUMNS = {
    user_email: 'VARCHAR(255) NOT NULL DEFAULT \'\'',
    contact_name: 'VARCHAR(255) NULL',
    phone: 'VARCHAR(30) NOT NULL DEFAULT \'\'',
    show_phone_public: 'TINYINT(1) NOT NULL DEFAULT 0',
    help_type: 'VARCHAR(30) NOT NULL DEFAULT \'other\'',
    urgency: 'VARCHAR(20) NOT NULL DEFAULT \'urgent\'',
    status: "ENUM('pending','open','in_progress','resolved','rejected') NOT NULL DEFAULT 'pending'",
    people_count: 'INT NOT NULL DEFAULT 1',
    has_vulnerable: 'TINYINT(1) NOT NULL DEFAULT 0',
    location_name: 'VARCHAR(255) NOT NULL DEFAULT \'\'',
    details: 'TEXT NULL',
    latitude: 'DECIMAL(10,7) NOT NULL DEFAULT 0',
    longitude: 'DECIMAL(10,7) NOT NULL DEFAULT 0',
    admin_note: 'TEXT NULL',
    created_at: 'TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP',
};

let schemaChecked = false;
async function ensureSchema() {
    if (schemaChecked) return;
    try {
        const [cols] = await db.query(
            `SELECT COLUMN_NAME AS name FROM information_schema.columns
              WHERE table_schema = DATABASE() AND table_name = 'help_requests'`
        );
        const have = new Set(cols.map((c) => c.name));
        for (const [name, ddl] of Object.entries(REQUIRED_COLUMNS)) {
            if (!have.has(name)) {
                await db.query(`ALTER TABLE help_requests ADD COLUMN ${name} ${ddl}`);
                console.log(`[help-requests] เพิ่มคอลัมน์ที่ขาด: ${name}`);
            }
        }
        schemaChecked = true;
    } catch (e) {
        // ถ้าไม่มีสิทธิ์ ALTER หรือไม่มีตาราง ให้ log ไว้ แล้วปล่อยให้ query หลักรายงาน error จริง
        console.error('[help-requests] ตรวจ/เติมคอลัมน์ไม่สำเร็จ:', e.message);
    }
}

export default async function handler(req, res) {
    try {
        await ensureSchema();

        if (req.method === 'GET') {
            // สาธารณะ: เฉพาะที่แอดมินยืนยันแล้ว
            // ไม่ส่งเบอร์เต็ม/ชื่อ/อีเมลออกไป ส่งเฉพาะเบอร์ที่เบลอแล้วใน phone_masked
            const [rows] = await db.query(
                `SELECT id, help_type, urgency, status, people_count, has_vulnerable,
                        location_name, details, latitude, longitude, created_at, phone
                   FROM help_requests
                  WHERE status IN ('open','in_progress')
                  ORDER BY FIELD(urgency,'critical','urgent','normal'), created_at DESC`
            );
            const safe = rows.map(({ phone, ...rest }) => ({ ...rest, phone_masked: maskPhone(phone) }));

            // ไม่ cache ตอน dev จะได้เห็นผลที่แก้ในฐานข้อมูลทันที
            if (process.env.NODE_ENV === 'production') {
                res.setHeader('Cache-Control', 's-maxage=20, stale-while-revalidate=60');
            } else {
                res.setHeader('Cache-Control', 'no-store');
            }
            return res.status(200).json(safe);
        }

        if (req.method === 'POST') {
            const b = req.body || {};
            const lat = Number(b.latitude);
            const lng = Number(b.longitude);
            const email = String(b.user_email || '').trim();
            const phone = String(b.phone || '').replace(/[^\d+]/g, '');
            const people = Math.max(1, Math.min(200, parseInt(b.people_count, 10) || 1));

            if (!email) return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบก่อน' });
            if (!TYPES.includes(b.help_type)) return res.status(400).json({ error: 'กรุณาเลือกประเภทความช่วยเหลือ' });
            if (!URGENCY.includes(b.urgency)) return res.status(400).json({ error: 'กรุณาเลือกความเร่งด่วน' });
            if (phone.length < 9) return res.status(400).json({ error: 'กรุณาระบุเบอร์โทรที่ติดต่อได้' });
            if (!String(b.location_name || '').trim()) return res.status(400).json({ error: 'กรุณาระบุที่อยู่หรือจุดสังเกต' });
            if (!Number.isFinite(lat) || !Number.isFinite(lng) ||
                lat < BOUNDS.latMin || lat > BOUNDS.latMax || lng < BOUNDS.lngMin || lng > BOUNDS.lngMax) {
                return res.status(400).json({ error: 'ตำแหน่งต้องอยู่ในพื้นที่หาดใหญ่' });
            }

            // กันการส่งซ้ำ: คำขอที่ยังไม่ปิดของอีเมลเดียวกันไม่เกิน 3 รายการ
            const [[{ n }]] = await db.query(
                `SELECT COUNT(*) AS n FROM help_requests
                  WHERE user_email = ? AND status IN ('pending','open','in_progress')`,
                [email]
            );
            if (n >= 3) return res.status(429).json({ error: 'คุณมีคำขอที่ยังดำเนินการอยู่ 3 รายการแล้ว' });

            // show_phone_public บังคับเป็น 0 เสมอ (นโยบายใหม่: เบอร์เบลอทุกกรณี)
            await db.query(
                `INSERT INTO help_requests
                   (user_email, contact_name, phone, show_phone_public, help_type, urgency,
                    people_count, has_vulnerable, location_name, details, latitude, longitude, status)
                 VALUES (?,?,?,0,?,?,?,?,?,?,?,?, 'pending')`,
                [email, (b.contact_name || '').slice(0, 255), phone,
                    b.help_type, b.urgency, people, b.has_vulnerable ? 1 : 0,
                    String(b.location_name).slice(0, 255), String(b.details || '').slice(0, 2000), lat, lng]
            );
            return res.status(201).json({ ok: true });
        }

        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: 'Method not allowed' });
    } catch (e) {
        console.error('[help-requests]', e);
        return res.status(500).json({
            error: 'เกิดข้อผิดพลาดของระบบ',
            // ตอน dev ส่งสาเหตุจริงกลับมาด้วย เปิด /api/help-requests ดูได้เลย (production จะไม่ส่ง)
            ...(process.env.NODE_ENV !== 'production' && { detail: e.message, code: e.code }),
        });
    }
}