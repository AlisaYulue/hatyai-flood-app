import db from '../../lib/db';
import { buildGraph, dijkstra, applyFloodPenalty } from '../../lib/dijkstra';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end();
    }

    const { startNodeId, endNodeId } = req.body;
    if (!startNodeId || !endNodeId) {
        return res.status(400).json({ error: 'ต้องระบุ startNodeId และ endNodeId' });
    }

    try {
        const [edges] = await db.query('SELECT * FROM road_edges');

        if (!edges.length) {
            return res.status(503).json({
                error:
                    'ยังไม่มีข้อมูลกราฟถนน (road_edges) ในฐานข้อมูล — ต้อง import ถนนจริงจาก OSM/GISTDA ก่อนใช้ฟีเจอร์นี้ ดู sql/schema-additions.sql',
            });
        }

        const [floodPoints] = await db.query(
            "SELECT latitude, longitude, water_level_meters FROM flood_reports WHERE status = 'approved' AND water_level_meters >= 0.3"
        );

        const weightedEdges = applyFloodPenalty(edges, floodPoints);
        const graph = buildGraph(weightedEdges);
        const result = dijkstra(graph, startNodeId, endNodeId);

        if (!result) return res.status(404).json({ error: 'ไม่พบเส้นทางไปยังจุดหมาย' });

        const [nodes] = await db.query(
            `SELECT id, latitude, longitude FROM road_nodes WHERE id IN (${result.path.map(() => '?').join(',')})`,
            result.path
        );
        const nodeMap = new Map(nodes.map((n) => [n.id, n]));
        const coordinates = result.path.map((id) => nodeMap.get(id)).filter(Boolean);

        return res.status(200).json({ distance: result.distance, coordinates });
    } catch (error) {
        console.error('[route] error:', error);
        return res.status(500).json({ error: 'คำนวณเส้นทางไม่สำเร็จ' });
    }
}