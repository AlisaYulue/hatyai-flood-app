// pages/api/guide.js
// อ่านคู่มืออย่างเดียว (public) — ให้หน้าแผนที่หลักดึงไปแสดง
// เขียนใหม่เป็น MySQL (mysql2) และแก้ path import ให้ตรงชั้นโฟลเดอร์จริง
import db from '../../lib/db';
import { GUIDE_TOPICS as FALLBACK_TOPICS } from '../../lib/guide-topics';

function parseSections(value) {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }
    return [];
}

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const [rows] = await db.query(
            `SELECT id, icon, color, title, subtitle, sections
             FROM flood_guide_topics
             ORDER BY sort_order ASC, title ASC`
        );

        if (!rows || rows.length === 0) {
            return res.status(200).json({ topics: FALLBACK_TOPICS, source: 'fallback' });
        }

        const topics = rows.map((r) => ({ ...r, sections: parseSections(r.sections) }));
        return res.status(200).json({ topics, source: 'db' });
    } catch (error) {
        // ถ้าต่อ DB ไม่ได้ ให้หน้าเว็บยังใช้งานได้ด้วยข้อมูลสำรอง แทนที่จะพัง
        console.error('[guide] fetch failed:', error);
        return res.status(200).json({ topics: FALLBACK_TOPICS, source: 'fallback' });
    }
}