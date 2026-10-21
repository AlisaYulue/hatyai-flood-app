// ชั้นข้อมูลจาก GISTDA ที่วาดเป็นโพลิกอนสีน้ำเงิน (เรียงจากล่างขึ้นบน)
// สีแดงของโหมด "จำลองสถานการณ์" (น้ำท่วม 1 วัน) ยังอยู่ใน FloodAreaLayer
//
// hexCells: ข้อมูลเป็นเซลล์ H3 ขนาดคงที่ → ประมาณพื้นที่ได้จากจำนวนเซลล์
// popup: แสดง popup จาก properties ของฟีเจอร์ (ชั้นที่รูปทรงมีจำนวนไม่มาก)

export const HEX_CELL_KM2 = 0.105; // พื้นที่เฉลี่ยของเซลล์ H3 ความละเอียด 9

export const GISTDA_LAYERS = [
    {
        id: 'flood-30days',
        label: 'น้ำท่วม 30 วันล่าสุด',
        hint: 'พื้นที่ที่เคยถูกน้ำท่วมในรอบเดือน',
        color: '#7DD3FC',
        hexCells: true,
        style: { fillColor: '#7DD3FC', fillOpacity: 0.3, stroke: false },
    },
    {
        id: 'flood-7days',
        label: 'น้ำท่วม 7 วันล่าสุด',
        hint: 'พื้นที่น้ำท่วมจากดาวเทียมในรอบสัปดาห์',
        color: '#38BDF8',
        hexCells: true,
        style: { fillColor: '#38BDF8', fillOpacity: 0.4, stroke: false },
    },
    {
        id: 'flood-freq',
        label: 'พื้นที่น้ำท่วมซ้ำซาก',
        hint: 'โซนที่ท่วมบ่อยจากข้อมูลย้อนหลัง',
        color: '#2563EB',
        popup: true,
        style: { fillColor: '#2563EB', fillOpacity: 0.4, color: '#1D4ED8', weight: 1.5 },
    },
    {
        id: 'water-hyacinth',
        label: 'ผักตบชวา (สิ่งกีดขวางทางน้ำ)',
        hint: 'พืชลอยน้ำที่ขวางทางระบายน้ำ',
        color: '#0EA5E9',
        popup: true,
        style: { fillColor: '#0EA5E9', fillOpacity: 0.45, color: '#0369A1', weight: 1.5, dashArray: '4, 3' },
    },
];