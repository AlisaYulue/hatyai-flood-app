// component/depthColor.js
// สเกลสีตามความลึกน้ำ (เมตร) — ไล่จากฟ้าอ่อนไปเข้ม แล้วจบที่แดงเมื่อลึกมากๆ
// ใช้ร่วมกันทั้งหมุดบนแผนที่, เกจ, และ legend เพื่อให้สีตรงกันทุกที่

export const DEPTH_BANDS = [
    { max: 0.5, color: '#BEE3F5', label: '0 – 0.5 ม.' },
    { max: 1, color: '#7FC4EA', label: '0.5 – 1 ม.' },
    { max: 2, color: '#3E97CE', label: '1 – 2 ม.' },
    { max: 3, color: '#1F5FA8', label: '2 – 3 ม.' },
    { max: 5, color: '#14356B', label: '3 – 5 ม.' },
    { max: Infinity, color: '#B3261E', label: 'เกิน 5 ม.' },
];

export function depthColor(depthMeters = 0) {
    const d = Math.max(0, Number(depthMeters) || 0);
    const band = DEPTH_BANDS.find((b) => d <= b.max);
    return (band || DEPTH_BANDS[DEPTH_BANDS.length - 1]).color;
}