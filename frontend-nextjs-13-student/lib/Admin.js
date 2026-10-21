import db from './db';

// การป้องกันแบบง่ายด้วย shared key เพียงพอสำหรับใช้ทดสอบ/โปรเจกต์นักศึกษา
// ก่อนขึ้น production จริงควรเปลี่ยนไปใช้ระบบล็อกอินแอดมินจริง (เช่น NextAuth + role)
function checkAuth(req) {
    return req.headers['x-admin-key'] && req.headers['x-admin-key'] === process.env.ADMIN_KEY;
}

export default async function handler(req, res) {
    if (!checkAuth(req)) return res.status(401).json({ error: 'unauthorized' });

    if (req.method === 'GET') {
        try {
            const [reports] = await db.query(
                "SELECT * FROM flood_reports WHERE status = 'pending' ORDER BY created_at DESC"
            );
            return res.status(200).json({ reports });
        } catch (error) {
            console.error('[admin/reports] load failed:', error);
            return res.status(500).json({ error: 'โหลดรายงานไม่สำเร็จ' });
        }
    }

    if (req.method === 'PATCH') {
        const { id, action } = req.body;
        if (!id || !['approve', 'reject'].includes(action)) {
            return res.status(400).json({ error: 'ข้อมูลไม่ถูกต้อง' });
        }
        const status = action === 'approve' ? 'approved' : 'rejected';
        try {
            await db.query('UPDATE flood_reports SET status = ? WHERE id = ?', [status, id]);
            return res.status(200).json({ message: 'อัปเดตแล้ว' });
        } catch (error) {
            console.error('[admin/reports] update failed:', error);
            return res.status(500).json({ error: 'อัปเดตไม่สำเร็จ' });
        }
    }

    res.setHeader('Allow', ['GET', 'PATCH']);
    return res.status(405).end();
}