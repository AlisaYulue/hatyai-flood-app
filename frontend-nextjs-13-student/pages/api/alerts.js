// pages/api/alerts.js
// ใช้จากหน้า index.jsx — คืนเฉพาะประกาศที่ยัง active และยังไม่พ้นวันแจ้งเตือน
import db from '../../lib/db';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end();
    }

    try {
        const [rows] = await db.query(
            `SELECT id, risk_level, title, message, alert_date,
                    risk_today, risk_tomorrow, risk_day_after
             FROM flood_alerts
             WHERE is_active = 1 AND alert_date >= CURDATE()
             ORDER BY alert_date ASC`
        );
        return res.status(200).json(rows);
    } catch (error) {
        console.error('[alerts] fetch failed:', error);
        return res.status(500).json({ error: 'ดึงข้อมูลประกาศไม่สำเร็จ' });
    }
}