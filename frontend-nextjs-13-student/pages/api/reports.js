// pages/api/reports.js
// ผู้ใช้ทั่วไปส่งรายงานจุดน้ำท่วมเข้ามา — บันทึกเป็น status = 'pending' เสมอ
// รอให้แอดมินกดยืนยันที่ /admin ก่อน จุดถึงจะโผล่บนแผนที่ (ดู pages/api/map-data.js)
//
// หมายเหตุ: ให้มีไฟล์นี้ไฟล์เดียวเท่านั้น ถ้ามี pages/api/admin/reports ที่เป็น POST
// ซ้ำอยู่ ให้ลบทิ้ง เพราะแอดมินไม่ได้เป็นคนส่งรายงาน
import db from '../../lib/db';

function riskFromDepth(m) {
    // enum จริงใน DB คือ 'Danger' | 'Warning' | 'Critical'
    if (m >= 2) return 'Critical';
    if (m >= 0.5) return 'Warning';
    return 'Danger';
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end();
    }

    const { latitude, longitude, water_level_meters, location_name } = req.body || {};

    if (latitude == null || longitude == null || water_level_meters == null || !location_name) {
        return res.status(400).json({ error: 'ข้อมูลไม่ครบ' });
    }

    const depth = Number(water_level_meters);
    const lat = Number(latitude);
    const lng = Number(longitude);

    if (!Number.isFinite(depth) || depth < 0 || !Number.isFinite(lat) || !Number.isFinite(lng)) {
        return res.status(400).json({ error: 'ค่าพิกัดหรือความลึกไม่ถูกต้อง' });
    }

    try {
        const [result] = await db.query(
            `INSERT INTO flood_reports
                (location_name, latitude, longitude, water_level_meters, risk_level, status, reported_at)
             VALUES (?, ?, ?, ?, ?, 'pending', NOW())`,
            [String(location_name).trim(), lat, lng, depth, riskFromDepth(depth)]
        );
        return res.status(201).json({ message: 'ส่งรายงานสำเร็จ รอแอดมินตรวจสอบ', id: result.insertId });
    } catch (error) {
        console.error('[reports] insert failed:', error);
        return res.status(500).json({ error: 'บันทึกรายงานไม่สำเร็จ' });
    }
}