// pages/404.js
import Head from 'next/head';
import Link from 'next/link';

// ตำแหน่งฟองอากาศกำหนดตายตัว (ไม่ใช้ Math.random) เพื่อไม่ให้ hydration mismatch
const BUBBLES = [
    { left: '6%', size: 10, dur: 11, delay: 0 },
    { left: '15%', size: 18, dur: 14, delay: 3 },
    { left: '27%', size: 8, dur: 9, delay: 6 },
    { left: '38%', size: 14, dur: 13, delay: 1.5 },
    { left: '52%', size: 9, dur: 10, delay: 4.5 },
    { left: '63%', size: 20, dur: 15, delay: 2 },
    { left: '74%', size: 12, dur: 12, delay: 7 },
    { left: '85%', size: 8, dur: 9.5, delay: 0.8 },
    { left: '93%', size: 16, dur: 13.5, delay: 5 },
];

const WAVE_PATH =
    'M0 0 Q37.5 -14 75 0 T150 0 T225 0 T300 0 T375 0 T450 0 T525 0 T600 0 T675 0 T750 0 T825 0 T900 0 T975 0 T1050 0 T1125 0 T1200 0 L1200 300 L0 300 Z';

export default function Custom404() {
    return (
        <>
            <Head>
                <title>ไม่พบหน้านี้ · 404</title>
            </Head>

            <main className="relative min-h-screen w-full overflow-hidden bg-[#08222C] flex items-center justify-center px-6 py-12 font-['Noto_Sans_Thai']">
                {/* พื้นหลังไล่เฉด "น้ำลึก" เหมือนหน้า login */}
                <div
                    className="absolute inset-0 opacity-60"
                    style={{
                        background: 'radial-gradient(120% 100% at 10% 0%, #12506B 0%, #08222C 60%)',
                    }}
                />

                {/* ฟองอากาศลอยขึ้น */}
                {BUBBLES.map((b, i) => (
                    <span
                        key={i}
                        className="bubble"
                        style={{
                            left: b.left,
                            width: b.size,
                            height: b.size,
                            animationDuration: `${b.dur}s`,
                            animationDelay: `${b.delay}s`,
                        }}
                    />
                ))}

                <div className="relative z-10 w-full max-w-xl text-center">
                    {/* หมุดน้ำท่วมสไตล์เดียวกับในแผนที่ */}
                    <div className="pin-wrap fade-up" style={{ animationDelay: '0.1s' }}>
                        <span className="pin-pulse" />
                        <svg width="34" height="44" viewBox="0 0 34 44" className="pin-bob" aria-hidden>
                            <path
                                d="M17 0C7.6 0 0 7.6 0 17c0 12 17 27 17 27s17-15 17-27C34 7.6 26.4 0 17 0z"
                                fill="#FF6B4A"
                            />
                            <path
                                d="M17 11c0 0 4.2 4.9 4.2 8.1a4.2 4.2 0 1 1-8.4 0C12.8 15.9 17 11 17 11z"
                                fill="#F3F8F7"
                            />
                        </svg>
                    </div>

                    {/* เลข 404 ที่มีน้ำค่อยๆ ท่วมขึ้นมาในตัวเลข */}
                    <svg
                        viewBox="0 0 600 220"
                        className="w-full max-w-[520px] mx-auto mt-2 fade-up"
                        style={{ animationDelay: '0.2s' }}
                        role="img"
                        aria-label="404"
                    >
                        <defs>
                            <clipPath id="digits-clip">
                                <text
                                    x="300"
                                    y="190"
                                    textAnchor="middle"
                                    fontSize="220"
                                    fontWeight="700"
                                    fontFamily="Kanit, sans-serif"
                                >
                                    404
                                </text>
                            </clipPath>
                            <linearGradient id="water-grad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0" stopColor="#6CC7E3" />
                                <stop offset="1" stopColor="#1C6E8C" />
                            </linearGradient>
                        </defs>

                        {/* เส้นขอบตัวเลข */}
                        <text
                            x="300"
                            y="190"
                            textAnchor="middle"
                            fontSize="220"
                            fontWeight="700"
                            fontFamily="Kanit, sans-serif"
                            fill="rgba(243,248,247,0.06)"
                            stroke="rgba(243,248,247,0.35)"
                            strokeWidth="2"
                        >
                            404
                        </text>

                        {/* น้ำ (ถูกตัดให้เห็นเฉพาะในตัวเลข) */}
                        <g clipPath="url(#digits-clip)">
                            <g className="bob">
                                <g className="rise">
                                    <g className="wave wave-back">
                                        <path
                                            d={WAVE_PATH}
                                            transform="translate(-75 -10)"
                                            fill="#12506B"
                                            opacity="0.7"
                                        />
                                    </g>
                                    <g className="wave wave-front">
                                        <path d={WAVE_PATH} fill="url(#water-grad)" />
                                    </g>
                                </g>
                            </g>
                        </g>
                    </svg>

                    <h1
                        className="mt-6 font-['Kanit'] font-semibold text-3xl md:text-4xl leading-tight text-[#F3F8F7] fade-up"
                        style={{ animationDelay: '0.4s' }}
                    >
                        Page Not Found
                    </h1>
                    <p
                        className="mt-3 text-[#F3F8F7]/65 text-sm md:text-base leading-relaxed max-w-md mx-auto fade-up"
                        style={{ animationDelay: '0.55s' }}
                    >
                        ไม่พบหน้าที่คุณตามหา ลิงก์อาจผิดหรือหน้านี้ถูกย้ายไปแล้ว
                        กลับไปดูแผนที่ศูนย์พักพิง/จุดฝากรถและแผนที่ขอความช่วยเหลือแทนได้เลย
                    </p>

                    <div
                        className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 fade-up"
                        style={{ animationDelay: '0.7s' }}
                    >
                        <Link
                            href="/"
                            className="inline-flex items-center justify-center h-12 px-7 rounded-xl bg-[#FF6B4A] text-[#08222C] font-medium w-full sm:w-auto transition-all hover:bg-[#ff8266] hover:-translate-y-0.5 active:scale-95"
                        >
                            กลับไปหน้าแผนที่
                        </Link>
                    </div>

                    <p
                        className="mt-10 font-['JetBrains_Mono'] text-[11px] text-[#F3F8F7]/35 tracking-wide fade-up"
                        style={{ animationDelay: '0.85s' }}
                    >
                        ERROR 404 · HAT YAI FLOOD WATCH
                    </p>
                </div>
            </main>

            <style jsx>{`
                /* ---------- น้ำในตัวเลข ---------- */
                .rise {
                    transform: translateY(80px); /* ระดับน้ำสุดท้าย (ถ้าปิด animation จะเห็นแค่นี้) */
                    animation: rise 3.5s cubic-bezier(0.22, 0.8, 0.3, 1) forwards;
                }
                .bob {
                    animation: bob 4s ease-in-out 3.5s infinite;
                }
                .wave-front {
                    animation: wave 6s linear infinite;
                }
                .wave-back {
                    animation: wave 9s linear infinite reverse;
                }
                @keyframes rise {
                    from { transform: translateY(235px); }
                    to { transform: translateY(80px); }
                }
                @keyframes wave {
                    from { transform: translateX(0); }
                    to { transform: translateX(-300px); }
                }
                @keyframes bob {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-6px); }
                }

                /* ---------- หมุด ---------- */
                .pin-wrap {
                    position: relative;
                    width: 34px;
                    height: 44px;
                    margin: 0 auto;
                }
                .pin-pulse {
                    position: absolute;
                    inset: 0 0 10px 0;
                    border-radius: 50%;
                    background: #ff6b4a;
                    opacity: 0.45;
                    animation: pin-pulse 1.8s ease-out infinite;
                }
                .pin-bob {
                    position: relative;
                    z-index: 1;
                    animation: pin-bob 3s ease-in-out infinite;
                    filter: drop-shadow(0 3px 4px rgba(0, 0, 0, 0.35));
                }
                @keyframes pin-pulse {
                    0% { transform: scale(0.6); opacity: 0.5; }
                    100% { transform: scale(1.8); opacity: 0; }
                }
                @keyframes pin-bob {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-4px); }
                }

                /* ---------- ฟองอากาศ ---------- */
                .bubble {
                    position: absolute;
                    bottom: -30px;
                    border-radius: 50%;
                    border: 1px solid rgba(243, 248, 247, 0.25);
                    background: rgba(243, 248, 247, 0.06);
                    opacity: 0;
                    animation-name: bubble-up;
                    animation-timing-function: linear;
                    animation-iteration-count: infinite;
                }
                @keyframes bubble-up {
                    0% { transform: translate(0, 0); opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 0.8; }
                    100% { transform: translate(24px, -110vh); opacity: 0; }
                }

                /* ---------- เนื้อหาค่อยๆ ลอยเข้ามา ---------- */
                .fade-up {
                    opacity: 0;
                    animation: fade-up 0.7s ease-out forwards;
                }
                @keyframes fade-up {
                    from { opacity: 0; transform: translateY(14px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                @media (prefers-reduced-motion: reduce) {
                    .rise, .bob, .wave-front, .wave-back, .pin-pulse, .pin-bob, .bubble {
                        animation: none;
                    }
                    .bubble { display: none; }
                    .fade-up { animation: none; opacity: 1; }
                }
            `}</style>
        </>
    );
}