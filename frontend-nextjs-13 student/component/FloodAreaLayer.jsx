import { useEffect, useMemo, useRef, useState } from 'react';
import { Circle, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import { depthColor } from './depthColor';

function baseRadius(depthMeters) {
    return 60 + Math.min(depthMeters, 5) * 70;
}

const HEX_CELL_KM2 = 0.105; // พื้นที่เฉลี่ยของเซลล์ H3 ความละเอียด 9 (GISTDA ใช้ขนาดนี้)

// ==========================================
// Polygon จำลอง (รูปร่างไม่เป็นสี่เหลี่ยม) — ใช้เมื่อ GISTDA ไม่พบพื้นที่น้ำท่วม หรือเชื่อมต่อไม่ได้
// พิกัดเป็น [lng, lat]
// ==========================================
const MOCK_FLOOD = {
    type: 'FeatureCollection',
    features: [
        {
            type: 'Feature',
            properties: { name: 'พื้นที่น้ำท่วมจำลอง (ตัวเมืองหาดใหญ่)', severity: 'สูง' },
            geometry: {
                type: 'Polygon',
                coordinates: [[
                    [100.4605, 7.018], [100.466, 7.0215], [100.4735, 7.0205], [100.479, 7.023],
                    [100.485, 7.019], [100.4872, 7.012], [100.4838, 7.0065], [100.486, 6.999],
                    [100.4815, 6.9935], [100.4745, 6.995], [100.4705, 6.9905], [100.464, 6.993],
                    [100.4615, 6.9995], [100.466, 7.005], [100.461, 7.0105], [100.4605, 7.018],
                ]],
            },
        },
        {
            type: 'Feature',
            properties: { name: 'พื้นที่น้ำท่วมจำลอง (ฝั่งตะวันออก)', severity: 'ปานกลาง' },
            geometry: {
                type: 'Polygon',
                coordinates: [[
                    [100.4925, 7.011], [100.4985, 7.014], [100.503, 7.0095], [100.501, 7.003],
                    [100.495, 7.0015], [100.4915, 7.006], [100.4925, 7.011],
                ]],
            },
        },
    ],
};

const MOCK_STYLE = { fillColor: '#ef4444', fillOpacity: 0.35, color: '#b91c1c', weight: 2, dashArray: '5, 5' };
// ข้อมูลจริงเป็นเซลล์เล็กจำนวนมากที่ติดกัน → ไม่ใส่ขอบ เพื่อให้เห็นเป็นผืนน้ำต่อเนื่อง
const LIVE_STYLE = { fillColor: '#ef4444', fillOpacity: 0.42, stroke: false };

const bindMockPopup = (feature, layer) => {
    const { name, severity } = feature.properties || {};
    if (!name) return;
    layer.bindPopup(`
        <div style="font-family: 'Noto Sans Thai', sans-serif;">
            <b>${name}</b><br/>
            ระดับความรุนแรง: ${severity}
        </div>
    `);
};

// เว้นขอบให้พ้นแผงรายการ (ขวาบนเดสก์ท็อป / ล่างบนมือถือ)
function fitOptions() {
    const desktop = window.innerWidth >= 768;
    return {
        paddingTopLeft: [60, 60],
        paddingBottomRight: desktop ? [400, 60] : [60, Math.round(window.innerHeight * 0.5)],
        maxZoom: 15,
        duration: 1.2,
    };
}

// ป้ายบอกที่มาของข้อมูล วางไว้นอก MapContainer (ใน FloodMap)
export function SimStatusBadge({ status }) {
    if (!status) return null;

    let line1 = '';
    let line2 = '';
    let dot = 'bg-amber-400';

    if (status.state === 'loading') {
        line1 = 'กำลังดึงข้อมูลน้ำท่วมจาก GISTDA...';
        dot = 'bg-[#F3F8F7]/60 animate-pulse';
    } else if (status.state === 'live') {
        line1 = 'ข้อมูลดาวเทียม GISTDA · 1 วันล่าสุด';
        line2 = `${status.count.toLocaleString('th-TH')} เซลล์ ≈ ${status.areaKm2.toFixed(1)} ตร.กม.${status.truncated ? ' (แสดงบางส่วน)' : ''}`;
        dot = 'bg-[#FF6B4A]';
    } else if (status.state === 'empty') {
        line1 = 'GISTDA ไม่พบพื้นที่น้ำท่วมในพื้นที่นี้ช่วง 1 วันล่าสุด';
        line2 = 'กำลังแสดงพื้นที่จำลองแทน';
    } else {
        line1 = status.reason === 'NO_API_KEY' ? 'ยังไม่ได้ตั้งค่า GISTDA_API_KEY' : 'เชื่อมต่อ GISTDA ไม่สำเร็จ';
        line2 = 'กำลังแสดงพื้นที่จำลองแทน';
    }

    return (
        <div
            role="status"
            className="max-w-[calc(100vw-2rem)] md:max-w-xs flex items-start gap-2.5 rounded-xl border border-white/10 bg-[#08222C]/90 backdrop-blur-md px-3 py-2 shadow-lg shadow-black/30 font-['Noto_Sans_Thai']"
        >
            <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${dot}`} aria-hidden="true" />
            <div className="text-xs leading-snug">
                <p className="text-[#F3F8F7]/90 font-medium">{line1}</p>
                {line2 && <p className="text-[#F3F8F7]/55 mt-0.5">{line2}</p>}
            </div>
        </div>
    );
}

export default function FloodAreaLayer({ points = [], isSimulating, onStatusChange }) {
    const map = useMap();
    const ringsRef = useRef([]);
    const cacheRef = useRef(null); // กดเปิด-ปิดซ้ำไม่ต้องดึงใหม่
    const statusCbRef = useRef(onStatusChange);
    statusCbRef.current = onStatusChange;

    const [area, setArea] = useState(null); // { data, live }

    // วาดผ่าน canvas — เซลล์เป็นพันรูปจะลื่นกว่า SVG มาก
    const canvas = useMemo(() => L.canvas({ padding: 0.5 }), []);

    // ==========================================
    // 1. ดึงพื้นที่น้ำท่วมจาก GISTDA (ผ่าน /api/gistda-flood) เมื่อกด "จำลองสถานการณ์"
    // ==========================================
    useEffect(() => {
        const report = (s) => statusCbRef.current?.(s);

        if (!isSimulating) {
            setArea(null);
            report(null);
            return;
        }

        if (cacheRef.current) {
            setArea(cacheRef.current.area);
            report(cacheRef.current.status);
            return;
        }

        const controller = new AbortController();
        setArea(null);
        report({ state: 'loading' });

        (async () => {
            let result;
            try {
                const res = await fetch('/api/gistda-flood?period=1day', { signal: controller.signal });
                const json = await res.json().catch(() => null);
                if (!res.ok) throw Object.assign(new Error('upstream'), { code: json?.error });

                const count = json?.features?.length ?? 0;
                result =
                    count > 0
                        ? {
                            area: { data: json, live: true },
                            status: {
                                state: 'live',
                                count,
                                areaKm2: count * HEX_CELL_KM2,
                                truncated: !!json?.meta?.truncated,
                            },
                        }
                        : { area: { data: MOCK_FLOOD, live: false }, status: { state: 'empty' } };
            } catch (err) {
                if (err.name === 'AbortError') return;
                result = {
                    area: { data: MOCK_FLOOD, live: false },
                    status: { state: 'error', reason: err.code },
                };
            }

            if (result.status.state !== 'error') cacheRef.current = result; // error ไม่แคช เพื่อให้ลองใหม่ได้
            setArea(result.area);
            report(result.status);
        })();

        return () => controller.abort();
    }, [isSimulating]);

    // เลื่อนแผนที่ไปยังพื้นที่น้ำท่วมเมื่อข้อมูลพร้อม
    useEffect(() => {
        if (!area) return;
        const bounds = L.geoJSON(area.data).getBounds();
        if (bounds.isValid()) map.flyToBounds(bounds, fitOptions());
    }, [area, map]);

    // ==========================================
    // 2. แอนิเมชันน้ำกระเพื่อมสำหรับจุดที่ผู้ใช้แจ้ง (โค้ดเดิม)
    // ==========================================
    useEffect(() => {
        let raf;
        const start = performance.now();

        const tick = (now) => {
            const t = (now - start) / 1000;
            ringsRef.current.forEach((ring) => {
                if (!ring.instance) return;
                const r = ring.base * (1 + ring.amp * Math.sin(t * 0.6 + ring.phase));
                ring.instance.setRadius(Math.max(1, r));
            });
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [points]);

    ringsRef.current = []; // เคลียร์ ref ก่อน re-render ใหม่

    return (
        <>
            {/* เลเยอร์ชั้นล่าง: ขอบเขตน้ำท่วมวงกว้าง (โพลิกอน) */}
            {area && (
                <GeoJSON
                    key={`${area.live ? 'live' : 'mock'}-${area.data.features.length}`} // GeoJSON ไม่อัปเดต data เอง ต้องบังคับวาดใหม่
                    data={area.data}
                    renderer={canvas}
                    style={area.live ? LIVE_STYLE : MOCK_STYLE}
                    interactive={!area.live}
                    onEachFeature={area.live ? undefined : bindMockPopup}
                />
            )}

            {/* เลเยอร์ชั้นบน: วงกลมน้ำกระเพื่อมตามจุด */}
            {points && points.map((p, i) => {
                const depth = Number(p.water_level_meters) || 0;
                if (depth <= 0) return null;
                const color = depthColor(depth);
                const base = baseRadius(depth);

                return [0, 1, 2].map((ring) => {
                    const scale = 1 - (ring * 0.28);
                    const amp = 0.08 + (ring * 0.04);
                    const phase = (ring * 1.1) + (i * 0.4);

                    return (
                        <Circle
                            key={`${p.id}-ring-${ring}`}
                            center={[p.latitude, p.longitude]}
                            radius={base * scale}
                            pathOptions={{
                                stroke: false,
                                fillColor: color,
                                fillOpacity: 0.26 - (ring * 0.06),
                            }}
                            ref={(instance) => {
                                if (instance) {
                                    ringsRef.current.push({
                                        instance,
                                        base: base * scale,
                                        amp,
                                        phase,
                                    });
                                }
                            }}
                        />
                    );
                });
            })}
        </>
    );
}