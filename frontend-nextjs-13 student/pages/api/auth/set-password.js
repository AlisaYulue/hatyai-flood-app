import db from '../../../lib/db';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { email, password } = req.body;

        if (!email || !password || password.length < 6) {
            return res.status(400).json({ error: 'ข้อมูลไม่ครบถ้วน หรือรหัสผ่านสั้นเกินไป' });
        }

        try {
            // 1. เข้ารหัสผ่านด้วย bcrypt
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // 2. บันทึกรหัสผ่านที่เข้ารหัสแล้วลง Database
            await db.query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email]);

            return res.status(200).json({ message: 'ตั้งรหัสผ่านสำเร็จ' });
        } catch (error) {
            console.error('[Set Password] Database error:', error);
            return res.status(500).json({ error: 'ไม่สามารถบันทึกรหัสผ่านได้' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}