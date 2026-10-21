// pages/api/my-help-requests.js
// ให้ผู้ขอความช่วยเหลือดูสถานะคำขอของตัวเอง และยกเลิกคำขอที่ยังไม่มีผู้ช่วยเหลือได้
// หมายเหตุ: ระบบล็อกอินตอนนี้ระบุตัวตนด้วยอีเมลจาก localStorage เท่านั้น
// จึงไม่ส่งเบอร์โทร/พิกัดกลับไปเลย เพื่อจำกัดข้อมูลที่ใครบางคนจะเห็นได้ถ้ารู้อีเมลคนอื่น
// ถ้าจะใช้งานจริงจังควรเปลี่ยนเป็น session / JWT แล้วดึงอีเมลจากฝั่งเซิร์ฟเวอร์
import db from '../../lib/db';

let ready = false;
async function ensureUpdatedAt() {
    if (ready) return;
    try {
        const [c] = await db.query(
            `SELECT 1 FROM information_schema.columns
              WHERE table_schema = DATABASE() AND table_name = 'help_requests' AND column_name = 'updated_at'`
        );
        if (!c.length) {
            await db.query(
                `ALTER TABLE help_requests
                   ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
            );
            console.log('[my-help-requests] เพิ่มคอลัมน์ updated_at');
        }
        ready = true;
    } catch (e) {
        console.error('[my-help-requests] เติม updated_at ไม่สำเร็จ:', e.message);
    }
}

// หน้า my-requests ใช้ข้อความนี้แยกว่า "ผู้แจ้งยกเลิกเอง" ต่างจาก "แอดมินปฏิเสธ" ต้องเขียนให้ตรงกัน
const CANCEL_NOTE = 'ผู้แจ้งยกเลิกเอง';

export default async function handler(req, res) {
    try {
        await ensureUpdatedAt();

        if (req.method === 'GET') {
            const email = String(req.query.email || '').trim();
            if (!email) return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบก่อน' });

            const [rows] = await db.query(
                `SELECT id, help_type, urgency, status, people_count, has_vulnerable,
                        location_name, details, admin_note, created_at, updated_at
                   FROM help_requests
                  WHERE user_email = ?
                  ORDER BY created_at DESC
                  LIMIT 20`,
                [email]
            );
            res.setHeader('Cache-Control', 'no-store');
            return res.status(200).json(rows);
        }

        if (req.method === 'PATCH') {
            const { id, user_email } = req.body || {};
            const email = String(user_email || '').trim();
            if (!id || !email) return res.status(400).json({ error: 'ข้อมูลไม่ถูกต้อง' });

            // ยกเลิกได้เฉพาะคำขอของตัวเองที่ยังไม่มีผู้รับเรื่อง
            const [r] = await db.query(
                `UPDATE help_requests
                    SET status = 'rejected', admin_note = ?
                  WHERE id = ? AND user_email = ? AND status IN ('pending','open')`,
                [CANCEL_NOTE, id, email]
            );
            if (!r.affectedRows) {
                return res.status(409).json({ error: 'ยกเลิกไม่ได้ คำขอนี้อาจมีผู้รับเรื่องแล้วหรือถูกปิดไปแล้ว' });
            }
            return res.status(200).json({ ok: true });
        }

        res.setHeader('Allow', ['GET', 'PATCH']);
        return res.status(405).json({ error: 'Method not allowed' });
    } catch (e) {
        console.error('[my-help-requests]', e);
        return res.status(500).json({
            error: 'เกิดข้อผิดพลาดของระบบ',
            ...(process.env.NODE_ENV !== 'production' && { detail: e.message, code: e.code }),
        });
    }
}