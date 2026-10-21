// pop-up หมุดในหน้าขอความช่วยเหลือ
// component/HelpMap.jsx
// แผนที่ตัวเดียวแทน HelpMapOnly + HelpPickMap
//  - แสดงหมุดผู้ขอความช่วยเหลือทั้งหมด แตะหมุดแล้วมี popup เด้งที่หมุด (การ์ดสไตล์ infographic ขนาดกะทัดรัด)
//  - ถ้า picking = true: แตะแผนที่เพื่อปักหมุด และลากหมุดเพื่อปรับตำแหน่งได้
import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Megaphone, Navigation, Phone, Users } from 'lucide-react';
import { HELP_TYPES, URGENCY } from './help-meta';

const HAT_YAI_CENTER = [7.0049, 100.4736];

// ระดับน้ำ (ค่า key ต้องตรงกับที่ฟอร์มส่งมาในฟิลด์ water_level)
// fill = ความสูงของแท่งไอคอน (%)
const WATER_LEVEL_META = {
    ankle: { label: 'ข้อเท้า', hint: 'ประมาณ 20 ซม.', fill: 12, color: '#2B9CC4' },
    knee: { label: 'หัวเข่า', hint: 'ประมาณ 50 ซม.', fill: 32, color: '#2B9CC4' },
    waist: { label: 'เอว', hint: 'ประมาณ 1 เมตร', fill: 55, color: '#D9961A' },
    chest: { label: 'หน้าอก', hint: 'ประมาณ 1.3 เมตร', fill: 76, color: '#EE7A2E' },
    over_head: { label: 'ท่วมหัว', hint: 'สูงกว่า 1.7 เมตร / ชั้น 2 ขึ้นไป', fill: 100, color: '#E5484D' },
};

// เบลอเบอร์เสมอ (สำรองไว้ ถ้า API ยังไม่ส่ง phone_masked) เช่น 080***456*
const maskPhone = (phone) => {
    if (!phone) return 'ไม่ระบุ';
    const p = String(phone).replace(/\D/g, '');
    if (p.length < 9) return '***';
    const head = p.length >= 10 ? 3 : 2;
    return `${p.slice(0, head)}***${p.slice(head + 3, head + 6)}*`;
};

function requestIcon(color, pulse) {
    return L.divIcon({
        className: '',
        html: `<div class="help-dot" style="--c:${color}">${pulse ? '<span class="help-ring"></span>' : ''}<span class="help-core"></span></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -16],
    });
}

function pickIcon() {
    return L.divIcon({
        className: 'pick-pin',
        html: `
      <svg width="40" height="52" viewBox="0 0 34 44" style="filter:drop-shadow(0 4px 5px rgba(0,0,0,0.45))">
        <path d="M17 0C7.6 0 0 7.6 0 17c0 12 17 27 17 27s17-15 17-27C34 7.6 26.4 0 17 0z" fill="#FF6B4A"/>
        <circle cx="17" cy="17" r="6" fill="#F3F8F7"/>
      </svg>`,
        iconSize: [40, 52],
        iconAnchor: [20, 52],
    });
}

function MapController({ picking, position, onPick }) {
    const map = useMap();

    useMapEvents({
        click: (e) => {
            if (picking) onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
        },
    });

    // เข้าโหมดปักหมุดแล้วปิด popup ที่ค้างอยู่
    useEffect(() => {
        if (picking) map.closePopup();
    }, [picking, map]);

    // บินไปยังตำแหน่งเมื่อมาจาก GPS / ค้นหาที่อยู่ (position.fly = true)
    useEffect(() => {
        if (position?.fly) {
            map.flyTo([position.lat, position.lng], Math.max(map.getZoom(), 16), { duration: 0.8 });
        }
    }, [position, map]);

    return null;
}

function RequestCard({ r, u }) {
    const color = u.color || '#FF6B4A';
    const hasCoords = r.latitude != null && r.longitude != null;
    const water = WATER_LEVEL_META[r.water_level];
    return (
        <div className="pcard" style={{ '--c': color }}>
            {/* หัวข้อหลัก */}
            <div className="flex items-center gap-2.5 pr-5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#EF5350]/10 text-[#EF5350]">
                    <Megaphone size={17} />
                </span>
                <div className="font-['Kanit'] text-[15px] font-semibold leading-tight text-[#1E2B3A]">
                    <span className="text-[#EF5350]">ติดต่อ</span>ผู้ต้องการช่วยออกมา
                </div>
            </div>

            <div className="my-3 h-px bg-[#1E2B3A]/[0.08]" />

            {/* ระดับความเร่งด่วน + ประเภท */}
            <div className="flex items-center gap-1.5 text-[12px] text-[#6B7785]">
                <span className="h-2 w-2 rounded-full" style={{ background: color }} />
                <b className="font-medium" style={{ color }}>{u.label}</b>
                <span>·</span>
                <span>{HELP_TYPES[r.help_type] || r.help_type}</span>
            </div>

            {/* สถานที่ */}
            <div className="pclamp2 mt-1 font-['Kanit'] text-[16px] font-medium leading-snug text-[#1E2B3A]">
                {r.location_name}
            </div>

            {/* ระดับน้ำ */}
            {water && (
                <div
                    className="mt-2 flex items-center gap-2.5 rounded-xl px-3 py-2"
                    style={{ background: `${water.color}14`, border: `1px solid ${water.color}40` }}
                >
                    <span className="relative block h-8 w-4 shrink-0 overflow-hidden rounded-[4px] border border-[#1E2B3A]/15 bg-white">
                        <span
                            className="absolute inset-x-0 bottom-0 block"
                            style={{ height: `${water.fill}%`, background: water.color }}
                        />
                    </span>
                    <span className="leading-tight">
                        <b className="block text-[13px] font-semibold" style={{ color: water.color }}>
                            น้ำระดับ{water.label}
                        </b>
                        <span className="block text-[11px] text-[#6B7785]">{water.hint}</span>
                    </span>
                </div>
            )}

            {/* จำนวนคน / กลุ่มเปราะบาง */}
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[12px]">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#F2F5F7] px-2.5 py-1 text-[#4B5663]">
                    <Users size={13} /> {r.people_count} คน
                </span>
                {/* !! กันค่า 0 จากฐานข้อมูลถูก render เป็นเลข 0 */}
                {!!Number(r.has_vulnerable) && (
                    <span className="inline-flex items-center rounded-full bg-[#E5484D]/10 px-2.5 py-1 font-medium text-[#E5484D]">
                        มีกลุ่มเปราะบาง
                    </span>
                )}
            </div>

            {r.details && (
                <div className="pclamp3 mt-2 text-[13px] leading-snug text-[#6B7785]">{r.details}</div>
            )}

            {/* เบอร์โทร (เบลอเสมอ) */}
            <div className="mt-3 flex items-center gap-2.5 rounded-xl bg-[#F2F5F7] px-3 py-2.5">
                <Phone size={16} className="shrink-0 text-[#243648]" />
                <span className="text-[11px] text-[#6B7785]">โทร</span>
                <span className="font-['JetBrains_Mono'] text-[15px] font-semibold tracking-wider text-[#1E2B3A]">
                    {r.phone_masked || maskPhone(r.phone)}
                </span>
            </div>

            {hasCoords && (
                <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${r.latitude},${r.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 flex h-10 items-center justify-center gap-2 rounded-xl bg-[#1E2B3A] text-sm font-medium !text-white active:opacity-90 transition-opacity"
                >
                    <Navigation size={16} /> นำทางไปจุดนี้
                </a>
            )}
        </div>
    );
}

export default function HelpMap({ requests = [], picking = false, position = null, onPick = () => { } }) {
    return (
        <>
            <MapContainer
                center={HAT_YAI_CENTER}
                zoom={13}
                zoomControl={false}
                className={picking ? 'is-picking' : ''}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    className="dark-tiles"
                />
                <ZoomControl position="bottomright" />
                <MapController picking={picking} position={position} onPick={onPick} />

                {requests.map((r) => {
                    const u = URGENCY[r.urgency] || { label: r.urgency, color: '#FF6B4A' };
                    const urgent = ['critical', 'urgent', 'high'].includes(r.urgency);
                    return (
                        <Marker
                            key={`help-${r.id}`}
                            position={[Number(r.latitude), Number(r.longitude)]}
                            icon={requestIcon(u.color, urgent)}
                        >
                            {!picking && (
                                <Popup
                                    className="help-popup"
                                    minWidth={240}
                                    maxWidth={300}
                                    autoPanPaddingTopLeft={[16, 72]}
                                    autoPanPaddingBottomRight={[16, 110]}
                                >
                                    <RequestCard r={r} u={u} />
                                </Popup>
                            )}
                        </Marker>
                    );
                })}

                {position && (
                    <Marker
                        position={[position.lat, position.lng]}
                        icon={pickIcon()}
                        draggable={picking}
                        zIndexOffset={1000}
                        eventHandlers={{
                            dragend: (e) => {
                                const { lat, lng } = e.target.getLatLng();
                                onPick({ lat, lng });
                            },
                        }}
                    />
                )}
            </MapContainer>

            <style jsx global>{`
                .leaflet-container {
                    background: #08222c;
                    font-family: 'Noto Sans Thai', sans-serif;
                }
                /* ทำ tile ของ OSM ให้เป็นโทนมืด โดยไม่ต้องใช้ API key */
                .dark-tiles {
                    filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
                }
                .leaflet-marker-pane,
                .leaflet-tooltip-pane,
                .leaflet-popup-pane {
                    filter: none;
                }
                .is-picking {
                    cursor: crosshair;
                }
                /* บนมือถือใช้ pinch-zoom แทนปุ่ม +/- */
                @media (max-width: 767px) {
                    .leaflet-control-zoom {
                        display: none;
                    }
                }

                /* ---------- หมุดผู้ขอความช่วยเหลือ ---------- */
                .help-dot {
                    position: relative;
                    width: 28px;
                    height: 28px;
                    cursor: pointer;
                }
                .help-core {
                    position: absolute;
                    inset: 5px;
                    border-radius: 50%;
                    background: var(--c);
                    border: 3px solid #f3f8f7;
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.45);
                }
                .help-ring {
                    position: absolute;
                    inset: 0;
                    border-radius: 50%;
                    background: var(--c);
                    opacity: 0.5;
                    animation: help-ring 1.8s ease-out infinite;
                }
                @keyframes help-ring {
                    0% { transform: scale(0.5); opacity: 0.55; }
                    100% { transform: scale(1.7); opacity: 0; }
                }

                /* ---------- Popup: ลอกกรอบเดิมของ Leaflet ออก ให้การ์ดของเราเป็นตัวหลัก ---------- */
                .help-popup .leaflet-popup-content-wrapper {
                    background: transparent;
                    box-shadow: none;
                    padding: 0;
                    border-radius: 18px;
                }
                .help-popup .leaflet-popup-content {
                    margin: 0;
                    width: min(270px, calc(100vw - 56px)) !important;
                    font-size: 13px;
                    line-height: 1.3;
                }
                .help-popup .leaflet-popup-tip-container { margin-top: -1px; }
                .help-popup .leaflet-popup-tip {
                    background: #fff;
                    box-shadow: none;
                }
                .help-popup a.leaflet-popup-close-button {
                    top: 8px;
                    right: 8px;
                    width: 26px;
                    height: 26px;
                    padding: 0;
                    border-radius: 50%;
                    background: #f2f5f7;
                    color: #6b7785;
                    font: 18px/25px sans-serif;
                    text-align: center;
                    z-index: 5;
                }
                .help-popup a.leaflet-popup-close-button:hover { background: #e6ebef; color: #1e2b3a; }

                .pcard {
                    padding: 14px;
                    border-radius: 18px;
                    background: #fff;
                    color: #1e2b3a;
                    /* เส้นสีบางๆ ด้านบนบอกระดับความเร่งด่วน */
                    box-shadow: inset 0 3px 0 var(--c), 0 10px 30px rgba(0, 0, 0, 0.28);
                    transform-origin: 50% 100%;
                    animation: pcard-in 0.2s ease-out;
                }
                .pclamp2, .pclamp3 { display: -webkit-box; -webkit-box-orient: vertical; overflow: hidden; }
                .pclamp2 { -webkit-line-clamp: 2; }
                .pclamp3 { -webkit-line-clamp: 3; }

                @keyframes pcard-in {
                    from { transform: translateY(6px) scale(0.96); opacity: 0; }
                    to { transform: translateY(0) scale(1); opacity: 1; }
                }

                @media (prefers-reduced-motion: reduce) {
                    .help-ring { animation: none; opacity: 0.25; }
                    .pcard { animation: none; }
                }
            `}</style>
        </>
    );
}