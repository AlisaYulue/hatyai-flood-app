// component/FloodPointModal.jsx
import { useState, useEffect } from 'react';
import Modal from './Modal';
import WaterGauge from './WaterGauge';
import { depthColor } from './depthColor';
import { AlertTriangle, ShieldAlert, CheckCircle2, Navigation } from 'lucide-react';

const RISK_LABEL = {
    critical: 'วิกฤต',
    warning: 'เฝ้าระวัง',
    normal: 'ปกติ',
};

const RISK_ICON = {
    critical: AlertTriangle,
    warning: ShieldAlert,
    normal: CheckCircle2,
};

function riskKey(risk_level) {
    const v = (risk_level || '').toLowerCase();
    if (v.includes('critical')) return 'critical';
    if (v.includes('warn')) return 'warning';
    return 'normal';
}

const REFERENCES = [
    { m: 0.3, label: 'ข้อเท้า' },
    { m: 0.5, label: 'หัวเข่า' },
    { m: 0.9, label: 'เอว' },
    { m: 1.3, label: 'อก' },
    { m: 1.7, label: 'มิดศีรษะ' },
];

export default function FloodPointModal({ point, open, onClose }) {
    // 1. ประกาศ State ไว้บนสุดเสมอ (ห้ามมี if return คั่นก่อนหน้า)
    const [depth, setDepth] = useState(0);

    // 2. ใช้ useEffect เพื่ออัปเดต State เมื่อมีข้อมูล point ส่งเข้ามา
    useEffect(() => {
        if (point) {
            setDepth(Number(point.water_level_meters) || 0);
        }
    }, [point]);

    // 3. เช็คเงื่อนไขและ return null ได้อย่างปลอดภัยเมื่อประกาศ Hook ครบแล้ว
    if (!point) return null;

    const reportedDepth = Number(point.water_level_meters) || 0;
    const rKey = riskKey(point.risk_level);
    const riskLabel = RISK_LABEL[rKey];
    const RiskIcon = RISK_ICON[rKey];
    const color = depthColor(depth);
    const maxScale = 3;
    const gaugeLevel = Math.min(100, Math.round((depth / maxScale) * 100));

    const activeRef = [...REFERENCES].reverse().find((r) => depth >= r.m);
    const isAtReported = depth >= reportedDepth - 0.02 && depth <= reportedDepth + 0.02;

    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${point.latitude},${point.longitude}&travelmode=driving`;

    return (
        <Modal open={open} onClose={onClose}>
            <div className="p-6 pt-8 sm:pt-6 relative overflow-hidden">
                <div
                    className="pointer-events-none absolute -top-16 -left-10 w-56 h-56 rounded-full blur-3xl opacity-25 transition-colors duration-300"
                    style={{ background: color }}
                />

                <div className="relative flex items-center gap-3">
                    <WaterGauge size={44} level={gaugeLevel} color={color} />
                    <div className="min-w-0">
                        <p className="font-['Kanit'] font-semibold text-lg text-[#F3F8F7] leading-tight truncate">
                            {point.location_name || 'จุดแจ้งน้ำท่วม'}
                        </p>
                        <span
                            className="inline-flex items-center gap-1.5 text-xs font-medium mt-1.5 px-2.5 py-1 rounded-full transition-colors duration-300"
                            style={{ backgroundColor: `${color}22`, border: `1px solid ${color}66` }}
                        >
                            <RiskIcon size={12} style={{ color }} className="shrink-0" />
                            <span className="text-[#F3F8F7]">
                                {riskLabel} · รายงานล่าสุด {reportedDepth.toFixed(2)} ม.
                            </span>
                        </span>
                    </div>
                </div>

                <div className="relative mt-7">
                    <div className="flex items-center justify-between mb-2.5">
                        <span className="text-xs font-medium text-[#F3F8F7]/70">ลองเลื่อนดูความลึก</span>
                        <span
                            className="font-['JetBrains_Mono'] text-xs font-semibold px-2 py-0.5 rounded-md transition-colors duration-300"
                            style={{ color, backgroundColor: `${color}1a` }}
                        >
                            {depth.toFixed(2)} ม. · {activeRef ? activeRef.label : 'ต่ำกว่าข้อเท้า'}
                        </span>
                    </div>

                    <div className="relative water-slider-shine">
                        <input
                            type="range"
                            min={0}
                            max={maxScale}
                            step={0.05}
                            value={depth}
                            onChange={(e) => setDepth(Number(e.target.value))}
                            className="w-full water-slider"
                            style={{
                                '--fill': `${(depth / maxScale) * 100}%`,
                                '--thumb-color': color,
                            }}
                            aria-label="เลื่อนเทียบระดับน้ำกับร่างกาย"
                        />
                        {REFERENCES.map((r) => (
                            <span
                                key={`tick-${r.label}`}
                                className="absolute top-1/2 -translate-y-1/2 w-[2px] h-[10px] rounded-full bg-[#ffffff]/40 pointer-events-none"
                                style={{ left: `${(r.m / maxScale) * 100}%` }}
                            />
                        ))}
                    </div>

                    <div className="relative h-4 mt-1.5">
                        {REFERENCES.map((r) => {
                            const isActive = activeRef && activeRef.label === r.label;
                            return (
                                <span
                                    key={r.label}
                                    className={`absolute -translate-x-1/2 font-['JetBrains_Mono'] text-[10px] transition-all duration-200 ${isActive
                                            ? 'text-[#F3F8F7] font-semibold scale-110'
                                            : 'text-[#F3F8F7]/45'
                                        }`}
                                    style={{ left: `${(r.m / maxScale) * 100}%` }}
                                >
                                    {r.label}
                                </span>
                            );
                        })}
                    </div>

                    {isAtReported && (
                        <p className="flex items-center gap-1.5 text-[11px] font-medium text-[#FF6B4A] mt-3">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF6B4A] opacity-60" />
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#FF6B4A]" />
                            </span>
                            ตรงกับระดับที่มีการแจ้งเหตุจริง
                        </p>
                    )}
                </div>

                <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 flex items-center justify-center gap-2 bg-[#FF6B4A] text-[#444444] font-semibold py-3 rounded-xl hover:bg-[#ff805f] active:scale-[0.98] transition-all shadow-lg shadow-[#FF6B4A]/20"
                >
                    <Navigation size={16} />
                    นำทางไปจุดนี้ด้วย Google Maps
                    <span aria-hidden>→</span>
                </a>
            </div>

            <style jsx>{`
                .water-slider-shine {
                    overflow: hidden;
                    border-radius: 999px;
                }
                .water-slider-shine::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    height: 6px;
                    width: 40%;
                    background: linear-gradient(
                        90deg,
                        transparent,
                        rgba(255, 255, 255, 0.55),
                        transparent
                    );
                    transform: translateX(-100%);
                    animation: slider-shine 2.6s ease-in-out infinite;
                    pointer-events: none;
                }
                @media (prefers-reduced-motion: reduce) {
                    .water-slider-shine::after { animation: none; }
                }
                @keyframes slider-shine {
                    to { transform: translateX(250%); }
                }
                .water-slider {
                    -webkit-appearance: none;
                    appearance: none;
                    height: 6px;
                    border-radius: 999px;
                    background: linear-gradient(
                        to right,
                        var(--thumb-color) var(--fill),
                        rgba(243, 248, 247, 0.15) var(--fill)
                    );
                    outline: none;
                    transition: background 0.3s ease;
                }
                .water-slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    background: var(--thumb-color);
                    border: 3px solid #0e3f52;
                    box-shadow: 0 0 0 2px rgba(243, 248, 247, 0.3), 0 0 10px var(--thumb-color);
                    cursor: pointer;
                    transition: background 0.3s ease, box-shadow 0.3s ease;
                }
                .water-slider::-moz-range-thumb {
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    background: var(--thumb-color);
                    border: 3px solid #0e3f52;
                    cursor: pointer;
                    transition: background 0.3s ease;
                }
            `}</style>
        </Modal>
    );
}