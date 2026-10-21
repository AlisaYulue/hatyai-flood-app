// pages/api/parking.js
// สำหรับดึงข้อมูลจุดฝากรถไปแสดงบนแผนที่ (GET)
import db from '../../lib/db';

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const [groups] = await db.query('SELECT * FROM parking_groups ORDER BY sort_order');
        const [spots] = await db.query('SELECT * FROM parking_spots WHERE is_active = 1 ORDER BY group_id, sort_order');

        res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
        res.status(200).json({
            groups: groups,
            spots: spots,
        });
    } catch (error) {
        console.error('Database Error:', error);
        res.status(500).json({ error: 'Failed to fetch parking data from database' });
    }
}