import db from '../../../lib/db';

const STATUSES = ['pending', 'open', 'in_progress', 'resolved', 'rejected'];

export default async function handler(req, res) {
    // ใช้ x-admin-key แบบเดียวกับ API แอดมินอื่น — ปรับชื่อ env ให้ตรงของจริง
    if (!process.env.ADMIN_KEY || req.headers['x-admin-key'] !== process.env.ADMIN_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
        if (req.method === 'GET') {
            const status = req.query.status;
            const where = STATUSES.includes(status) ? 'WHERE status = ?' : '';
            const [rows] = await db.query(
                `SELECT * FROM help_requests ${where}
                  ORDER BY FIELD(urgency,'critical','urgent','normal'), created_at DESC`,
                where ? [status] : []
            );
            return res.status(200).json({ requests: rows });
        }
        if (req.method === 'PATCH') {
            const { id, status, admin_note } = req.body || {};
            if (!id || !STATUSES.includes(status)) return res.status(400).json({ error: 'ข้อมูลไม่ถูกต้อง' });
            await db.query('UPDATE help_requests SET status = ?, admin_note = COALESCE(?, admin_note) WHERE id = ?',
                [status, admin_note ?? null, id]);
            return res.status(200).json({ ok: true });
        }
        res.status(405).json({ error: 'Method not allowed' });
    } catch (e) {
        console.error('[admin/help-requests]', e);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดของระบบ' });
    }
}
