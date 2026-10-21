import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const HAT_YAI_CENTER = [7.0049, 100.4736];
// คอมเมนต์ maxBounds ไว้ชั่วคราว เพื่อให้แผนที่บินไปหาพิกัดนอกพื้นที่หาดใหญ่ตอนทดสอบได้
// const HAT_YAI_BOUNDS = [[6.9, 100.3], [7.15, 100.6]];

function ClickCatcher({ onPick }) {
    useMapEvents({ click: (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }) });
    return null;
}

// 1. เพิ่มคอมโพเนนต์สำหรับรับค่าและสั่งเลื่อนแผนที่
function MapController({ position }) {
    const map = useMap();
    useEffect(() => {
        // ถ้ารับค่า position มา และมีคำสั่ง fly=true ให้แผนที่บินไปหาพิกัดนั้น
        if (position && position.fly) {
            map.flyTo([position.lat, position.lng], 15, { animate: true });
        }
    }, [map, position]);
    return null;
}

const pin = () =>
    L.divIcon({
        className: '',
        html: `<div style="width:26px;height:26px;border-radius:50%;background:#FF6B4A;border:3px solid #F3F8F7;box-shadow:0 0 0 6px rgba(255,107,74,0.25)"></div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
    });

export default function HelpPickMap({ position, onPick }) {
    return (
        <>
            <MapContainer
                center={HAT_YAI_CENTER}
                zoom={13}
                minZoom={5} // ปรับให้ซูมออกได้มากขึ้นตอนทดสอบข้ามจังหวัด
                // maxBounds={HAT_YAI_BOUNDS} // ปลดล็อกขอบเขตชั่วคราว
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    className="dark-tiles"
                />

                <ClickCatcher onPick={onPick} />

                {/* 2. นำคอมโพเนนต์ควบคุมแผนที่มาใช้งาน */}
                <MapController position={position} />

                {position && <Marker position={[position.lat, position.lng]} icon={pin()} />}
            </MapContainer>

            <style jsx global>{`
                .leaflet-container { background: #08222c; }
                .dark-tiles { filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%); }
            `}</style>
        </>
    );
}