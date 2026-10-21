// pages/api/admin/reports.js
// จัดการรายงานน้ำท่วมจากผู้ใช้ (ดู / อนุมัติ / ปฏิเสธ / ย้ายกลับไปรอตรวจสอบ)
//
// สิ่งที่แก้จากเวอร์ชันเดิม
//  1) รับ ?status=pending|approved|rejected|all  (เดิมฮาร์ดโค้ด pending อย่างเดียว
//     ทำให้แท็บ "ยืนยันแล้ว"/"ปฏิเสธ" ในหน้า admin ว่างตลอด)
//  2) เรียงด้วย reported_at (เดิมใช้ created_at ซึ่งไม่มีในตาราง flood_reports → error 500)
//  3) รองรับ action 'reset' ที่หน้า admin ส่งมา (ย้ายกลับเป็น pending)
import db from '../../../lib/db';

const ALLOWED_STATUS = ['pending', 'approved', 'rejected'];

function checkAuth(req) {
    return req.headers['x-admin-key'] && req.headers['x-admin-key'] === process.env.ADMIN_KEY;
}

export default async function handler(req, res) {
    if (!checkAuth(req)) return res.status(401).json({ error: 'unauthorized' });

    if (req.method === 'GET') {
        const status = String(req.query.status || 'pending');

        if (status !== 'all' && !ALLOWED_STATUS.includes(status)) {
            return res.status(400).json({ error: 'status ไม่ถูกต้อง' });
        }

        try {
            const baseSelect = `
                SELECT id, location_name, latitude, longitude, water_level_meters,
                       risk_level, status, reported_at
                FROM flood_reports`;

            const [reports] =
                status === 'all'
                    ? await db.query(`${baseSelect} ORDER BY reported_at DESC`)
                    : await db.query(`${baseSelect} WHERE status = ? ORDER BY reported_at DESC`, [status]);

            return res.status(200).json({ reports });
        } catch (error) {
            console.error('[admin/reports] load failed:', error);
            return res.status(500).json({ error: 'โหลดรายงานไม่สำเร็จ' });
        }
    }

    if (req.method === 'PATCH') {
        const { id, action } = req.body || {};
        const STATUS_BY_ACTION = {
            approve: 'approved',
            reject: 'rejected',
            reset: 'pending',
        };

        if (!id || !STATUS_BY_ACTION[action]) {
            return res.status(400).json({ error: 'ข้อมูลไม่ถูกต้อง (ต้องมี id และ action)' });
        }

        try {
            const [result] = await db.query('UPDATE flood_reports SET status = ? WHERE id = ?', [
                STATUS_BY_ACTION[action],
                id,
            ]);
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'ไม่พบรายงานนี้' });
            }
            return res.status(200).json({ message: 'อัปเดตแล้ว', status: STATUS_BY_ACTION[action] });
        } catch (error) {
            console.error('[admin/reports] update failed:', error);
            return res.status(500).json({ error: 'อัปเดตไม่สำเร็จ' });
        }
    }

    if (req.method === 'DELETE') {
        const { id } = req.body || {};
        if (!id) return res.status(400).json({ error: 'ไม่พบ id ของรายงาน' });
        try {
            await db.query('DELETE FROM flood_reports WHERE id = ?', [id]);
            return res.status(200).json({ message: 'ลบรายงานแล้ว' });
        } catch (error) {
            console.error('[admin/reports] delete failed:', error);
            return res.status(500).json({ error: 'ลบรายงานไม่สำเร็จ' });
        }
    }

    res.setHeader('Allow', ['GET', 'PATCH', 'DELETE']);
    return res.status(405).end();
}