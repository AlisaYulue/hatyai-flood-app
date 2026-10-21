// แผงรายละเอียดทางขวา (เดสก์ท็อป) / แผงเลื่อนด้านล่าง (มือถือ) — ธีมมืดให้เข้ากับเว็บ
// จุดฝากรถ & ศูนย์พักพิง (แยกขอความช่วยเหลือออกไปหน้าเฉพาะ)
import { memo, useEffect, useState } from 'react';
import { Navigation, ExternalLink, Locate, ChevronDown, ChevronUp, Users, Tent, Car, AlertTriangle } from 'lucide-react';

const PARKING_COLOR = '#1C6E8C';
const SHELTER_COLOR = '#2FBF83';

const hasCoords = (i) => i.lat != null && i.lng != null;

const navUrl = (i) =>
    hasCoords(i)
        ? `https://www.google.com/maps/dir/?api=1&destination=${i.lat},${i.lng}&travelmode=driving`
        : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(i.title + ' หาดใหญ่')}`;

const mapsUrl = (i) =>
    hasCoords(i)
        ? `https://www.google.com/maps/search/?api=1&query=${i.lat},${i.lng}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(i.title + ' หาดใหญ่')}`;

// สีแถบความจุ: ปกติ → ใกล้เต็ม → เต็ม
const occupancyTone = (ratio) =>
    ratio >= 1
        ? { bar: 'bg-rose-400', text: 'text-rose-400' }
        : ratio >= 0.8
            ? { bar: 'bg-amber-400', text: 'text-amber-300' }
            : { bar: 'bg-teal-300', text: 'text-teal-300' };

function Chip({ on, color, icon: Icon, children, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={on}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium px-3.5 py-1.5 rounded-full border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B4A]/70"
            style={
                on
                    ? { background: color, borderColor: color, color: '#F3F8F7' }
                    : { borderColor: 'rgba(243,248,247,0.2)', color: 'rgba(243,248,247,0.6)', background: 'transparent' }
            }
        >
            {Icon && <Icon size={13} className={on ? 'text-white' : 'text-[#F3F8F7]/60'} />}
            {children}
        </button>
    );
}

const Card = memo(function Card({ item, selected, onSelect }) {
    const isShelter = item.kind === 'shelter' || item.kind === 'evacuation';
    const r = item.raw || {};

    const capacity = Number(r.capacity) || 0;
    const occupancy = Number(r.current_occupancy) || 0;
    const ratio = capacity > 0 ? occupancy / capacity : 0;
    const isFull = capacity > 0 && occupancy >= capacity;
    const tone = occupancyTone(ratio);

    const select = () => onSelect(item.key);

    return (
        <div
            id={`card-${item.key}`}
            role="button"
            tabIndex={0}
            aria-pressed={selected}
            onClick={select}
            onKeyDown={(e) => {
                if (e.target !== e.currentTarget) return; // ไม่แย่งปุ่มลิงก์ด้านใน
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    select();
                }
            }}
            className={`rounded-xl border p-3.5 cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B4A]/70 ${selected
                ? 'border-[#FF6B4A]/70 bg-white/[0.08]'
                : 'border-white/10 bg-white/5 hover:bg-white/[0.07]'
                }`}
        >
            {/* แท็กประเภท + สถานะ + ระยะทาง */}
            <div className="flex items-center gap-2 flex-wrap">
                <span
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-[#F3F8F7] px-2 py-0.5 rounded-full"
                    style={{ background: isShelter ? SHELTER_COLOR : PARKING_COLOR }}
                >
                    {isShelter ? <Tent size={11} /> : <Car size={11} />}
                    {isShelter ? 'ศูนย์พักพิง' : 'จุดฝากรถ'}
                </span>

                {isShelter && isFull && (
                    <span className="text-[11px] font-medium text-rose-400 bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                        <AlertTriangle size={10} /> เต็มแล้ว
                    </span>
                )}

                {item.km != null && (
                    <span className="text-[11px] text-[#F3F8F7]/45 ml-auto tabular-nums">
                        ห่าง {item.km.toFixed(1)} กม.
                    </span>
                )}
            </div>

            {/* ชื่อและรายละเอียด */}
            <p className="mt-1.5 text-[15px] font-semibold text-[#F3F8F7] leading-snug">{item.title}</p>
            {item.subtitle && <p className="text-xs text-[#F3F8F7]/55 mt-0.5">{item.subtitle}</p>}

            {/* ความจุศูนย์พักพิง พร้อมแถบสถานะ */}
            {isShelter && capacity > 0 && (
                <div className="mt-2 bg-black/20 border border-white/5 rounded-lg px-2.5 py-2">
                    <div className="flex items-center justify-between text-xs">
                        <span className="inline-flex items-center gap-1 text-[#F3F8F7]/60">
                            <Users size={12} /> ผู้พักพิงปัจจุบัน
                        </span>
                        <span className={`font-semibold tabular-nums ${tone.text}`}>
                            {occupancy} <span className="font-normal text-[#F3F8F7]/50">/ {capacity} คน</span>
                        </span>
                    </div>
                    <div
                        className="mt-1.5 h-1 rounded-full bg-white/10 overflow-hidden"
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={capacity}
                        aria-valuenow={Math.min(occupancy, capacity)}
                        aria-label="ความจุศูนย์พักพิง"
                    >
                        <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${Math.min(ratio, 1) * 100}%` }} />
                    </div>
                </div>
            )}

            {/* หมายเหตุ (แสดงเมื่อเลือก) */}
            {selected && item.note && (
                <p className="mt-2 text-[11px] leading-relaxed text-[#F3F8F7]/70 bg-[#FF6B4A]/10 border border-[#FF6B4A]/25 rounded-lg px-2.5 py-2">
                    {item.note}
                </p>
            )}

            {!hasCoords(item) && (
                <p className="mt-1.5 text-[11px] text-[#F3F8F7]/40">
                    ยังไม่มีพิกัดบนแผนที่ — กดปุ่มด้านล่างเพื่อค้นหาใน Google Maps
                </p>
            )}

            {/* ปุ่มนำทาง / Google Maps */}
            <div className="mt-3 flex items-center gap-2">
                <a
                    href={navUrl(item)}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 bg-[#FF6B4A] text-[#08222C] text-sm font-medium px-4 py-1.5 rounded-full hover:bg-[#ff805f] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                >
                    <Navigation size={14} /> นำทาง
                </a>
                <a
                    href={mapsUrl(item)}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 border border-white/20 text-[#F3F8F7]/85 text-sm font-medium px-4 py-1.5 rounded-full hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                >
                    Google Maps <ExternalLink size={13} />
                </a>
            </div>
        </div>
    );
});

export default function MapSidePanel({
    items = [],
    filters = { parking: true, shelter: true },
    onToggle,
    selectedKey,
    onSelect,
    onLocate,
    locating,
    geoError,
    located,
}) {
    const [open, setOpen] = useState(true); // เปิด-ปิดบนมือถือ

    useEffect(() => {
        if (!selectedKey) return;
        setOpen(true);
        const t = setTimeout(
            () => document.getElementById(`card-${selectedKey}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }),
            50
        );
        return () => clearTimeout(t);
    }, [selectedKey]);

    return (
        <aside
            aria-label="รายการจุดฝากรถและศูนย์พักพิง"
            className="absolute z-[1000] flex flex-col bg-[#08222C]/90 backdrop-blur-md border border-white/10 shadow-2xl shadow-black/40 font-['Noto_Sans_Thai']
                       inset-x-0 bottom-0 max-h-[46%] rounded-t-2xl pb-[env(safe-area-inset-bottom)]
                       md:inset-x-auto md:right-4 md:top-4 md:bottom-4 md:w-[360px] md:max-h-none md:rounded-2xl md:pb-0"
        >
            {/* ปุ่มย่อ/ขยายบนมือถือ — พื้นที่แตะกว้างเต็มแถบ */}
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                className="md:hidden flex items-center justify-center py-2 text-[#F3F8F7]/50 active:text-[#F3F8F7]/80"
                aria-label={open ? 'ย่อรายการ' : 'ขยายรายการ'}
            >
                {open ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
            </button>

            {/* ส่วนหัวและตัวกรอง */}
            <div className="px-4 pt-1 md:pt-4 pb-3 border-b border-white/10 shrink-0">
                <div className="flex items-baseline justify-between gap-2">
                    <p className="font-['Kanit'] font-semibold text-[#F3F8F7]">จุดฝากรถ · ศูนย์พักพิง</p>
                    <p className="text-[11px] text-[#F3F8F7]/45 tabular-nums" aria-live="polite">
                        {items.length} แห่ง
                    </p>
                </div>
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <Chip on={filters.parking} color={PARKING_COLOR} icon={Car} onClick={() => onToggle('parking')}>
                        จุดฝากรถ
                    </Chip>
                    <Chip on={filters.shelter} color={SHELTER_COLOR} icon={Tent} onClick={() => onToggle('shelter')}>
                        ศูนย์พักพิง
                    </Chip>
                    <button
                        type="button"
                        onClick={onLocate}
                        disabled={locating}
                        className="ml-auto inline-flex items-center gap-1 text-xs sm:text-sm px-3 py-1.5 rounded-full border border-white/20 text-[#F3F8F7]/80 hover:bg-white/10 disabled:opacity-60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B4A]/70"
                    >
                        <Locate size={14} className={locating ? 'animate-pulse' : ''} />
                        {locating ? 'กำลังหา...' : located ? 'อัปเดตตำแหน่ง' : 'ใกล้ฉัน'}
                    </button>
                </div>
                {geoError && (
                    <p role="alert" className="mt-1.5 text-xs text-[#FF6B4A]">
                        {geoError}
                    </p>
                )}
            </div>

            {/* รายการการ์ด */}
            <div
                className={`${open ? 'flex' : 'hidden md:flex'} flex-col gap-2.5 p-3 overflow-y-auto overscroll-contain flex-1 min-h-0 scrollbar-thin scrollbar-thumb-teal-900/60`}
            >
                {items.length === 0 && (
                    <p className="py-8 text-center text-sm text-[#F3F8F7]/40">
                        ไม่มีรายการที่ตรงกับตัวกรอง — ลองเปิดตัวกรองด้านบนอีกครั้ง
                    </p>
                )}
                {items.map((i) => (
                    <Card key={i.key} item={i} selected={i.key === selectedKey} onSelect={onSelect} />
                ))}
            </div>
        </aside>
    );
}