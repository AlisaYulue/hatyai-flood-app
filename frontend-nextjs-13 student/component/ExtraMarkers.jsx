// วางไว้ "ภายใน" <MapContainer>: หมุดจุดฝากรถ (P สีน้ำเงิน) + หมุดขอความช่วยเหลือ (! สีตามความเร่งด่วน)
import { useEffect } from 'react';
import { Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { URGENCY } from './help-meta';

function makeIcon(item, selected) {
    const size = selected ? 38 : 30;
    let bg = '#1C6E8C', glyph = 'P', ring = '#F3F8F7';
    if (item.kind === 'help') {
        bg = URGENCY[item.raw.urgency]?.color || '#FF6B4A';
        glyph = '!';
        if (item.raw.status === 'in_progress') ring = '#2FBF83';
    }
    const halo = selected ? `0 0 0 6px ${bg}55,` : '';
    return L.divIcon({
        className: '',
        html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${bg};border:3px solid ${ring};box-shadow:${halo}0 3px 8px rgba(8,34,44,.45);display:flex;align-items:center;justify-content:center;color:#fff;font:700 ${selected ? 16 : 13}px 'Noto Sans Thai',sans-serif;transition:all .15s">${glyph}</div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
    });
}

function FlyToSelected({ item }) {
    const map = useMap();
    const key = item?.key;
    useEffect(() => {
        if (!item || item.lat == null) return;
        const z = Math.max(map.getZoom(), 15);
        const desktop = window.innerWidth >= 768;
        // เลื่อนจุดกึ่งกลางเพื่อให้หมุดไม่ไปซ่อนหลังแผงรายละเอียด
        const target = map.project([item.lat, item.lng], z).add([desktop ? 190 : 0, desktop ? 0 : 140]);
        map.flyTo(map.unproject(target, z), z, { duration: 0.6 });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key]);
    return null;
}

export default function ExtraMarkers({ items, selectedKey, onSelect }) {
    const selected = items.find((i) => i.key === selectedKey);
    return (
        <>
            <FlyToSelected item={selected} />
            {items
                .filter((i) => i.lat != null && i.lng != null)
                .map((i) => (
                    <Marker
                        key={i.key}
                        position={[i.lat, i.lng]}
                        icon={makeIcon(i, i.key === selectedKey)}
                        zIndexOffset={i.key === selectedKey ? 1000 : 0}
                        eventHandlers={{ click: () => onSelect(i.key) }}
                    >
                        <Tooltip direction="top" offset={[0, -16]}>{i.title}</Tooltip>
                    </Marker>
                ))}
        </>
    );
}