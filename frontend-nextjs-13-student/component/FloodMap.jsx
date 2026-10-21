import { useCallback, useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Progress, Chip } from '@heroui/react';
import { Navigation, Users, Tent, AlertTriangle, CheckCircle2 } from 'lucide-react';
import FloodPointModal from './FloodPointModal';
import FloodAreaLayer, { SimStatusBadge } from './FloodAreaLayer';
import GistdaOverlays from './GistdaOverlays';
import GistdaLayerControl from './GistdaLayerControl';
import ProximityAlert from './ProximityAlert';
import { depthColor } from './depthColor';
import MapSidePanel from './MapSidePanel';
import { useMapExtras } from './useMapExtras';

const HAT_YAI_CENTER = [7.0049, 100.4736];

function pinIcon(color, uid, pulse) {
    return L.divIcon({
        className: 'pin-bob',
        html: `
      <div style="position:relative;width:34px;height:44px;">
        ${pulse ? `<span class="pin-pulse" style="background:${color}"></span>` : ''}
        <svg width="34" height="44" viewBox="0 0 34 44" style="position:relative;z-index:1;filter:drop-shadow(0 3px 4px rgba(8,34,44,0.35))">
          <defs>
            <linearGradient id="shine-${uid}" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stop-color="#ffffff" stop-opacity="0" />
              <stop offset="0.5" stop-color="#ffffff" stop-opacity="0.6" />
              <stop offset="1" stop-color="#ffffff" stop-opacity="0" />
              <animateTransform attributeName="gradientTransform" type="translate"
                values="-1 0; 1 0; -1 0" keyTimes="0;0.5;1" dur="2.6s" repeatCount="indefinite" />
            </linearGradient>
          </defs>
          <path d="M17 0C7.6 0 0 7.6 0 17c0 12 17 27 17 27s17-15 17-27C34 7.6 26.4 0 17 0z" fill="${color}"/>
          <path d="M17 0C7.6 0 0 7.6 0 17c0 12 17 27 17 27s17-15 17-27C34 7.6 26.4 0 17 0z" fill="url(#shine-${uid})" style="mix-blend-mode:overlay"/>
          <path d="M17 11c0 0 4.2 4.9 4.2 8.1a4.2 4.2 0 1 1-8.4 0C12.8 15.9 17 11 17 11z" fill="#F3F8F7"/>
        </svg>
      </div>`,
        iconSize: [34, 44],
        iconAnchor: [17, 44],
    });
}

function getShelterStatus(currentOccupancy, capacity) {
    const cap = Number(capacity) || 0;
    const occ = Number(currentOccupancy) || 0;
    const percent = cap > 0 ? Math.round((occ / cap) * 100) : 0;

    if (percent >= 100) {
        return { percent, color: '#EF4444', dark: '#B91C1C', label: 'เต็มแล้ว', status: 'full', pulse: false };
    }
    if (percent >= 50) {
        return { percent, color: '#F59E0B', dark: '#D97706', label: 'ใกล้เต็ม', status: 'warning', pulse: true };
    }
    return { percent, color: '#2FBF83', dark: '#1E9464', label: 'ว่าง', status: 'available', pulse: true };
}

function evacIcon(uid, currentOccupancy, capacity, isActive) {
    const { color: base, dark, pulse } = getShelterStatus(currentOccupancy, capacity);

    return L.divIcon({
        className: 'evac-pin',
        html: `
      <div style="position:relative;width:36px;height:36px; transition: transform 0.2s; ${isActive ? 'transform: scale(1.2); z-index: 1000;' : ''}">
        ${pulse || isActive ? `<span class="evac-pulse" style="background:${base};${isActive ? 'opacity:0.6; animation:pin-pulse 1.5s ease-out infinite;' : ''}"></span>` : ''}
        <svg width="36" height="36" viewBox="0 0 36 36" style="position:relative;z-index:1;filter:drop-shadow(0 3px 5px rgba(8,34,44,0.4))">
          <defs>
            <linearGradient id="evac-grad-${uid}" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stop-color="${base}" />
              <stop offset="1" stop-color="${dark}" />
            </linearGradient>
          </defs>
          <circle cx="18" cy="18" r="15" fill="url(#evac-grad-${uid})" stroke="#F3F8F7" stroke-width="3"/>
          <path d="M11 17.5L18 11.5L25 17.5" stroke="#F3F8F7" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M13 16.5V24a1 1 0 001 1h3v-4.6h2V25h3a1 1 0 001-1v-7.5" stroke="#F3F8F7" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
    });
}

function parkingIcon(uid, isActive) {
    const bgColor = isActive ? '#FF6B4A' : '#3B82F6';
    return L.divIcon({
        className: 'parking-pin',
        html: `
      <div style="position:relative;width:32px;height:32px; transition: transform 0.2s; ${isActive ? 'transform: scale(1.2); z-index: 1000;' : ''}">
        ${isActive ? `<span style="position:absolute; inset:-4px; border-radius:50%; background:${bgColor}; opacity:0.6; animation:pin-pulse 1.5s ease-out infinite"></span>` : ''}
        <svg width="32" height="32" viewBox="0 0 32 32" style="position:relative;z-index:1;filter:drop-shadow(0 3px 5px rgba(8,34,44,0.4))">
          <circle cx="16" cy="16" r="14" fill="${bgColor}" stroke="#F3F8F7" stroke-width="2.5"/>
          <path d="M12 9h4.5c2.5 0 4.5 1.5 4.5 4s-2 4-4.5 4h-2.5v5h-2v-13zm2 6h2.5c1.5 0 2.5-.8 2.5-2s-1-2-2.5-2h-2.5v4z" fill="#F3F8F7"/>
        </svg>
      </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
    });
}

function FitOnData({ points }) {
    const map = useMap();
    useEffect(() => {
        if (!points.length) return;
        const validPoints = points.filter((p) => p.latitude && p.longitude);
        if (!validPoints.length) return;
        const bounds = L.latLngBounds(validPoints.map((p) => [p.latitude, p.longitude]));
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
    }, [points, map]);
    return null;
}

function FlyToSelected({ selectedKey, items }) {
    const map = useMap();
    useEffect(() => {
        if (!selectedKey) return;
        const target = items.find((i) => i.key === selectedKey);
        if (target && target.lat != null && target.lng != null) {
            map.flyTo([target.lat, target.lng], 16, { animate: true, duration: 1.2 });
        }
    }, [selectedKey, items, map]);
    return null;
}

export default function FloodMap({ isSimulating }) {
    const [data, setData] = useState({ floodPoints: [], evacuationCenters: [], parkingSpots: [] });
    const [activePoint, setActivePoint] = useState(null);
    const [activeEvac, setActiveEvac] = useState(null);
    const extras = useMapExtras();
    const [selectedKey, setSelectedKey] = useState(null);

    // สถานะโหมด "จำลองสถานการณ์" (ข้อมูลน้ำท่วม 1 วันสีแดง)
    const [simStatus, setSimStatus] = useState(null);

    // ชั้นข้อมูล GISTDA สีน้ำเงิน: เปิด-ปิด และสถานะการโหลดของแต่ละชั้น
    const [gistdaOn, setGistdaOn] = useState({});
    const [gistdaStatus, setGistdaStatus] = useState({});
    const toggleGistda = useCallback((id) => setGistdaOn((p) => ({ ...p, [id]: !p[id] })), []);
    const handleGistdaStatus = useCallback((id, s) => setGistdaStatus((p) => ({ ...p, [id]: s })), []);

    useEffect(() => {
        fetch('/api/map-data')
            .then((res) => res.json())
            .then((json) => setData((prev) => ({ ...prev, ...json })))
            .catch((err) => console.error('โหลดข้อมูลแผนที่ไม่สำเร็จ:', err));

        fetch('/api/parking')
            .then((res) => res.json())
            .then((json) => setData((prev) => ({ ...prev, parkingSpots: json.spots || [] })))
            .catch((err) => console.error('โหลดข้อมูลที่จอดรถไม่สำเร็จ:', err));
    }, []);

    const { floodPoints = [], evacuationCenters = [], parkingSpots = [] } = data;

    // memo ไว้ เพื่อให้ FitOnData ไม่ fitBounds ซ้ำทุกครั้งที่ state อื่นเปลี่ยน
    const validParkingSpots = useMemo(
        () => parkingSpots.filter((p) => p.latitude && p.longitude && Number(p.latitude) !== 0),
        [parkingSpots]
    );
    const validEvacCenters = useMemo(
        () => evacuationCenters.filter((c) => c.latitude && c.longitude && Number(c.latitude) !== 0),
        [evacuationCenters]
    );
    const fitPoints = useMemo(
        () => [...floodPoints, ...validEvacCenters, ...validParkingSpots],
        [floodPoints, validEvacCenters, validParkingSpots]
    );

    return (
        <>
            <MapContainer center={HAT_YAI_CENTER} zoom={13} zoomControl={false} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    className="dark-tiles"
                />

                <FitOnData points={fitPoints} />
                <FlyToSelected selectedKey={selectedKey} items={extras.visible} />

                {/* ชั้นข้อมูล GISTDA สีน้ำเงิน (วางก่อน เพื่อให้สีแดงของโหมดจำลองซ้อนอยู่ด้านบน) */}
                <GistdaOverlays enabled={gistdaOn} onStatus={handleGistdaStatus} />

                {/* โหมดจำลอง: น้ำท่วม 1 วันจาก GISTDA (สีแดง) + วงน้ำกระเพื่อมของจุดที่ผู้ใช้แจ้ง */}
                <FloodAreaLayer points={floodPoints} isSimulating={isSimulating} onStatusChange={setSimStatus} />

                {/* หมุดจุดน้ำท่วม */}
                {floodPoints.map((p) => {
                    const depth = Number(p.water_level_meters) || 0;
                    const color = depthColor(depth);
                    return (
                        <Marker
                            key={`flood-${p.id}`}
                            position={[p.latitude, p.longitude]}
                            icon={pinIcon(color, p.id, depth >= 3)}
                            eventHandlers={{ click: () => setActivePoint(p) }}
                        >
                            <Tooltip direction="top" offset={[0, -38]}>
                                {p.location_name} · {depth.toFixed(2)} ม.
                                {p.report_count > 1 ? ` · ${p.report_count} รายงาน` : ''}
                            </Tooltip>
                        </Marker>
                    );
                })}

                {/* หมุดศูนย์อพยพ / ศูนย์พักพิง */}
                {validEvacCenters.map((c) => {
                    const currentOccupancy = Number(c.current_occupancy) || 0;
                    const capacity = Number(c.capacity) || 0;
                    const available = Math.max(0, capacity - currentOccupancy);
                    const shelterStatus = getShelterStatus(currentOccupancy, capacity);

                    const itemKey = `shelter-${c.id}`;
                    const isActive = selectedKey === itemKey;

                    return (
                        <Marker
                            key={itemKey}
                            position={[c.latitude, c.longitude]}
                            icon={evacIcon(c.id, currentOccupancy, capacity, isActive)}
                            eventHandlers={{
                                click: () => {
                                    setSelectedKey(isActive ? null : itemKey);
                                    setActiveEvac(c);
                                },
                            }}
                        >
                            <Tooltip direction="top" offset={[0, -20]} permanent={isActive}>
                                {c.name} · {shelterStatus.label} ({shelterStatus.percent}%) {available > 0 ? `(ว่าง ${available} ที่)` : ''}
                            </Tooltip>
                        </Marker>
                    );
                })}

                {/* หมุดที่จอดรถ */}
                {validParkingSpots.map((p) => {
                    const itemKey = `parking-${p.id}`;
                    const isActive = selectedKey === itemKey;

                    return (
                        <Marker
                            key={itemKey}
                            position={[p.latitude, p.longitude]}
                            icon={parkingIcon(p.id, isActive)}
                            eventHandlers={{ click: () => setSelectedKey(isActive ? null : itemKey) }}
                        >
                            <Tooltip direction="top" offset={[0, -15]} permanent={isActive}>
                                {p.name}
                            </Tooltip>
                        </Marker>
                    );
                })}
            </MapContainer>

            {/* มุมซ้ายบน: ตัวเลือกชั้นข้อมูล GISTDA + ป้ายสถานะโหมดจำลอง */}
            <div className="absolute z-[1000] left-4 top-4 flex flex-col items-start gap-3">
                <GistdaLayerControl enabled={gistdaOn} status={gistdaStatus} onToggle={toggleGistda} />
                {isSimulating && <SimStatusBadge status={simStatus} />}
            </div>

            <FloodPointModal point={activePoint} open={!!activePoint} onClose={() => setActivePoint(null)} />
            <ProximityAlert floodPoints={floodPoints} />
            <MapSidePanel
                items={extras.visible}
                filters={extras.filters}
                onToggle={extras.toggle}
                selectedKey={selectedKey}
                onSelect={setSelectedKey}
                onLocate={extras.locate}
                locating={extras.locating}
                geoError={extras.geoError}
                located={!!extras.me}
            />

            {/* Modal รายละเอียดศูนย์อพยพเมื่อคลิกหมุด */}
            <Modal
                isOpen={!!activeEvac}
                onClose={() => setActiveEvac(null)}
                placement="center"
                backdrop="blur"
                classNames={{
                    wrapper: 'z-[99999]',
                    backdrop: 'z-[99998]',
                    base: "font-['Noto_Sans_Thai'] bg-[#F3F8F7]",
                    header: 'border-b border-[#08222C]/10',
                    footer: 'border-t border-[#08222C]/10',
                    closeButton: 'hover:bg-[#08222C]/5 active:bg-[#08222C]/10',
                }}
            >
                <ModalContent>
                    {(onClose) => {
                        if (!activeEvac) return null;
                        const currentOccupancy = Number(activeEvac.current_occupancy) || 0;
                        const capacity = Number(activeEvac.capacity) || 0;
                        const available = Math.max(0, capacity - currentOccupancy);
                        const status = getShelterStatus(currentOccupancy, capacity);

                        return (
                            <>
                                <ModalHeader className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2 text-[#1C6E8C]">
                                        <Tent size={20} />
                                        <span className="text-sm font-medium">ข้อมูลศูนย์อพยพ</span>
                                    </div>
                                </ModalHeader>
                                <ModalBody className="py-6">
                                    <div className="flex justify-between items-start gap-4">
                                        <h2 className="text-xl font-semibold text-[#08222C] leading-tight">
                                            {activeEvac.name}
                                        </h2>
                                        {status.status === 'full' ? (
                                            <Chip size="sm" className="bg-red-100 text-red-600 font-medium border border-red-200" startContent={<AlertTriangle size={13} className="ml-1.5" />}>
                                                เต็มแล้ว ({status.percent}%)
                                            </Chip>
                                        ) : status.status === 'warning' ? (
                                            <Chip size="sm" className="bg-amber-100 text-amber-700 font-medium border border-amber-300" startContent={<AlertTriangle size={13} className="ml-1.5" />}>
                                                ใกล้เต็ม ({status.percent}%)
                                            </Chip>
                                        ) : (
                                            <Chip size="sm" className="bg-[#2FBF83]/15 text-[#2FBF83] font-medium border border-[#2FBF83]/30" startContent={<CheckCircle2 size={13} className="ml-1.5" />}>
                                                ว่าง {available} ที่ ({status.percent}%)
                                            </Chip>
                                        )}
                                    </div>

                                    <div className="bg-white rounded-xl p-4 border border-[#08222C]/10 mt-2 shadow-sm">
                                        <div className="flex justify-between text-sm mb-3">
                                            <div className="flex items-center gap-1.5 text-[#08222C]/60">
                                                <Users size={16} />
                                                <span>จำนวนผู้เข้าพัก</span>
                                            </div>
                                            <span className="font-semibold text-[#08222C]">
                                                <span style={{ color: status.color }}>{currentOccupancy}</span> / {capacity} คน
                                            </span>
                                        </div>
                                        <Progress
                                            size="sm"
                                            radius="full"
                                            classNames={{
                                                track: 'bg-[#08222C]/5',
                                                indicator: status.status === 'full' ? 'bg-red-500' : status.status === 'warning' ? 'bg-amber-500' : 'bg-[#2FBF83]',
                                            }}
                                            value={Math.min(status.percent, 100)}
                                        />
                                    </div>
                                </ModalBody>
                                <ModalFooter>
                                    <Button variant="light" onPress={onClose} className="text-[#08222C]/60 font-medium">
                                        ปิด
                                    </Button>
                                    <Button
                                        className="bg-[#FF6B4A] text-[#08222C] font-medium shadow-md shadow-[#FF6B4A]/30"
                                        startContent={<Navigation size={16} />}
                                        onPress={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${activeEvac.latitude},${activeEvac.longitude}&travelmode=driving`, '_blank')}
                                    >
                                        นำทางไปที่นี่
                                    </Button>
                                </ModalFooter>
                            </>
                        );
                    }}
                </ModalContent>
            </Modal>

            <style jsx global>{`
                .pin-pulse { position: absolute; inset: 0 0 10px 0; border-radius: 50%; opacity: 0.45; animation: pin-pulse 1.8s ease-out infinite; }
                .pin-bob svg { animation: pin-bob 3s ease-in-out infinite; transition: transform 0.15s ease; }
                .pin-bob:hover svg { transform: scale(1.1); }
                
                .evac-pulse { position: absolute; inset: 2px; border-radius: 50%; opacity: 0.4; animation: evac-pulse 2.2s ease-out infinite; }
                .evac-pin svg { transition: transform 0.15s ease; }
                .evac-pin:hover svg { transform: scale(1.12); }
                
                .parking-pin svg { transition: transform 0.15s ease; }
                .parking-pin:hover svg { transform: scale(1.12); }
                
                @media (prefers-reduced-motion: reduce) { .pin-pulse, .pin-bob svg, .evac-pulse, .parking-pin svg { animation: none; } }
                @keyframes pin-pulse { 0% { transform: scale(0.6); opacity: 0.5; } 100% { transform: scale(1.6); opacity: 0; } }
                @keyframes evac-pulse { 0% { transform: scale(0.7); opacity: 0.45; } 100% { transform: scale(1.5); opacity: 0; } }
                @keyframes pin-bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
                
                .leaflet-container { background: #08222c; font-family: 'Noto Sans Thai', sans-serif; }
                .leaflet-tooltip { background: #0e3f52; color: #f3f8f7; border: 1px solid rgba(255, 255, 255, 0.15); font-size: 11px; border-radius: 6px; padding: 4px 8px; }
                .dark-tiles { filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%); }
                .leaflet-marker-pane, .leaflet-tooltip-pane, .leaflet-popup-pane { filter: none; }
            `}</style>
        </>
    );
}