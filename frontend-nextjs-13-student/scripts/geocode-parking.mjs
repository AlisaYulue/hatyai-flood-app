// หาพิกัดจุดจอดรถอัตโนมัติจาก OpenStreetMap (Nominatim) แล้วเขียนลง lib/parking-coords.json
// รันที่โฟลเดอร์รากของโปรเจกต์:  node scripts/geocode-parking.mjs
// ต้องใช้ Node 18+ และต่ออินเทอร์เน็ต — ใช้เวลาราว 1 นาที (จำกัด 1 คำขอ/วินาทีตามกติกา Nominatim)
// ผลที่ได้เป็นค่า "ประมาณ" ให้เปิดดูบนแผนที่ว่าหมุดตรงที่จริงไหม ตัวไหนผิดแก้ใน parking-coords.json ได้เลย
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const tmp = path.join(os.tmpdir(), `parking-data-${Date.now()}.mjs`);
fs.copyFileSync(path.join(root, 'lib/parking-data.js'), tmp);
const { PARKING_SPOTS_RAW } = await import(pathToFileURL(tmp).href);

const coordsPath = path.join(root, 'lib/parking-coords.json');
const coords = fs.existsSync(coordsPath) ? JSON.parse(fs.readFileSync(coordsPath, 'utf8')) : {};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// กรอบพื้นที่หาดใหญ่ + ม.อ. + คอหงส์
const BOX = { lat: [6.85, 7.2], lng: [100.3, 100.65] };

async function search(q) {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.search = new URLSearchParams({
        q, format: 'json', limit: '1', countrycodes: 'th', 'accept-language': 'th',
        viewbox: '100.3,7.2,100.65,6.85', bounded: '1',
    });
    const res = await fetch(url, { headers: { 'User-Agent': 'hatyai-flood-student-project/1.0' } });
    if (!res.ok) return null;
    const [r] = await res.json();
    if (!r) return null;
    const lat = Number(r.lat), lng = Number(r.lon);
    if (lat < BOX.lat[0] || lat > BOX.lat[1] || lng < BOX.lng[0] || lng > BOX.lng[1]) return null;
    return { lat, lng, label: r.display_name };
}

function queries(s) {
    const clean = s.name.replace(/\(.*?\)/g, '').trim();
    if (s.group_id === 'psu') {
        const core = clean.replace(/^ลานจอดรถ(ข้าง|ทาง)?/, '').trim();
        return [`${core} มหาวิทยาลัยสงขลานครินทร์`, `${core} ม.อ. หาดใหญ่`];
    }
    return [`${clean} หาดใหญ่`, clean];
}

const sql = [];
const missing = [];
for (const s of PARKING_SPOTS_RAW) {
    if (coords[s.id]) continue;
    let hit = null;
    for (const q of queries(s)) {
        hit = await search(q);
        await sleep(1100);
        if (hit) break;
    }
    if (hit) {
        coords[s.id] = { lat: +hit.lat.toFixed(6), lng: +hit.lng.toFixed(6) };
        sql.push(`UPDATE parking_spots SET latitude=${coords[s.id].lat}, longitude=${coords[s.id].lng} WHERE group_id='${s.group_id}' AND sort_order=${s.sort_order};`);
        console.log(`✔ ${s.name}\n    → ${hit.lat}, ${hit.lng}  (${hit.label.slice(0, 70)})`);
    } else {
        missing.push(s);
        console.log(`✘ ไม่พบ: ${s.name}`);
    }
}

fs.writeFileSync(coordsPath, JSON.stringify(coords, null, 2));
if (sql.length) fs.writeFileSync(path.join(root, 'component/db/parking_coords.sql'), sql.join('\n') + '\n');
console.log(`\nเสร็จ: ได้พิกัด ${Object.keys(coords).length}/${PARKING_SPOTS_RAW.length} จุด`);
if (missing.length) {
    console.log('จุดที่ยังไม่มีพิกัด — เปิด Google Maps คลิกขวาที่จุดนั้น คัดลอกตัวเลข แล้วเติมใน lib/parking-coords.json รูปแบบ:');
    missing.forEach((s) => console.log(`  "${s.id}": { "lat": 0.0, "lng": 0.0 },   // ${s.name}`));
}
