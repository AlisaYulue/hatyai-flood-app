import db from '../../../lib/db';

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'กรุณาระบุอีเมล' });

        try {
            // ค้นหาอีเมลในฐานข้อมูล
            const [rows] = await db.query('SELECT password FROM users WHERE email = ?', [email]);

            // ถ้าไม่พบอีเมลในระบบเลย แปลว่าเป็นผู้ใช้ใหม่
            if (rows.length === 0) {
                return res.status(200).json({ hasPassword: false });
            }

            // ถ้ามีอีเมลแล้ว เช็คว่าคอลัมน์ password มีข้อมูลหรือไม่
            const user = rows[0];
            const hasPassword = user.password !== null && user.password.trim() !== '';

            return res.status(200).json({ hasPassword });
        } catch (error) {
            console.error('[Check User] Database error:', error);
            return res.status(500).json({ error: 'ไม่สามารถตรวจสอบข้อมูลผู้ใช้ได้' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}