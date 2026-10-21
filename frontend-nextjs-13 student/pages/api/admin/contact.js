import db from '../../../lib/db';
import { sendContactReplyEmail } from '../../../lib/contactMail';

// การป้องกันแบบง่ายด้วย shared key — ใช้ pattern เดียวกับ pages/api/admin/reports.js
// (ไม่ต้องพึ่ง lib/Admin.js อีกต่อไป)
function checkAuth(req) {
    return req.headers['x-admin-key'] && req.headers['x-admin-key'] === process.env.ADMIN_KEY;
}

export default async function handler(req, res) {
    if (!checkAuth(req)) {
        return res.status(401).json({ error: 'unauthorized' });
    }

    if (req.method === 'GET') {
        const status = req.query.status || 'all';
        try {
            const [rows] =
                status === 'all'
                    ? await db.query('SELECT * FROM contact_messages ORDER BY created_at DESC')
                    : await db.query(
                        'SELECT * FROM contact_messages WHERE status = ? ORDER BY created_at DESC',
                        [status]
                    );
            return res.status(200).json({ messages: rows });
        } catch (e) {
            console.error('[admin/contact] list failed:', e);
            return res.status(500).json({ error: 'โหลดข้อมูลไม่สำเร็จ' });
        }
    }

    if (req.method === 'PATCH') {
        const { id, admin_reply } = req.body || {};
        if (!id || !admin_reply?.trim()) {
            return res.status(400).json({ error: 'กรุณากรอกคำตอบก่อนส่ง' });
        }
        try {
            await db.query(
                `UPDATE contact_messages
                 SET admin_reply = ?, status = 'replied', replied_at = NOW()
                 WHERE id = ?`,
                [admin_reply.trim(), id]
            );

            // MySQL ไม่มี RETURNING ต้อง SELECT กลับมาเอง
            const [rows] = await db.query('SELECT * FROM contact_messages WHERE id = ?', [id]);
            const updated = rows[0];
            if (!updated) return res.status(404).json({ error: 'ไม่พบข้อความนี้' });

            try {
                await sendContactReplyEmail({
                    to: updated.email,
                    subject: updated.subject,
                    reply: admin_reply.trim(),
                    name: updated.name,
                });
            } catch (mailErr) {
                console.error('[admin/contact] reply mail failed:', mailErr);
                // ไม่ throw ต่อ เพราะข้อมูลบันทึกสำเร็จแล้ว แค่เมลอาจส่งไม่ออก
            }

            return res.status(200).json({ ok: true, message: updated });
        } catch (e) {
            console.error('[admin/contact] update failed:', e);
            return res.status(500).json({ error: 'ตอบกลับไม่สำเร็จ ลองใหม่อีกครั้ง' });
        }
    }

    res.setHeader('Allow', ['GET', 'PATCH']);
    return res.status(405).json({ error: 'Method not allowed' });
}