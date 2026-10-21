import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { HELP_TYPES, URGENCY } from '../component/help-meta';

const PickMap = dynamic(() => import('../component/HelpPickMap'), { ssr: false });

const HERE_KEY = process.env.NEXT_PUBLIC_HERE_API_KEY;
const DEFAULT_CENTER = { lat: 13.7563, lng: 100.5018 };

const inputCls =
    'w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-[#F3F8F7] text-sm outline-none focus:border-[#1C6E8C]';

export default function HelpPage() {
    const router = useRouter();
    const [email, setEmail] = useState(null);
    const [position, setPosition] = useState(null);
    const [f, setF] = useState({
        help_type: 'rescue', urgency: 'urgent', people_count: 1, has_vulnerable: false,
        location_name: '', details: '', contact_name: '', phone: '', show_phone_public: false,
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const set = (patch) => setF((p) => ({ ...p, ...patch }));

    // ---- ตำแหน่งปัจจุบัน ----
    const [locating, setLocating] = useState(false);

    // ---- ค้นหาที่อยู่ (dropdown) ----
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [open, setOpen] = useState(false);
    const [searching, setSearching] = useState(false);
    const searchBoxRef = useRef(null);
    const skipNextSearch = useRef(false);

    useEffect(() => {
        const e = localStorage.getItem('userEmail');
        if (!e) return void router.replace('/login?next=/help');
        setEmail(e);
    }, [router]);

    // ปิด dropdown เมื่อคลิกนอกกล่อง
    useEffect(() => {
        const onDown = (e) => {
            if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', onDown);
        document.addEventListener('touchstart', onDown);
        return () => {
            document.removeEventListener('mousedown', onDown);
            document.removeEventListener('touchstart', onDown);
        };
    }, []);

    // Autosuggest (debounce 300ms)
    useEffect(() => {
        if (skipNextSearch.current) {
            skipNextSearch.current = false;
            return;
        }
        const q = query.trim();
        if (!HERE_KEY || q.length < 2) {
            setSuggestions([]);
            return;
        }
        const ctrl = new AbortController();
        const t = setTimeout(async () => {
            setSearching(true);
            try {
                const at = position ? `${position.lat},${position.lng}` : `${DEFAULT_CENTER.lat},${DEFAULT_CENTER.lng}`;
                const url =
                    `https://autosuggest.search.hereapi.com/v1/autosuggest?at=${at}` +
                    `&q=${encodeURIComponent(q)}&limit=6&lang=th&in=countryCode:THA&apiKey=${HERE_KEY}`;
                const res = await fetch(url, { signal: ctrl.signal });
                if (!res.ok) throw new Error('search failed');
                const data = await res.json();
                const items = (data.items || []).filter((it) => it.position);
                setSuggestions(items);
                setOpen(true);
            } catch (err) {
                if (err.name !== 'AbortError') setSuggestions([]);
            } finally {
                setSearching(false);
            }
        }, 300);
        return () => {
            clearTimeout(t);
            ctrl.abort();
        };
    }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

    const pickSuggestion = (it) => {
        const label = it.address?.label || it.title;
        skipNextSearch.current = true;
        setQuery(it.title);
        setOpen(false);
        setSuggestions([]);
        setPosition({ lat: it.position.lat, lng: it.position.lng, fly: true });
        set({ location_name: label });
        setError('');
    };

    const reverseGeocode = async (lat, lng) => {
        if (!HERE_KEY) return null;
        try {
            const res = await fetch(
                `https://revgeocode.search.hereapi.com/v1/revgeocode?at=${lat},${lng}&lang=th&apiKey=${HERE_KEY}`
            );
            const data = await res.json();
            return data.items?.[0]?.address?.label || null;
        } catch {
            return null;
        }
    };

    const useMyLocation = () => {
        setError('');
        if (!('geolocation' in navigator)) {
            return setError('เบราว์เซอร์นี้ไม่รองรับการระบุตำแหน่ง กรุณาแตะบนแผนที่เพื่อปักหมุดเอง');
        }
        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude: lat, longitude: lng } = pos.coords;
                setPosition({ lat, lng, fly: true });
                setLocating(false);
                // เติมที่อยู่ให้อัตโนมัติ ถ้าผู้ใช้ยังไม่ได้กรอก
                if (!f.location_name.trim()) {
                    const label = await reverseGeocode(lat, lng);
                    if (label) set({ location_name: label });
                }
            },
            (err) => {
                setLocating(false);
                if (err.code === 1) {
                    setError('คุณยังไม่ได้อนุญาตใช้ตำแหน่ง กรุณาเปิดสิทธิ์ตำแหน่งในการตั้งค่าเบราว์เซอร์ หรือแตะบนแผนที่เพื่อปักหมุดเอง');
                } else if (err.code === 2) {
                    setError('ไม่สามารถระบุตำแหน่งได้ กรุณาเปิด GPS แล้วลองอีกครั้ง');
                } else {
                    setError('ระบุตำแหน่งนานเกินไป กรุณาลองอีกครั้ง หรือแตะบนแผนที่เพื่อปักหมุดเอง');
                }
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    };

    const submit = async () => {
        if (!position) return setError('กรุณาแตะบนแผนที่เพื่อปักหมุดตำแหน่งของคุณ');
        if (!f.location_name.trim()) return setError('กรุณาระบุที่อยู่หรือจุดสังเกต');
        if (f.phone.replace(/\D/g, '').length < 9) return setError('กรุณาระบุเบอร์โทรที่ติดต่อได้');
        setSubmitting(true);
        setError('');
        try {
            const res = await fetch('/api/help-requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...f, user_email: email, latitude: position.lat, longitude: position.lng }),
            });
            if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'ส่งคำขอไม่สำเร็จ');
            router.push('/?helped=1');
        } catch (e) {
            setError(e.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (!email) return <div className="min-h-screen bg-[#08222C]" />;

    return (
        <div className="min-h-screen bg-[#08222C] font-['Noto_Sans_Thai'] flex flex-col md:flex-row">
            <div className="relative h-[45vh] md:h-screen md:flex-1">
                <PickMap position={position} onPick={setPosition} />
                <p className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] bg-[#08222C]/85 text-[#F3F8F7]/80 text-xs px-4 py-2 rounded-full border border-white/10">
                    แตะบนแผนที่เพื่อปักหมุดตำแหน่งของคุณ
                </p>
            </div>

            <div className="md:w-[400px] p-6 flex flex-col gap-4 md:max-h-screen md:overflow-y-auto">
                <Link href="/" className="text-sm text-[#F3F8F7]/60 hover:text-[#F3F8F7]">← กลับแผนที่</Link>
                <h1 className="font-['Kanit'] font-semibold text-2xl text-[#F3F8F7]">ขอความช่วยเหลือ</h1>
                <p className="text-xs text-[#FF6B4A] bg-[#FF6B4A]/10 border border-[#FF6B4A]/30 rounded-xl px-3 py-2 leading-relaxed">
                    ชีวิตเสี่ยงอันตรายทันที โทร 1669 (การแพทย์ฉุกเฉิน) หรือ 191 ก่อน
                    ระบบนี้ช่วยรวบรวมตำแหน่งให้อาสาสมัครและเจ้าหน้าที่ ไม่ใช่การรับประกันว่าจะมีผู้ไปถึงทันที
                </p>

                {/* ปุ่มใช้ตำแหน่งปัจจุบัน */}
                <button type="button" onClick={useMyLocation} disabled={locating}
                    className="flex items-center justify-center gap-2 bg-[#1C6E8C] hover:bg-[#2380a1] text-white text-sm font-medium py-3 rounded-xl disabled:opacity-60 transition-colors">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                        <circle cx="12" cy="12" r="7" />
                    </svg>
                    {locating ? 'กำลังหาตำแหน่ง...' : 'ใช้ตำแหน่งปัจจุบันของฉัน'}
                </button>

                {/* ค้นหาที่อยู่ + dropdown */}
                {HERE_KEY && (
                    <div className="relative" ref={searchBoxRef}>
                        <input className={inputCls} placeholder="ค้นหาที่อยู่ / สถานที่ใกล้เคียง"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onFocus={() => suggestions.length && setOpen(true)} />
                        {searching && (
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#F3F8F7]/40">ค้นหา...</span>
                        )}
                        {open && suggestions.length > 0 && (
                            <ul className="absolute z-[2000] left-0 right-0 mt-1 max-h-64 overflow-y-auto rounded-xl border border-white/15 bg-[#0d2f3b] shadow-xl">
                                {suggestions.map((it, i) => (
                                    <li key={it.id || i}>
                                        <button type="button" onClick={() => pickSuggestion(it)}
                                            className="w-full text-left px-4 py-2.5 hover:bg-white/10 border-b border-white/5 last:border-0">
                                            <div className="text-sm text-[#F3F8F7]">{it.title}</div>
                                            {it.address?.label && (
                                                <div className="text-xs text-[#F3F8F7]/50 truncate">{it.address.label}</div>
                                            )}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}

                <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-[#F3F8F7]/55">ประเภทความช่วยเหลือ</label>
                    <select className={inputCls} value={f.help_type} onChange={(e) => set({ help_type: e.target.value })}>
                        {Object.entries(HELP_TYPES).map(([k, v]) => (
                            <option key={k} value={k} className="text-black">{v}</option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-[#F3F8F7]/55">ความเร่งด่วน</label>
                    <div className="flex gap-2">
                        {Object.entries(URGENCY).map(([k, u]) => (
                            <button key={k} type="button" onClick={() => set({ urgency: k })}
                                className="flex-1 text-sm py-2 rounded-lg border transition-colors"
                                style={{
                                    borderColor: f.urgency === k ? u.color : 'rgba(255,255,255,0.15)',
                                    background: f.urgency === k ? `${u.color}33` : 'transparent',
                                    color: f.urgency === k ? '#fff' : 'rgba(243,248,247,0.6)',
                                }}>
                                {u.label}
                            </button>
                        ))}
                    </div>
                </div>

                <input className={inputCls} placeholder="ที่อยู่ / จุดสังเกต เช่น บ้านเลขที่ ซอย ใกล้ร้าน..."
                    value={f.location_name} onChange={(e) => set({ location_name: e.target.value })} />

                <div className="flex gap-3">
                    <div className="flex-1 flex flex-col gap-1.5">
                        <label className="text-xs text-[#F3F8F7]/55">จำนวนคน</label>
                        <input type="number" min={1} max={200} className={inputCls} value={f.people_count}
                            onChange={(e) => set({ people_count: e.target.value })} />
                    </div>
                    <div className="flex-[2] flex flex-col gap-1.5">
                        <label className="text-xs text-[#F3F8F7]/55">ชื่อผู้ติดต่อ (ไม่บังคับ)</label>
                        <input className={inputCls} value={f.contact_name} onChange={(e) => set({ contact_name: e.target.value })} />
                    </div>
                </div>

                <label className="flex items-center gap-2 text-sm text-[#F3F8F7]/80 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 accent-[#FF6B4A]" checked={f.has_vulnerable}
                        onChange={(e) => set({ has_vulnerable: e.target.checked })} />
                    มีผู้สูงอายุ เด็กเล็ก หรือผู้ป่วยติดเตียง
                </label>

                <textarea rows={4} className={inputCls} placeholder="รายละเอียด เช่น ระดับน้ำ ชั้นที่อยู่ ยา/อุปกรณ์ที่ต้องใช้ เสบียงที่เหลือ"
                    value={f.details} onChange={(e) => set({ details: e.target.value })} />

                <input type="tel" className={inputCls} placeholder="เบอร์โทรที่ติดต่อได้ *"
                    value={f.phone} onChange={(e) => set({ phone: e.target.value })} />
                <label className="flex items-start gap-2 text-xs text-[#F3F8F7]/60 cursor-pointer leading-relaxed">
                    <input type="checkbox" className="w-4 h-4 mt-0.5 accent-[#FF6B4A]" checked={f.show_phone_public}
                        onChange={(e) => set({ show_phone_public: e.target.checked })} />
                    แสดงเบอร์โทรบนแผนที่ให้อาสาสมัครโทรหาได้ (ถ้าไม่ติ๊ก เฉพาะผู้ดูแลระบบจะเห็นเบอร์)
                </label>

                {error && <p className="text-sm text-[#FF6B4A]">{error}</p>}
                <button onClick={submit} disabled={submitting}
                    className="bg-[#FF6B4A] text-[#08222C] font-medium py-3 rounded-xl disabled:opacity-50 hover:bg-[#ff805f] transition-colors">
                    {submitting ? 'กำลังส่ง...' : 'ส่งคำขอความช่วยเหลือ'}
                </button>
                <p className="text-[11px] text-[#F3F8F7]/40 leading-relaxed">
                    คำขอจะขึ้นบนแผนที่หลังผู้ดูแลระบบตรวจสอบแล้ว
                </p>
            </div>
        </div>
    );
}