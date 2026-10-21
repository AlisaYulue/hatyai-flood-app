// รวมรายงานน้ำท่วมที่อยู่ใกล้กันให้เหลือหมุดเดียวต่อจุด
// ใช้ในฝั่ง API (เช่น /api/map-data) ก่อนส่งข้อมูลให้แผนที่

const EARTH_R = 6371000;
const toRad = (d) => (d * Math.PI) / 180;

export function distanceM(lat1, lng1, lat2, lng2) {
    const a =
        Math.sin(toRad(lat2 - lat1) / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(toRad(lng2 - lng1) / 2) ** 2;
    return 2 * EARTH_R * Math.asin(Math.min(1, Math.sqrt(a)));
}

/**
 * @param {Array} reports  แถวจาก flood_reports (ต้องมี latitude, longitude, reported_at)
 * @param {number} radiusM รัศมีรวมหมุด (เมตร) ควรเท่ากับ RADIUS_M ใน API รายงาน
 * @returns {Array} หมุดตัวแทน 1 อันต่อกลุ่ม พร้อม report_count และ report_ids
 *
 * หมุดตัวแทน = รายงานล่าสุดของกลุ่ม (ตำแหน่ง/ชื่อ/ระดับน้ำปัจจุบัน)
 * ถ้าอยากให้แสดงระดับที่ลึกที่สุดแทน ให้เปลี่ยน SHOW_DEEPEST เป็น true
 */
const SHOW_DEEPEST = false;

export function clusterReports(reports, radiusM = 150) {
    const sorted = [...reports].sort((a, b) => new Date(b.reported_at) - new Date(a.reported_at));
    const clusters = [];

    for (const r of sorted) {
        const lat = Number(r.latitude);
        const lng = Number(r.longitude);
        const hit = clusters.find((c) => distanceM(c.latitude, c.longitude, lat, lng) <= radiusM);
        if (hit) {
            hit.report_count += 1;
            hit.report_ids.push(r.id);
            if (SHOW_DEEPEST && Number(r.water_level_meters) > Number(hit.water_level_meters)) {
                hit.water_level_meters = r.water_level_meters;
                hit.risk_level = r.risk_level;
            }
        } else {
            // รายงานแรกที่เจอ = ล่าสุดของกลุ่ม (เพราะเรียงใหม่ -> เก่า)
            clusters.push({
                ...r,
                latitude: lat,
                longitude: lng,
                report_count: 1,
                report_ids: [r.id],
            });
        }
    }
    return clusters;
}