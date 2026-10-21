import db from '../../lib/db';
import { clusterReports } from '../../lib/clusterReports';

// รัศมีรวมหมุด (เมตร) ควรเท่ากับ RADIUS_M ใน /api/flood-reports
const CLUSTER_RADIUS_M = 150;

export default async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            // ดึงข้อมูลแจ้งเหตุ (เฉพาะที่อนุมัติแล้ว) และข้อมูลศูนย์พักพิงที่ยังเปิดอยู่
            const [approvedReports] = await db.query(
                "SELECT * FROM flood_reports WHERE status = 'approved'"
            );
            const [evacuationCenters] = await db.query(
                'SELECT * FROM evacuation_centers WHERE is_active = 1'
            );

            // รวมรายงานที่อยู่ใกล้กันให้เหลือหมุดเดียว
            const floodPoints = clusterReports(approvedReports, CLUSTER_RADIUS_M);

            return res.status(200).json({ floodPoints, evacuationCenters });
        } catch (error) {
            console.error('[map-data] fetch error:', error);
            return res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลแผนที่ได้' });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}