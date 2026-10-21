import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const HATYAI = [7.0086, 100.4747];

// แผนที่เลือกจุด: แตะ/คลิกเพื่อปักหมุด (ใช้ circleMarker กันปัญหาไอคอน Leaflet ไม่ขึ้นใน Next.js)
export default function ReportMapPicker({ position, onChange }) {
    const elRef = useRef(null);
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    useEffect(() => {
        const map = L.map(elRef.current, { zoomControl: true }).setView(position || HATYAI, position ? 16 : 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap',
            maxZoom: 19,
        }).addTo(map);
        map.on('click', (e) => onChangeRef.current([e.latlng.lat, e.latlng.lng]));
        mapRef.current = map;
        return () => { map.remove(); mapRef.current = null; markerRef.current = null; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const map = mapRef.current;
        if (!map || !position) return;
        if (!markerRef.current) {
            markerRef.current = L.circleMarker(position, {
                radius: 11, color: '#fff', weight: 3, fillColor: '#FF6B4A', fillOpacity: 1,
            }).addTo(map);
        } else {
            markerRef.current.setLatLng(position);
        }
        map.flyTo(position, Math.max(map.getZoom(), 16), { duration: 0.6 });
    }, [position]);

    return <div ref={elRef} className="h-full w-full" />;
}