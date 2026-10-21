import db from '../../lib/db';

export default async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            // เดิม SELECT * ทั้งหมด ทำให้จุดที่ยัง pending/rejected โผล่บนแผนที่จริงด้วย
            // ตอนนี้กรองให้เห็นแต่ที่แอดมินอนุมัติแล้ว
            const [floodPoints] = await db.query(
                "SELECT * FROM flood_reports WHERE status = 'approved'"
            );
            const [evacuationCenters] = await db.query(
                'SELECT * FROM evacuation_centers WHERE is_active = 1'
            );

            return res.status(200).json({ floodPoints, evacuationCenters });
        } catch (error) {
            console.error('[map-data] error:', error);
            return res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลแผนที่ได้' });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
