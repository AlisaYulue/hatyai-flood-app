import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import WaterGauge from '../component/WaterGauge';
import FloodAlertPopup, { shouldAutoShowToday } from '../component/FloodAlertPopup';

// ปิดการโหลด SSR สำหรับ Leaflet
const MapWithNoSSR = dynamic(() => import('../component/FloodMap'), {
    ssr: false,
    loading: () => (
        <div className="flex flex-col items-center justify-center gap-3 h-full bg-[#08222C]">
            <WaterGauge size={48} level={40} />
            <p className="font-['JetBrains_Mono'] text-xs text-[#F3F8F7]/50 tracking-wide">
                กำลังโหลดข้อมูลพื้นที่...
            </p>
        </div>
    ),
});

// Critical มาก่อน แล้วเรียงตามวันที่ใกล้ที่สุด
const sortAlerts = (data) =>
    [...data].sort((a, b) => {
        if (a.risk_level !== b.risk_level) return a.risk_level === 'Critical' ? -1 : 1;
        return new Date(a.alert_date) - new Date(b.alert_date);
    });

export default function HomePage() {
    const [alerts, setAlerts] = useState([]);
    const [showAlert, setShowAlert] = useState(false);
    const [isSimulating, setIsSimulating] = useState(false);

    useEffect(() => {
        const controller = new AbortController();

        fetch('/api/alerts', { signal: controller.signal })
            .then((res) => (res.ok ? res.json() : []))
            .then((data) => {
                if (!Array.isArray(data) || data.length === 0) return;
                setAlerts(sortAlerts(data));
                // เด้งทุกครั้งที่เข้าเว็บ ยกเว้นวันนี้เคยติ๊ก "ไม่ต้องแจ้งเตือนอีกในวันนี้" แล้ว
                if (shouldAutoShowToday()) setShowAlert(true);
            })
            .catch(() => { }); // รวมถึง AbortError ตอน unmount

        return () => controller.abort();
    }, []);

    return (
        <main className="h-[calc(100dvh-8rem)] md:h-[calc(100dvh-4rem)] w-full overflow-hidden relative font-['Noto_Sans_Thai']">

            {/* ปุ่มจำลองน้ำท่วม
                มือถือ: มุมขวาบน (แผงรายการอยู่ด้านล่าง)
                เดสก์ท็อป: เลื่อนซ้ายพ้นแผงกว้าง 360px + ขอบ 16px + ช่องว่าง 16px = 392px */}
            <div className="absolute top-4 right-4 md:right-[392px] z-[1000]">
                <button
                    type="button"
                    onClick={() => setIsSimulating((v) => !v)}
                    aria-pressed={isSimulating}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border backdrop-blur-md shadow-lg shadow-black/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B4A]/70 ${isSimulating
                        ? 'bg-red-500 hover:bg-red-600 border-red-400/60 text-white'
                        : 'bg-[#08222C]/90 hover:bg-[#0c2f3c] border-white/10 text-[#F3F8F7]'
                        }`}
                >
                    <span
                        className={`w-2.5 h-2.5 rounded-full ${isSimulating ? 'bg-white animate-pulse' : 'bg-[#FF6B4A]'}`}
                        aria-hidden="true"
                    />
                    {isSimulating ? 'ปิดจำลองน้ำท่วม' : 'จำลองสถานการณ์'}
                </button>
            </div>

            <MapWithNoSSR isSimulating={isSimulating} />

            {/* Popup แจ้งเตือนความเสี่ยงจาก admin */}
            <FloodAlertPopup alerts={alerts} open={showAlert} onOpenChange={setShowAlert} />
        </main>
    );
}