import { query } from '../../lib/db';
import { sendContactAckEmail } from '../../lib/contactMail';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { name, email, subject, message } = req.body || {};

    if (!email || !subject?.trim() || !message?.trim()) {
        return res.status(400).json({ error: 'กรุณากรอกอีเมล หัวข้อ และรายละเอียดให้ครบ' });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        return res.status(400).json({ error: 'รูปแบบอีเมลไม่ถูกต้อง' });
    }

    try {
        // MySQL ใช้ ? แทน $1,$2,... และไม่มี RETURNING *
        const [result] = await query(
            `INSERT INTO contact_messages (name, email, subject, message)
             VALUES (?, ?, ?, ?)`,
            [name?.trim() || null, email.trim(), subject.trim(), message.trim()]
        );

        const savedId = result.insertId; // MySQL คืน insertId มาให้แทน RETURNING

        // ส่งอีเมลยืนยันแบบ fire-and-forget ไม่บล็อก response ถ้าส่งพลาดก็แค่ log ไว้
        sendContactAckEmail({ to: email.trim(), subject: subject.trim(), name: name?.trim() }).catch((e) =>
            console.error('[contact] ack mail failed:', e)
        );

        return res.status(201).json({ ok: true, id: savedId });
    } catch (e) {
        console.error('[contact] insert failed:', e);
        return res.status(500).json({ error: 'ส่งข้อความไม่สำเร็จ ลองใหม่อีกครั้ง' });
    }
}