// pages/api/gistda-flood.js
// พร็อกซีดึงข้อมูลจาก GISTDA Disaster Open API (/features/*) ฝั่งเซิร์ฟเวอร์
// - เก็บ API key ไว้ฝั่งเซิร์ฟเวอร์ (ห้ามใช้ NEXT_PUBLIC_) และเลี่ยงปัญหา CORS
// - ดึงทีละหน้า (limit ≤ 1000) แล้วตัดข้อมูลให้เล็กลงก่อนส่งให้เบราว์เซอร์
//
// เรียกใช้: /api/gistda-flood?layer=flood-freq   (หรือแบบเดิม ?period=1day)
//
// .env.local
//   GISTDA_API_KEY=xxxxxxxx              # ขอได้ที่ https://api-gateway.gistda.or.th/v2
//   GISTDA_PV_IDN=90                     # รหัสจังหวัด (สงขลา)
//   GISTDA_AP_IDN=9011                   # รหัสอำเภอ (หาดใหญ่) — ลบทิ้งถ้าต้องการทั้งจังหวัด
//   GISTDA_BBOX=100.35,6.85,100.65,7.15 # (ไม่บังคับ) กรอบ minLng,minLat,maxLng,maxLat ตัดข้อมูลนอกกรอบทิ้ง

const BASE = 'https://api-gateway.gistda.or.th/api/2.0/resources/features';

// ชื่อชั้นข้อมูล → path ของ GISTDA
// props: เก็บ properties (ค่าสั้น ๆ) ไว้แสดงใน popup / ttl: อายุแคช (วินาที)
const LAYERS = {
    'flood-1day': { path: 'flood/1day', ttl: 1800, props: false },
    'flood-3days': { path: 'flood/3days', ttl: 3600, props: false },
    'flood-7days': { path: 'flood/7days', ttl: 3600, props: false },
    'flood-30days': { path: 'flood/30days', ttl: 21600, props: false },
    'flood-freq': { path: 'flood-freq', ttl: 86400, props: true },
    'water-hyacinth': { path: 'water_hyacinth', ttl: 21600, props: true },
};

const PAGE_SIZE = 1000; // เพดานของ API
const MAX_PAGES = 8; // กันตอบกลับใหญ่เกินไป (สูงสุด ~8,000 รูปทรงต่อชั้น)

// ปัดพิกัดเหลือ 5 ตำแหน่ง (~1 ม.) ลดขนาดไฟล์
const round5 = (n) => Math.round(n * 1e5) / 1e5;
const roundCoords = (c) => (typeof c[0] === 'number' ? [round5(c[0]), round5(c[1])] : c.map(roundCoords));

// เก็บเฉพาะค่าตัวเลข/ข้อความสั้น ๆ สูงสุด 8 ฟิลด์
const scalarProps = (p = {}) =>
    Object.fromEntries(
        Object.entries(p)
            .filter(([, v]) => typeof v === 'number' || (typeof v === 'string' && v.length <= 60))
            .slice(0, 8)
    );

const slim = (f, withProps) =>
    f?.geometry?.coordinates
        ? {
            type: 'Feature',
            properties: withProps ? scalarProps(f.properties) : {},
            geometry: { type: f.geometry.type, coordinates: roundCoords(f.geometry.coordinates) },
        }
        : null;

const firstPoint = (c) => {
    let p = c;
    while (Array.isArray(p[0])) p = p[0];
    return p;
};

function parseBBox() {
    const b = (process.env.GISTDA_BBOX || '').split(',').map(Number);
    return b.length === 4 && b.every(Number.isFinite) ? b : null;
}

function fetchPage(path, offset, key, useArea) {
    const url = new URL(`${BASE}/${path}`);
    url.searchParams.set('limit', String(PAGE_SIZE));
    url.searchParams.set('offset', String(offset));
    if (useArea) {
        url.searchParams.set('pv_idn', process.env.GISTDA_PV_IDN || '90');
        if (process.env.GISTDA_AP_IDN) url.searchParams.set('ap_idn', process.env.GISTDA_AP_IDN);
    }
    return fetch(url, {
        headers: { 'API-Key': key, Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
}

export const config = { api: { responseLimit: false } };

export default async function handler(req, res) {
    const key = process.env.GISTDA_API_KEY;
    if (!key) return res.status(500).json({ error: 'NO_API_KEY' });

    const id = LAYERS[req.query.layer] ? req.query.layer : `flood-${req.query.period || '1day'}`;
    const layer = LAYERS[id];
    if (!layer) return res.status(400).json({ error: 'UNKNOWN_LAYER' });

    const box = parseBBox();
    const inBox = (f) => {
        const [x, y] = firstPoint(f.geometry.coordinates);
        return x >= box[0] && x <= box[2] && y >= box[1] && y <= box[3];
    };

    const features = [];
    let truncated = false;
    let useArea = true;

    try {
        for (let page = 0; page < MAX_PAGES; page++) {
            let upstream = await fetchPage(layer.path, page * PAGE_SIZE, key, useArea);

            // บางชั้นข้อมูลอาจไม่รองรับ pv_idn/ap_idn → ลองใหม่โดยไม่กรองพื้นที่ (ให้ GISTDA_BBOX ช่วยตัดแทน)
            if (useArea && (upstream.status === 400 || upstream.status === 422)) {
                useArea = false;
                upstream = await fetchPage(layer.path, page * PAGE_SIZE, key, false);
            }

            if (!upstream.ok) {
                return res.status(502).json({ error: 'UPSTREAM', status: upstream.status });
            }

            const json = await upstream.json();
            const batch = Array.isArray(json?.features) ? json.features : [];
            for (const f of batch) {
                const s = slim(f, layer.props);
                if (s && (!box || inBox(s))) features.push(s);
            }

            if (batch.length < PAGE_SIZE) break;
            if (page === MAX_PAGES - 1) truncated = true;
        }
    } catch (err) {
        return res.status(502).json({ error: err?.name === 'TimeoutError' ? 'TIMEOUT' : 'FETCH_FAILED' });
    }

    res.setHeader('Cache-Control', `public, s-maxage=${layer.ttl}, stale-while-revalidate=${layer.ttl * 2}`);
    return res.status(200).json({
        type: 'FeatureCollection',
        features,
        meta: { layer: id, count: features.length, truncated, fetchedAt: new Date().toISOString() },
    });
}