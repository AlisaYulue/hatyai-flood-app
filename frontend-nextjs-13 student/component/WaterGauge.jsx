// component/WaterGauge.jsx
// Signature mark: a tide-gauge capsule with an animated rising fill.
// Takes an optional `color` so callers can tie the fill to the actual
// depth-color scale (see depthColor.js) instead of always coral, plus a
// soft glow so the capsule reads clearly against dark panels.

export default function WaterGauge({ size = 40, level = 62, label, color = '#FF6B4A' }) {
    return (
        <div className="flex items-center gap-3">
            <div
                className="relative rounded-full border-2 border-[#F3F8F7]/25 overflow-hidden bg-[#08222C]/40"
                style={{
                    width: size * 0.42,
                    height: size,
                    boxShadow: `0 0 14px ${color}33`,
                }}
            >
                <div
                    className="absolute bottom-0 left-0 w-full water-gauge-fill"
                    style={{ height: `${level}%`, backgroundColor: color }}
                >
                    <svg
                        viewBox="0 0 40 10"
                        preserveAspectRatio="none"
                        className="absolute -top-[6px] left-0 w-[200%] h-[10px] water-gauge-wave"
                    >
                        <path d="M0 5 Q10 0 20 5 T40 5 T60 5 T80 5 V10 H0 Z" fill={color} />
                    </svg>
                    {/* เส้นแสงวูบไหวคาดผ่านผิวน้ำ ให้ดูเหมือนน้ำกระเพื่อมจริงๆ ไม่ใช่แท่งสีนิ่งๆ */}
                    <span className="absolute inset-0 water-gauge-shine" />
                </div>
            </div>
            {label && (
                <span className="font-['JetBrains_Mono'] text-[11px] tracking-wide text-[#F3F8F7]/70">
                    {label}
                </span>
            )}

            <style jsx>{`
                .water-gauge-fill {
                    transition: height 0.6s ease, background-color 0.4s ease;
                }
                .water-gauge-wave {
                    animation: gauge-drift 3.2s linear infinite;
                }
                .water-gauge-shine {
                    background: linear-gradient(
                        120deg,
                        transparent 30%,
                        rgba(255, 255, 255, 0.45) 50%,
                        transparent 70%
                    );
                    transform: translateX(-120%);
                    animation: gauge-shine 2.8s ease-in-out infinite;
                }
                @media (prefers-reduced-motion: reduce) {
                    .water-gauge-wave,
                    .water-gauge-shine {
                        animation: none;
                    }
                }
                @keyframes gauge-drift {
                    from { transform: translateX(0); }
                    to { transform: translateX(-50%); }
                }
                @keyframes gauge-shine {
                    to { transform: translateX(120%); }
                }
            `}</style>
        </div>
    );
}