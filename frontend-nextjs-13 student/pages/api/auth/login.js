import db from '../../../lib/db';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'กรุณาระบุอีเมลและรหัสผ่าน' });
        }

        try {
            // 1. ค้นหาผู้ใช้จากอีเมล
            const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

            // ถ้าไม่พบผู้ใช้
            if (rows.length === 0) {
                return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
            }

            const user = rows[0];

            // ถ้าระบบมีอีเมล แต่ผู้ใช้ยังไม่ได้ตั้งรหัสผ่าน
            if (!user.password) {
                return res.status(401).json({ error: 'บัญชีนี้ยังไม่ได้ตั้งรหัสผ่าน กรุณาเข้าสู่ระบบด้วย OTP' });
            }

            // 2. เทียบรหัสผ่านที่พิมพ์เข้ามา กับ Hash ใน Database
            const isMatch = await bcrypt.compare(password, user.password);

            if (!isMatch) {
                return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
            }

            // ถ้ารหัสผ่านตรงกัน ให้เข้าสู่ระบบสำเร็จ
            return res.status(200).json({ message: 'เข้าสู่ระบบสำเร็จ' });

        } catch (error) {
            console.error('[Login] Database error:', error);
            return res.status(500).json({ error: 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}