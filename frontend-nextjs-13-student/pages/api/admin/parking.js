// pages/api/admin/parking.js
import db from '../../../lib/db'; // ปรับ path ให้ตรงกับโครงสร้างของคุณ

function checkAuth(req) {
    return req.headers['x-admin-key'] && req.headers['x-admin-key'] === process.env.ADMIN_KEY;
}

export default async function handler(req, res) {
    // เช็คสิทธิ์ Admin
    if (!checkAuth(req)) return res.status(401).json({ error: 'unauthorized' });

    // รับคำสั่ง PUT สำหรับอัปเดตข้อมูล
    if (req.method === 'PUT') {
        // เพิ่ม capacity เข้ามารับค่าด้วย
        const { id, current_occupancy, capacity } = req.body || {};

        // เช็คว่าส่งข้อมูลมาครบทั้ง 3 ตัวหรือไม่
        if (!id || current_occupancy === undefined || capacity === undefined) {
            return res.status(400).json({ error: 'ข้อมูลไม่ครบ (ต้องมี id, current_occupancy, และ capacity)' });
        }

        try {
            // อัปเดตลงฐานข้อมูลทั้ง current_occupancy และ capacity
            await db.query(
                'UPDATE parking_spots SET current_occupancy = ?, capacity = ? WHERE id = ?',
                [Number(current_occupancy), Number(capacity), id]
            );
            return res.status(200).json({ message: 'อัปเดตข้อมูลจุดฝากรถสำเร็จ' });
        } catch (error) {
            console.error('[admin/parking] update failed:', error);
            return res.status(500).json({ error: 'อัปเดตข้อมูลไม่สำเร็จ' });
        }
    }

    res.setHeader('Allow', ['PUT']);
    return res.status(405).end();
}