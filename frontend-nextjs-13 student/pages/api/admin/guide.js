// pages/api/admin/guide.js
// จัดการ (CRUD) หมวดคู่มือ — เขียนใหม่ทั้งไฟล์ให้เป็น MySQL (mysql2)
//
// เวอร์ชันเดิมใช้ syntax ของ Postgres/Vercel (sql`` + ::jsonb) ซึ่งโปรเจกต์นี้ไม่มี
// จึงพังทั้งไฟล์ = หน้า "คู่มือ" ในหน้า admin ใช้จริงไม่ได้
// ตอนนี้ใช้ db.query แบบเดียวกับ reports/alerts และเก็บ sections เป็นคอลัมน์ JSON
import db from '../../../lib/db';

function checkAuth(req) {
    return req.headers['x-admin-key'] && req.headers['x-admin-key'] === process.env.ADMIN_KEY;
}

// mysql2 คืนคอลัมน์ JSON มาเป็น object อยู่แล้วในเวอร์ชันใหม่
// แต่บาง config คืนเป็น string — parse เผื่อไว้ทั้งสองแบบ
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

// ตรวจรูปแบบ sections ที่หน้า admin ส่งมา: [{ heading, items: [] }]
function normalizeSections(sections) {
    if (!Array.isArray(sections)) return null;
    const cleaned = sections
        .map((s) => ({
            heading: String(s?.heading || '').trim(),
            items: Array.isArray(s?.items)
                ? s.items.map((t) => String(t).trim()).filter(Boolean)
                : [],
        }))
        .filter((s) => s.heading && s.items.length > 0);
    return cleaned.length > 0 ? cleaned : null;
}

export default async function handler(req, res) {
    if (!checkAuth(req)) return res.status(401).json({ error: 'unauthorized' });

    if (req.method === 'GET') {
        try {
            const [rows] = await db.query(
                `SELECT id, icon, color, title, subtitle, sort_order, sections, updated_at
                 FROM flood_guide_topics
                 ORDER BY sort_order ASC, title ASC`
            );
            const topics = rows.map((r) => ({ ...r, sections: parseSections(r.sections) }));
            return res.status(200).json({ topics });
        } catch (error) {
            console.error('[admin/guide] load failed:', error);
            return res.status(500).json({ error: 'โหลดคู่มือไม่สำเร็จ' });
        }
    }

    if (req.method === 'POST') {
        const { id, icon, color, title, subtitle, sort_order, sections } = req.body || {};

        if (!id || !title) return res.status(400).json({ error: 'ต้องระบุ id และชื่อหมวด' });
        if (!/^[a-z0-9-]+$/.test(id)) {
            return res.status(400).json({ error: 'id ใช้ได้เฉพาะ a-z, 0-9 และขีดกลาง' });
        }

        const cleanSections = normalizeSections(sections);
        if (!cleanSections) return res.status(400).json({ error: 'ต้องมีอย่างน้อย 1 หัวข้อย่อยพร้อมรายการ' });

        try {
            await db.query(
                `INSERT INTO flood_guide_topics (id, icon, color, title, subtitle, sort_order, sections)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    id,
                    icon || 'Package',
                    color || '#2FBF83',
                    title.trim(),
                    (subtitle || '').trim(),
                    Number.isFinite(Number(sort_order)) ? Number(sort_order) : 0,
                    JSON.stringify(cleanSections),
                ]
            );
            return res.status(201).json({ ok: true });
        } catch (error) {
            console.error('[admin/guide] insert failed:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: `รหัสหมวด "${id}" นี้มีอยู่แล้ว` });
            }
            return res.status(500).json({ error: 'สร้างหมวดคู่มือไม่สำเร็จ' });
        }
    }

    if (req.method === 'PATCH') {
        const { id, icon, color, title, subtitle, sort_order, sections } = req.body || {};
        if (!id) return res.status(400).json({ error: 'ต้องระบุ id' });

        // อัปเดตเฉพาะฟิลด์ที่ส่งมา
        const fields = [];
        const values = [];
        const push = (sqlPart, value) => {
            fields.push(sqlPart);
            values.push(value);
        };

        if (icon !== undefined) push('icon = ?', icon);
        if (color !== undefined) push('color = ?', color);
        if (title !== undefined) push('title = ?', String(title).trim());
        if (subtitle !== undefined) push('subtitle = ?', String(subtitle).trim());
        if (sort_order !== undefined && Number.isFinite(Number(sort_order))) {
            push('sort_order = ?', Number(sort_order));
        }
        if (sections !== undefined) {
            const cleanSections = normalizeSections(sections);
            if (!cleanSections) return res.status(400).json({ error: 'ต้องมีอย่างน้อย 1 หัวข้อย่อยพร้อมรายการ' });
            push('sections = ?', JSON.stringify(cleanSections));
        }

        if (fields.length === 0) return res.status(400).json({ error: 'ไม่มีข้อมูลที่จะอัปเดต' });

        try {
            const [result] = await db.query(
                `UPDATE flood_guide_topics SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`,
                [...values, id]
            );
            if (result.affectedRows === 0) return res.status(404).json({ error: 'ไม่พบหมวดนี้' });
            return res.status(200).json({ ok: true });
        } catch (error) {
            console.error('[admin/guide] update failed:', error);
            return res.status(500).json({ error: 'อัปเดตหมวดคู่มือไม่สำเร็จ' });
        }
    }

    if (req.method === 'DELETE') {
        const { id } = req.body || {};
        if (!id) return res.status(400).json({ error: 'ต้องระบุ id' });
        try {
            await db.query('DELETE FROM flood_guide_topics WHERE id = ?', [id]);
            return res.status(200).json({ ok: true });
        } catch (error) {
            console.error('[admin/guide] delete failed:', error);
            return res.status(500).json({ error: 'ลบหมวดคู่มือไม่สำเร็จ' });
        }
    }

    res.setHeader('Allow', ['GET', 'POST', 'PATCH', 'DELETE']);
    return res.status(405).json({ error: 'Method not allowed' });
}