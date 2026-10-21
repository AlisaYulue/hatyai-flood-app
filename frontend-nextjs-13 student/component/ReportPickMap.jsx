// component/ReportPickMap.jsx
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const HAT_YAI_CENTER = [7.0049, 100.4736];

function ClickCatcher({ onPick }) {
    useMapEvents({
        click: (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }),
    });
    return null;
}

function pickIcon() {
    return L.divIcon({
        className: '',
        html: `<div style="width:26px;height:26px;border-radius:50%;background:#FF6B4A;border:3px solid #F3F8F7;box-shadow:0 0 0 6px rgba(255,107,74,0.25)"></div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
    });
}

export default function ReportPickMap({ position, onPick }) {
    return (
        <>
            <MapContainer center={HAT_YAI_CENTER} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    className="dark-tiles"
                />
                <ClickCatcher onPick={onPick} />
                {position && <Marker position={[position.lat, position.lng]} icon={pickIcon()} />}
            </MapContainer>

            <style jsx global>{`
                .leaflet-container {
                    background: #08222c;
                }
                /* ทำให้ tile ของ OSM กลายเป็นโทนมืด โดยไม่ต้องใช้ API key */
                .dark-tiles {
                    filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
                }
                /* ป้องกันหมุด/ป้ายต่างๆ โดน invert ไปด้วย */
                .leaflet-marker-pane,
                .leaflet-tooltip-pane,
                .leaflet-popup-pane {
                    filter: none;
                }
            `}</style>
        </>
    );
}