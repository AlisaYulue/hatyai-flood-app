// รวมข้อมูล "จุดฝากรถ" + "ศูนย์พักพิง" สำหรับแผนที่หลัก (ตัดคำขอความช่วยเหลือออก)
import { useCallback, useEffect, useMemo, useState } from 'react';
import { PARKING_GROUPS, PARKING_SPOTS } from '../lib/parking-spots';

function distanceKm(a, b) {
    const R = 6371, rad = (d) => (d * Math.PI) / 180;
    const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
}

export function useMapExtras() {
    const [shelters, setShelters] = useState([]);
    const [parking, setParking] = useState({ groups: PARKING_GROUPS, spots: PARKING_SPOTS });
    const [filters, setFilters] = useState({ parking: true, shelter: true });
    const [me, setMe] = useState(null);
    const [locating, setLocating] = useState(false);
    const [geoError, setGeoError] = useState('');

    // 1. ดึงข้อมูลศูนย์พักพิงจาก /api/map-data
    useEffect(() => {
        let stop = false;
        const loadShelters = () =>
            fetch('/api/map-data')
                .then((r) => (r.ok ? r.json() : {}))
                .then((d) => {
                    if (!stop && Array.isArray(d.evacuationCenters)) {
                        setShelters(d.evacuationCenters);
                    }
                })
                .catch(() => { });
        loadShelters();
        const t = setInterval(loadShelters, 60000);
        return () => { stop = true; clearInterval(t); };
    }, []);

    // 2. ดึงข้อมูลจุดฝากรถ
    useEffect(() => {
        fetch('/api/parking')
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => d && Array.isArray(d.spots) && d.spots.length && setParking({ groups: d.groups, spots: d.spots }))
            .catch(() => { });
    }, []);

    // รวมรายการจุดฝากรถ และ ศูนย์พักพิง
    const items = useMemo(() => {
        // รายการศูนย์พักพิง
        const sList = shelters.map((s) => {
            const has = s.latitude != null && s.longitude != null;
            return {
                key: `shelter-${s.id}`,
                kind: 'shelter',
                lat: has ? Number(s.latitude) : null,
                lng: has ? Number(s.longitude) : null,
                title: s.name,
                subtitle: s.address || s.location || '',
                note: s.notes || s.note || '',
                raw: s,
            };
        });

        // รายการจุดฝากรถ
        const pList = parking.spots.map((s) => {
            const g = parking.groups.find((x) => x.id === s.group_id);
            const has = s.latitude != null && s.longitude != null;
            return {
                key: `parking-${s.id}`,
                kind: 'parking',
                lat: has ? Number(s.latitude) : null,
                lng: has ? Number(s.longitude) : null,
                title: s.name,
                subtitle: g?.label || '',
                note: g?.note || '',
                raw: s,
            };
        });

        return [...sList, ...pList];
    }, [shelters, parking]);

    const visible = useMemo(() => {
        let out = items.filter((i) => filters[i.kind]).map((i) => ({
            ...i,
            km: me && i.lat != null ? distanceKm(me, { lat: i.lat, lng: i.lng }) : null,
        }));
        if (me) out = [...out].sort((a, b) => (a.km ?? 1e9) - (b.km ?? 1e9));
        return out;
    }, [items, filters, me]);

    const toggle = (k) => setFilters((f) => ({ ...f, [k]: !f[k] }));

    const locate = useCallback(() => {
        if (!navigator.geolocation) return setGeoError('เบราว์เซอร์นี้ไม่รองรับการระบุตำแหน่ง');
        setLocating(true);
        setGeoError('');
        navigator.geolocation.getCurrentPosition(
            (p) => { setMe({ lat: p.coords.latitude, lng: p.coords.longitude }); setLocating(false); },
            () => { setGeoError('อ่านตำแหน่งไม่ได้ กรุณาอนุญาตการเข้าถึงตำแหน่ง'); setLocating(false); },
            { enableHighAccuracy: true, timeout: 8000 }
        );
    }, []);

    return { visible, filters, toggle, me, locate, locating, geoError };
}