import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { depthColor } from '../component/depthColor';

const PickMap = dynamic(() => import('../component/ReportPickMap'), { ssr: false });

export default function ReportPage() {
    const router = useRouter();
    const [position, setPosition] = useState(null);
    const [depth, setDepth] = useState(0.3);
    const [isOver5m, setIsOver5m] = useState(false); // เพิ่ม State สำหรับเงื่อนไขเกิน 5 เมตร
    const [locationName, setLocationName] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const submit = async () => {
        if (!position) return setError('กรุณาแตะบนแผนที่เพื่อระบุจุดที่น้ำท่วม');
        if (!locationName) return setError('กรุณาระบุชื่อสถานที่หรือจุดสังเกต');

        setSubmitting(true);
        setError('');
        try {
            const res = await fetch('/api/reports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    latitude: position.lat,
                    longitude: position.lng,
                    // หากติ๊กเกิน 5 เมตร จะส่งค่า 5.1 (ปรับตัวเลขนี้ตามที่ Backend รองรับได้)
                    water_level_meters: isOver5m ? 5.1 : depth,
                    location_name: locationName,
                }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || 'ส่งรายงานไม่สำเร็จ');
            }
            router.push('/?reported=1');
        } catch (e) {
            setError(e.message);
        } finally {
            setSubmitting(false);
        }
    };

    // ปรับสีให้เป็นสีแดงเข้ม (หรือสีตามต้องการ) หากน้ำท่วมเกิน 5 เมตร
    const color = isOver5m ? '#FF4500' : depthColor(depth);

    return (
        <div className="min-h-screen bg-[#08222C] font-['Noto_Sans_Thai'] flex flex-col md:flex-row">
            <div className="relative h-[45vh] md:h-screen md:flex-1">
                <PickMap position={position} onPick={setPosition} />
                <p className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#08222C]/85 text-[#F3F8F7]/80 text-xs px-4 py-2 rounded-full border border-white/10">
                    แตะบนแผนที่เพื่อปักหมุด
                </p>
            </div>

            <div className="md:w-[380px] p-6 flex flex-col gap-4">
                <Link href="/" className="text-sm text-[#F3F8F7]/60 hover:text-[#F3F8F7]">
                    ← กลับแผนที่
                </Link>
                <h1 className="font-['Kanit'] font-semibold text-2xl text-[#F3F8F7]">แจ้งจุดน้ำท่วม</h1>
                <p className="text-sm text-[#F3F8F7]/60">
                    รายงานของคุณจะรอผู้ดูแลระบบตรวจสอบก่อนแสดงผลบนแผนที่จริง
                </p>

                <input
                    type="text"
                    placeholder="ชื่อสถานที่ / จุดสังเกต เช่น หน้า ม.สงขลานครินทร์"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    className="bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-[#F3F8F7] text-sm outline-none focus:border-[#1C6E8C]"
                />

                <div>
                    <div className="flex justify-between text-xs text-[#F3F8F7]/55 mb-1">
                        <span>ความลึกน้ำ (ประมาณ)</span>
                        <span className="font-['JetBrains_Mono']" style={{ color }}>
                            {isOver5m ? '> 5.00 ม.' : `${depth.toFixed(2)} ม.`}
                        </span>
                    </div>

                    <input
                        type="range"
                        min={0}
                        max={5}
                        step={0.1}
                        value={depth}
                        onChange={(e) => {
                            setDepth(Number(e.target.value));
                        }}
                        disabled={isOver5m} // ปิดการใช้งานสไลเดอร์เมื่อติ๊กเกิน 5 เมตร
                        className="w-full transition-opacity"
                        style={{
                            accentColor: color,
                            opacity: isOver5m ? 0.3 : 1, // ทำให้แถบจางลงเมื่อถูก Disabled
                            cursor: isOver5m ? 'not-allowed' : 'pointer'
                        }}
                    />

                    {/* เพิ่ม Checkbox ตรงนี้ */}
                    <label className="flex items-center gap-2 mt-3 cursor-pointer w-max text-sm text-[#F3F8F7]/80 hover:text-[#F3F8F7] transition-colors">
                        <input
                            type="checkbox"
                            checked={isOver5m}
                            onChange={(e) => setIsOver5m(e.target.checked)}
                            className="w-4 h-4 rounded accent-[#FF6B4A] cursor-pointer"
                        />
                        ระดับน้ำสูงเกิน 5 เมตร
                    </label>
                </div>

                {error && <p className="text-sm text-[#FF6B4A]">{error}</p>}

                <button
                    onClick={submit}
                    disabled={submitting}
                    className="mt-2 bg-[#FF6B4A] text-[#08222C] font-medium py-3 rounded-xl disabled:opacity-50 transition-colors hover:bg-[#ff805f]"
                >
                    {submitting ? 'กำลังส่ง...' : 'ส่งรายงาน'}
                </button>
            </div>
        </div>
    );
}