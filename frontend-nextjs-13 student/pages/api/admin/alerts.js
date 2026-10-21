// pages/api/admin/alerts.js
// จัดการประกาศแจ้งเตือน (ดูทั้งหมด / สร้าง / เปิด-ปิด / ลบ)
import db from '../../../lib/db';

const ALLOWED_LEVELS = ['Warning', 'Critical'];

function checkAuth(req) {
    return req.headers['x-admin-key'] && req.headers['x-admin-key'] === process.env.ADMIN_KEY;
}

export default async function handler(req, res) {
    if (!checkAuth(req)) return res.status(401).json({ error: 'unauthorized' });

    if (req.method === 'GET') {
        // ทั้งหมด รวมที่ปิดไปแล้ว — สำหรับหน้า admin เท่านั้น
        try {
            // [จุดแก้ที่ 1]: เพิ่ม risk_today, risk_tomorrow, risk_day_after ในคำสั่ง SELECT
            const [rows] = await db.query(
                `SELECT id, risk_level, title, message, alert_date, 
                        risk_today, risk_tomorrow, risk_day_after,
                        is_active, created_at
                 FROM flood_alerts
                 ORDER BY created_at DESC`
            );
            return res.status(200).json(rows);
        } catch (error) {
            console.error('[admin/alerts] fetch failed:', error);
            return res.status(500).json({ error: 'ดึงข้อมูลประกาศไม่สำเร็จ' });
        }
    }

    if (req.method === 'POST') {
        // [จุดแก้ที่ 2]: รับค่า risk_today, risk_tomorrow, risk_day_after เพิ่มเติมจาก req.body
        const {
            risk_level,
            title,
            message,
            alert_date,
            risk_today = 'เสี่ยงต่ำ',
            risk_tomorrow = 'เสี่ยงสูง',
            risk_day_after = 'เสี่ยงสูง'
        } = req.body || {};

        if (!ALLOWED_LEVELS.includes(risk_level) || !title || !alert_date) {
            return res.status(400).json({ error: 'ข้อมูลไม่ครบ (ต้องมีระดับความเสี่ยง, หัวข้อ, วันที่)' });
        }

        try {
            // [จุดแก้ที่ 3]: เพิ่มคอลัมน์และค่า parameter ในคำสั่ง INSERT INTO
            const [result] = await db.query(
                `INSERT INTO flood_alerts (
                    risk_level, 
                    title, 
                    message, 
                    alert_date, 
                    risk_today, 
                    risk_tomorrow, 
                    risk_day_after, 
                    is_active, 
                    created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW())`,
                [
                    risk_level,
                    title.trim(),
                    message?.trim() || null,
                    alert_date,
                    risk_today,
                    risk_tomorrow,
                    risk_day_after
                ]
            );
            return res.status(201).json({ message: 'สร้างประกาศสำเร็จ', id: result.insertId });
        } catch (error) {
            console.error('[admin/alerts] insert failed:', error);
            return res.status(500).json({ error: 'สร้างประกาศไม่สำเร็จ' });
        }
    }

    if (req.method === 'PATCH') {
        const { id, is_active } = req.body || {};
        if (!id) return res.status(400).json({ error: 'ไม่พบ id ของประกาศ' });

        try {
            await db.query('UPDATE flood_alerts SET is_active = ? WHERE id = ?', [is_active ? 1 : 0, id]);
            return res.status(200).json({ message: 'อัปเดตประกาศสำเร็จ' });
        } catch (error) {
            console.error('[admin/alerts] update failed:', error);
            return res.status(500).json({ error: 'อัปเดตประกาศไม่สำเร็จ' });
        }
    }

    if (req.method === 'DELETE') {
        const { id } = req.body || {};
        if (!id) return res.status(400).json({ error: 'ไม่พบ id ของประกาศ' });

        try {
            await db.query('DELETE FROM flood_alerts WHERE id = ?', [id]);
            return res.status(200).json({ message: 'ลบประกาศสำเร็จ' });
        } catch (error) {
            console.error('[admin/alerts] delete failed:', error);
            return res.status(500).json({ error: 'ลบประกาศไม่สำเร็จ' });
        }
    }

    res.setHeader('Allow', ['GET', 'POST', 'PATCH', 'DELETE']);
    return res.status(405).end();
}