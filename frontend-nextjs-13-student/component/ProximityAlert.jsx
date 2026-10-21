// component/ProximityAlert.jsx
// แจ้งเตือนตอนแอปเปิดอยู่และผู้ใช้อนุญาตตำแหน่ง — เป็น "in-app alert" ไม่ใช่ push notification
// ถ้าต้องการแจ้งเตือนตอนปิดแอป ต้องทำ service worker + เก็บ subscription ลง DB เพิ่ม (ยังไม่ได้ทำใน sprint นี้)

import { useEffect, useRef, useState } from 'react';
import Modal from './Modal';

const ALERT_RADIUS_M = 500;
const MIN_DEPTH_TO_ALERT = 0.3;

function haversine(lat1, lng1, lat2, lng2) {
    const R = 6371000;
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
}

export default function ProximityAlert({ floodPoints }) {
    const [nearby, setNearby] = useState(null);
    const notifiedRef = useRef(new Set()); // กันแจ้งซ้ำจุดเดิมทุก 30 วินาที

    useEffect(() => {
        if (typeof window === 'undefined' || !navigator.geolocation || !floodPoints?.length) return;

        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                for (const p of floodPoints) {
                    const depth = Number(p.water_level_meters) || 0;
                    if (depth < MIN_DEPTH_TO_ALERT) continue;
                    const d = haversine(latitude, longitude, p.latitude, p.longitude);
                    if (d <= ALERT_RADIUS_M && !notifiedRef.current.has(p.id)) {
                        notifiedRef.current.add(p.id);
                        setNearby({ ...p, distance: Math.round(d) });
                        break;
                    }
                }
            },
            (err) => console.warn('[ProximityAlert] geolocation error:', err.message),
            { enableHighAccuracy: false, maximumAge: 30000, timeout: 20000 }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, [floodPoints]);

    return (
        <Modal open={!!nearby} onClose={() => setNearby(null)} maxWidth="max-w-sm">
            {nearby && (
                <div className="p-6 pt-8 sm:pt-6 text-center">
                    <p className="text-4xl">⚠️</p>
                    <p className="font-['Kanit'] font-semibold text-lg text-[#F3F8F7] mt-2">
                        คุณอยู่ใกล้จุดน้ำท่วม
                    </p>
                    <p className="text-sm text-[#F3F8F7]/70 mt-1">
                        {nearby.location_name} ห่างจากคุณประมาณ {nearby.distance} เมตร
                        (ลึก {Number(nearby.water_level_meters).toFixed(2)} ม.)
                    </p>
                    <button
                        onClick={() => setNearby(null)}
                        className="mt-5 w-full bg-[#FF6B4A] text-[#08222C] font-medium py-2.5 rounded-xl"
                    >
                        รับทราบ
                    </button>
                </div>
            )}
        </Modal>
    );
}