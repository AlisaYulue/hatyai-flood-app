import db from '../../../lib/db';

function checkAuth(req) {
    return req.headers['x-admin-key'] && req.headers['x-admin-key'] === process.env.ADMIN_KEY;
}

export default async function handler(req, res) {
    if (!checkAuth(req)) return res.status(401).json({ error: 'unauthorized' });

    if (req.method === 'PUT') {
        const { id, current_occupancy, capacity } = req.body || {};

        if (!id || current_occupancy === undefined || capacity === undefined) {
            return res.status(400).json({ error: 'ข้อมูลไม่ครบ (ต้องมี id, current_occupancy, และ capacity)' });
        }

        try {
            await db.query(
                'UPDATE evacuation_centers SET current_occupancy = ?, capacity = ? WHERE id = ?',
                [Number(current_occupancy), Number(capacity), id]
            );
            return res.status(200).json({ message: 'อัปเดตข้อมูลศูนย์อพยพสำเร็จ' });
        } catch (error) {
            console.error('[admin/evac] update failed:', error);
            return res.status(500).json({ error: 'อัปเดตข้อมูลไม่สำเร็จ' });
        }
    }

    res.setHeader('Allow', ['PUT']);
    return res.status(405).end();
}