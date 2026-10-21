// POST /api/flood-reports  — ผู้ใช้ส่งรายงานจุดน้ำท่วม
// กติกา: มีรายงาน >= AUTO_APPROVE_COUNT ในรัศมี RADIUS_M เมตร ภายใน WINDOW_HOURS ชม. -> อนุมัติอัตโนมัติ
// ไม่ถึง -> status = 'pending' รอ admin ตรวจที่หน้า /admin (แท็บ "รายงานผู้ใช้")

// TODO: ปรับ path/ชื่อให้ตรงกับโปรเจกต์ (ต้องเป็น mysql2/promise pool)
import db from '../../lib/db';

const TABLE = 'flood_reports';
const RADIUS_M = 150;
const WINDOW_HOURS = 24;
const AUTO_APPROVE_COUNT = 5;

// false = นับจำนวนครั้งที่รายงาน (ทดสอบง่าย, คนเดียวกดครบ 5 ครั้งก็อนุมัติ)
// true  = นับเฉพาะผู้รายงานที่ไม่ซ้ำคน และกันคนเดิมรายงานซ้ำจุดเดียวกัน
const REQUIRE_DISTINCT_USERS = false;
const COUNT_EXPR = REQUIRE_DISTINCT_USERS ? 'COUNT(DISTINCT reporter_email)' : 'COUNT(*)';

const riskFromDepth = (m) => (m >= 1.0 ? 'Critical' : m >= 0.5 ? 'Danger' : 'Warning');

// เงื่อนไขระยะทาง (Haversine) หน่วยเมตร
const DIST_SQL = `6371000 * ACOS(LEAST(1, COS(RADIANS(?)) * COS(RADIANS(latitude)) * COS(RADIANS(longitude) - RADIANS(?)) + SIN(RADIANS(?)) * SIN(RADIANS(latitude))))`;

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { location_name, latitude, longitude, water_level_meters, reporter_email } = req.body || {};
    const lat = Number(latitude);
    const lng = Number(longitude);
    const depth = Number(water_level_meters);
    const email = String(reporter_email || '').trim().toLowerCase();
    const name = String(location_name || '').trim().slice(0, 255);

    if (!email) return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบก่อนรายงาน' });
    if (!name) return res.status(400).json({ error: 'กรุณาระบุชื่อสถานที่' });
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
        return res.status(400).json({ error: 'พิกัดไม่ถูกต้อง' });
    }
    if (!Number.isFinite(depth) || depth < 0 || depth > 10) {
        return res.status(400).json({ error: 'ระดับน้ำไม่ถูกต้อง' });
    }

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // 1) กันคนเดิมรายงานซ้ำในจุดเดียวกัน (ทำเฉพาะเมื่อเปิดโหมดนับคนไม่ซ้ำ)
        if (REQUIRE_DISTINCT_USERS) {
            const [dup] = await conn.query(
                `SELECT id FROM ${TABLE}
                 WHERE reporter_email = ? AND status <> 'rejected'
                   AND reported_at >= NOW() - INTERVAL ? HOUR
                   AND ${DIST_SQL} <= ?
                 LIMIT 1`,
                [email, WINDOW_HOURS, lat, lng, lat, RADIUS_M]
            );
            if (dup.length > 0) {
                await conn.rollback();
                return res.status(409).json({ error: 'คุณเคยรายงานบริเวณนี้ไปแล้วในช่วง 24 ชั่วโมงที่ผ่านมา' });
            }
        }

        // 2) บันทึกรายงานเป็น pending
        const [ins] = await conn.query(
            `INSERT INTO ${TABLE} (location_name, latitude, longitude, water_level_meters, risk_level, status, reporter_email)
             VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
            [name, lat, lng, depth, riskFromDepth(depth), email]
        );

        // 3) นับรายงานในรัศมี (ไม่นับที่ admin ปฏิเสธไปแล้ว)
        const [[{ cnt }]] = await conn.query(
            `SELECT ${COUNT_EXPR} AS cnt FROM ${TABLE}
             WHERE status <> 'rejected'
               AND reported_at >= NOW() - INTERVAL ? HOUR
               AND ${DIST_SQL} <= ?`,
            [WINDOW_HOURS, lat, lng, lat, RADIUS_M]
        );

        // 4) ครบ 5 -> อนุมัติรายงานที่ pending ทั้งกลุ่มอัตโนมัติ
        let autoApproved = false;
        if (cnt >= AUTO_APPROVE_COUNT) {
            await conn.query(
                `UPDATE ${TABLE} SET status = 'approved', auto_approved = 1
                 WHERE status = 'pending'
                   AND reported_at >= NOW() - INTERVAL ? HOUR
                   AND ${DIST_SQL} <= ?`,
                [WINDOW_HOURS, lat, lng, lat, RADIUS_M]
            );
            autoApproved = true;
        }

        await conn.commit();
        return res.status(201).json({
            id: ins.insertId,
            count: Math.min(cnt, AUTO_APPROVE_COUNT),
            required: AUTO_APPROVE_COUNT,
            autoApproved,
        });
    } catch (e) {
        await conn.rollback();
        console.error(e);
        return res.status(500).json({ error: 'บันทึกรายงานไม่สำเร็จ' });
    } finally {
        conn.release();
    }
}