import { useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { AlertCircle, CheckCircle2, Crosshair, Send, Users, Waves } from 'lucide-react';

const MapPicker = dynamic(() => import('../component/ReportMapPicker'), {
    ssr: false,
    loading: () => <div className="h-full w-full animate-pulse bg-[#08222C]/10" />,
});

const DEPTHS = [
    { value: 0.2, label: 'ข้อเท้า', hint: '~ 20 ซม.', fill: 12, color: '#2F8FA8' },
    { value: 0.5, label: 'หัวเข่า', hint: '~ 50 ซม.', fill: 35, color: '#3E8FB0' },
    { value: 1.0, label: 'เอว', hint: '~ 1 ม.', fill: 55, color: '#B89B3E' },
    { value: 1.5, label: 'หน้าอก', hint: '~ 1.5 ม.', fill: 78, color: '#C0714A' },
    { value: 2.0, label: 'ท่วมหัว', hint: '2 ม.+', fill: 100, color: '#B24848' },
];

function DepthOption({ d, selected, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={selected}
            className={`flex flex-col items-center gap-1.5 rounded-2xl border px-1 py-3 transition-all ${selected
                    ? 'border-[#FF6B4A] bg-[#FF6B4A]/10 ring-1 ring-[#FF6B4A]'
                    : 'border-[#08222C]/15 hover:bg-[#08222C]/5'
                }`}
        >
            <div className="relative h-14 w-8 overflow-hidden rounded-md border border-[#08222C]/15 bg-[#08222C]/5">
                <div
                    className="absolute inset-x-0 bottom-0 transition-all duration-300"
                    style={{ height: `${d.fill}%`, background: d.color }}
                />
            </div>
            <span className="text-xs font-medium text-[#08222C] sm:text-sm">{d.label}</span>
            <span className="text-[10px] text-[#08222C]/45">{d.hint}</span>
        </button>
    );
}

export default function ReportPage() {
    const router = useRouter();
    const [email, setEmail] = useState(null);
    const [ready, setReady] = useState(false);

    const [position, setPosition] = useState(null); // [lat, lng]
    const [locationName, setLocationName] = useState('');
    const [depth, setDepth] = useState(0.5);
    const [locating, setLocating] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState(null);

    useEffect(() => {
        setEmail(localStorage.getItem('userEmail'));
        setReady(true);
    }, []);

    useEffect(() => {
        if (ready && !email) router.replace('/login');
    }, [ready, email, router]);

    const useMyLocation = () => {
        if (!navigator.geolocation) return setError('อุปกรณ์นี้ไม่รองรับการระบุตำแหน่ง');
        setError('');
        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            (p) => { setPosition([p.coords.latitude, p.coords.longitude]); setLocating(false); },
            () => { setError('ดึงตำแหน่งไม่ได้ กรุณาอนุญาตการเข้าถึงตำแหน่ง หรือแตะบนแผนที่เพื่อเลือกจุดเอง'); setLocating(false); },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const submit = async () => {
        setError('');
        if (!position) return setError('กรุณาเลือกจุดบนแผนที่ หรือกด "ใช้ตำแหน่งปัจจุบัน"');
        if (!locationName.trim()) return setError('กรุณาระบุชื่อสถานที่/จุดสังเกต');
        setSubmitting(true);
        try {
            const res = await fetch('/api/flood-reports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    location_name: locationName.trim(),
                    latitude: position[0],
                    longitude: position[1],
                    water_level_meters: depth,
                    reporter_email: email,
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || 'ส่งรายงานไม่สำเร็จ');
            setResult(data);
        } catch (e) {
            setError(e.message);
        } finally {
            setSubmitting(false);
        }
    };

    const reset = () => { setResult(null); setLocationName(''); setPosition(null); setDepth(0.5); };

    if (!ready || !email) return <div className="min-h-[60vh]" />;

    if (result) {
        return (
            <main className="min-h-[calc(100dvh-72px)] bg-[#F3F8F7] font-['Noto_Sans_Thai'] px-4 py-10" style={{ paddingBottom: 'calc(var(--tabbar-h, 0px) + 2.5rem)' }}>
                <div className="mx-auto max-w-md rounded-3xl bg-white p-8 text-center shadow-sm border border-[#08222C]/10">
                    <div className={`mx-auto grid h-14 w-14 place-items-center rounded-full ${result.autoApproved ? 'bg-[#2FBF83]/15 text-[#2FBF83]' : 'bg-[#FF6B4A]/15 text-[#FF6B4A]'}`}>
                        {result.autoApproved ? <CheckCircle2 size={28} /> : <Users size={28} />}
                    </div>
                    <h1 className="mt-4 font-['Kanit'] text-2xl font-semibold text-[#08222C]">
                        {result.autoApproved ? 'หมุดขึ้นบนแผนที่แล้ว' : 'ส่งรายงานแล้ว'}
                    </h1>
                    <p className="mt-2 text-sm leading-relaxed text-[#08222C]/60">
                        {result.autoApproved
                            ? `มีรายงานบริเวณนี้ครบ ${result.required} ครั้ง ระบบอนุมัติหมุดให้อัตโนมัติ ขอบคุณที่ช่วยเตือนภัยครับ`
                            : `บริเวณนี้มีรายงานแล้ว ${result.count}/${result.required} ครั้ง หากครบจะขึ้นหมุดอัตโนมัติ หรือรอผู้ดูแลระบบตรวจสอบ`}
                    </p>
                    <div className="mt-6 flex flex-col gap-2">
                        <Link href="/" className="rounded-xl bg-[#08222C] py-3 text-sm font-medium text-[#F3F8F7]">กลับไปดูแผนที่</Link>
                        <button onClick={reset} className="rounded-xl py-3 text-sm text-[#08222C]/60 hover:bg-[#08222C]/5">รายงานจุดอื่นเพิ่ม</button>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-[calc(100dvh-72px)] bg-[#F3F8F7] font-['Noto_Sans_Thai'] px-4 py-6 md:py-10" style={{ paddingBottom: 'calc(var(--tabbar-h, 0px) + 2.5rem)' }}>
            <div className="mx-auto max-w-5xl">
                <h1 className="font-['Kanit'] text-2xl font-semibold text-[#08222C] md:text-3xl">รายงานจุดน้ำท่วม</h1>
                <p className="mt-1 text-sm text-[#08222C]/55">
                    ช่วยกันรายงาน หากมีรายงานบริเวณใกล้กันครบ 5 ครั้ง หมุดจะขึ้นบนแผนที่ทันที ถ้าไม่ครบ ผู้ดูแลระบบจะตรวจสอบให้
                </p>

                <div className="mt-6 grid gap-5 md:grid-cols-2">
                    {/* แผนที่ */}
                    <div className="flex flex-col gap-3">
                        <div className="h-[320px] overflow-hidden rounded-2xl border border-[#08222C]/10 md:h-[440px]">
                            <MapPicker position={position} onChange={setPosition} />
                        </div>
                        <button
                            type="button"
                            onClick={useMyLocation}
                            disabled={locating}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#08222C]/15 bg-white py-3 text-sm font-medium text-[#08222C] transition-colors hover:bg-[#08222C]/5 disabled:opacity-60"
                        >
                            <Crosshair size={16} /> {locating ? 'กำลังหาตำแหน่ง...' : 'ใช้ตำแหน่งปัจจุบัน'}
                        </button>
                        <p className="text-xs text-[#08222C]/45">
                            {position ? `พิกัด: ${position[0].toFixed(5)}, ${position[1].toFixed(5)}` : 'แตะบนแผนที่เพื่อปักหมุดจุดที่น้ำท่วม'}
                        </p>
                    </div>

                    {/* ฟอร์ม */}
                    <div className="flex flex-col gap-5 rounded-2xl border border-[#08222C]/10 bg-white p-5 md:p-6">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-[#08222C]">ชื่อสถานที่ / จุดสังเกต</label>
                            <input
                                value={locationName}
                                onChange={(e) => setLocationName(e.target.value)}
                                maxLength={255}
                                placeholder="เช่น หน้าตลาดกิมหยง ถนนเพชรเกษม"
                                className="rounded-xl border border-[#08222C]/15 px-3.5 py-3 text-[#08222C] outline-none transition-colors focus:border-[#1C6E8C]"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="flex items-center gap-1.5 text-sm font-medium text-[#08222C]"><Waves size={15} /> ระดับน้ำตอนนี้</label>
                            <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                                {DEPTHS.map((d) => (
                                    <DepthOption key={d.value} d={d} selected={depth === d.value} onClick={() => setDepth(d.value)} />
                                ))}
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-start gap-1.5 text-sm text-red-500"><AlertCircle size={15} className="mt-0.5 shrink-0" />{error}</div>
                        )}

                        <button
                            type="button"
                            onClick={submit}
                            disabled={submitting}
                            className="mt-auto inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#FF6B4A] font-medium text-[#08222C] transition-colors hover:bg-[#ff805f] disabled:opacity-60"
                        >
                            <Send size={16} /> {submitting ? 'กำลังส่ง...' : 'ส่งรายงาน'}
                        </button>
                        <p className="text-center text-[11px] text-[#08222C]/40">รายงานในชื่อ {email}</p>
                    </div>
                </div>
            </div>
        </main>
    );
}