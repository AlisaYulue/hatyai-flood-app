// วางไว้ "ใน" <MapContainer> — โหลดและวาดชั้นข้อมูล GISTDA สีน้ำเงินตามที่เปิดสวิตช์
import { useEffect, useMemo, useRef, useState } from 'react';
import { GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import { GISTDA_LAYERS, HEX_CELL_KM2 } from './gistdaLayers';

const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// popup แบบทั่วไป: ชื่อชั้นข้อมูล + ฟิลด์ที่ GISTDA ส่งมา (ยังไม่ทราบชื่อฟิลด์แน่ชัด จึงแสดงตามจริง)
const popupBinder = (title) => (feature, layer) => {
    const rows = Object.entries(feature.properties || {})
        .map(([k, v]) => `<div><span style="opacity:.6">${esc(k)}</span> ${esc(v)}</div>`)
        .join('');
    layer.bindPopup(
        `<div style="font-family:'Noto Sans Thai',sans-serif;font-size:12px;line-height:1.5"><b>${esc(title)}</b>${rows}</div>`
    );
};

export default function GistdaOverlays({ enabled = {}, onStatus }) {
    const canvas = useMemo(() => L.canvas({ padding: 0.5 }), []);
    const [data, setData] = useState({}); // id -> FeatureCollection (เก็บไว้ เปิด-ปิดซ้ำไม่ต้องโหลดใหม่)
    const inflight = useRef(new Map()); // id -> AbortController
    const failed = useRef(new Set()); // โหลดไม่สำเร็จ — ไม่ลองซ้ำจนกว่าจะปิดแล้วเปิดใหม่
    const onStatusRef = useRef(onStatus);
    onStatusRef.current = onStatus;

    useEffect(() => {
        const report = (id, s) => onStatusRef.current?.(id, s);

        const load = async (id) => {
            const controller = new AbortController();
            inflight.current.set(id, controller);
            report(id, { state: 'loading' });
            try {
                const res = await fetch(`/api/gistda-flood?layer=${id}`, { signal: controller.signal });
                const json = await res.json().catch(() => null);
                if (!res.ok) throw Object.assign(new Error('upstream'), { code: json?.error });

                const count = json?.features?.length ?? 0;
                setData((p) => ({ ...p, [id]: json }));
                report(id, { state: count ? 'live' : 'empty', count, truncated: !!json?.meta?.truncated });
            } catch (err) {
                if (err.name === 'AbortError') return;
                failed.current.add(id);
                report(id, { state: 'error', reason: err.code });
            } finally {
                if (inflight.current.get(id) === controller) inflight.current.delete(id);
            }
        };

        GISTDA_LAYERS.forEach(({ id }) => {
            const running = inflight.current.get(id);
            if (!enabled[id]) {
                failed.current.delete(id);
                if (running) {
                    running.abort();
                    inflight.current.delete(id);
                    report(id, null);
                }
                return;
            }
            if (data[id] || running || failed.current.has(id)) return;
            load(id);
        });
    }, [enabled, data]);

    // ยกเลิกคำขอที่ค้างอยู่ตอน unmount
    useEffect(() => {
        const map = inflight.current;
        return () => map.forEach((c) => c.abort());
    }, []);

    return (
        <>
            {GISTDA_LAYERS.map(({ id, label, style, popup }) => {
                const fc = data[id];
                if (!enabled[id] || !fc?.features?.length) return null;
                return (
                    <GeoJSON
                        key={`${id}-${fc.features.length}`} // GeoJSON ไม่อัปเดต data เอง ต้องบังคับวาดใหม่
                        data={fc}
                        renderer={canvas}
                        style={style}
                        interactive={!!popup}
                        // เผื่อบางชั้นข้อมูลส่งมาเป็นจุด → วาดเป็นวงกลมสีเดียวกัน แทนหมุดเริ่มต้นของ Leaflet
                        pointToLayer={(_, latlng) => L.circleMarker(latlng, { ...style, radius: 5, renderer: canvas })}
                        onEachFeature={popup ? popupBinder(label) : undefined}
                    />
                );
            })}
        </>
    );
}

// ใช้แสดงจำนวน/พื้นที่ในตัวควบคุม
export function summarize(layer, status) {
    if (!status || status.state !== 'live') return '';
    const n = status.count.toLocaleString('th-TH');
    const extra = layer.hexCells ? ` ≈ ${(status.count * HEX_CELL_KM2).toFixed(1)} ตร.กม.` : '';
    return `${n} รูปทรง${extra}${status.truncated ? ' (แสดงบางส่วน)' : ''}`;
}