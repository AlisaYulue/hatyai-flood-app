// pages/help.jsx
import { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { Select, SelectItem } from '@heroui/react';
import {
    AlertCircle, Check, ChevronDown, Crosshair, HeartPulse, List,
    MapPin, Minus, Phone, Plus, ShieldAlert, X,
} from 'lucide-react';
import { HELP_TYPES, URGENCY } from '../component/help-meta';

const HelpMap = dynamic(() => import('../component/HelpMap'), { ssr: false });

const HERE_KEY = process.env.NEXT_PUBLIC_HERE_API_KEY;
const DEFAULT_CENTER = { lat: 7.0049, lng: 100.4736 };
const NAV_H = 72;

// ระดับน้ำ — fill = สัดส่วนความสูงของแท่งไอคอน (%)
const WATER_LEVELS = [
    { key: 'ankle', label: 'ข้อเท้า', hint: 'ประมาณ 20 ซม.', fill: 12, color: '#4ABAE0' },
    { key: 'knee', label: 'หัวเข่า', hint: 'ประมาณ 50 ซม.', fill: 32, color: '#4ABAE0' },
    { key: 'waist', label: 'เอว', hint: 'ประมาณ 1 เมตร', fill: 55, color: '#F4B740' },
    { key: 'chest', label: 'หน้าอก', hint: 'ประมาณ 1.3 เมตร', fill: 76, color: '#FF8A4A' },
    { key: 'over_head', label: 'ท่วมหัว', hint: 'สูงกว่า 1.7 เมตร / ชั้น 2 ขึ้นไป', fill: 100, color: '#FF5A4A' },
];

const INITIAL = {
    help_type: 'rescue',
    urgency: 'urgent',
    water_level: '',
    people_count: 1,
    has_vulnerable: false,
    location_name: '',
    details: '',
    contact_name: '',
    phone: '',
    show_phone_public: false,
};

// text-base (16px) กัน iOS ซูมเองตอนแตะช่องกรอก
const fieldBase =
    'block w-full bg-white/[0.06] border border-white/15 rounded-xl px-4 text-base text-[#F3F8F7] placeholder:text-[#F3F8F7]/35 outline-none focus:border-[#1C6E8C] focus:bg-white/10 transition-colors';
const field = `${fieldBase} h-12`;
const labelCls = 'block mb-1.5 text-xs font-medium text-[#F3F8F7]/70';

export default function HelpPage() {
    const router = useRouter();
    const [requests, setRequests] = useState([]);
    const [mode, setMode] = useState('browse'); // browse | form | done
    const [position, setPosition] = useState(null);
    const [f, setF] = useState(INITIAL);

    const [locating, setLocating] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [minimized, setMinimized] = useState(false); // ย่อฟอร์มเพื่อปักหมุดบนแผนที่ (มือถือ)
    const set = (patch) => setF((p) => ({ ...p, ...patch }));

    // ค้นหาที่อยู่
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [open, setOpen] = useState(false);
    const [searching, setSearching] = useState(false);
    const searchBoxRef = useRef(null);
    const skipNextSearch = useRef(false);
    const geoReq = useRef(0);

    const loadRequests = () => {
        fetch('/api/help-requests')
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) setRequests(data.filter((r) => r.status !== 'resolved'));
            })
            .catch((err) => console.error('Load help failed:', err));
    };

    useEffect(() => {
        loadRequests();
        const t = setInterval(loadRequests, 30000);
        return () => clearInterval(t);
    }, []);

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

    // Autosuggest
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
                const url = `https://autosuggest.search.hereapi.com/v1/autosuggest?at=${at}&q=${encodeURIComponent(q)}&limit=6&lang=th&in=countryCode:THA&apiKey=${HERE_KEY}`;
                const res = await fetch(url, { signal: ctrl.signal });
                if (!res.ok) throw new Error('search failed');
                const data = await res.json();
                setSuggestions((data.items || []).filter((it) => it.position));
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

    const reverseGeocode = async (lat, lng) => {
        if (!HERE_KEY) return null;
        try {
            const res = await fetch(`https://revgeocode.search.hereapi.com/v1/revgeocode?at=${lat},${lng}&lang=th&apiKey=${HERE_KEY}`);
            const data = await res.json();
            return data.items?.[0]?.address?.label || null;
        } catch {
            return null;
        }
    };

    const fillAddress = async (lat, lng) => {
        const id = ++geoReq.current;
        const label = await reverseGeocode(lat, lng);
        if (!label || id !== geoReq.current) return;
        setF((p) => (p.location_name.trim() ? p : { ...p, location_name: label }));
    };

    const handlePick = (p) => {
        setPosition(p);
        setError('');
        setMinimized(false); // ปักหมุดเสร็จ เด้งฟอร์มกลับมา
        fillAddress(p.lat, p.lng);
    };

    const locateMe = () => {
        setError('');
        if (!('geolocation' in navigator)) return setError('เบราว์เซอร์นี้ไม่รองรับการระบุตำแหน่ง');
        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude: lat, longitude: lng } = pos.coords;
                setPosition({ lat, lng, fly: true });
                setLocating(false);
                fillAddress(lat, lng);
            },
            (err) => {
                setLocating(false);
                if (err.code === 1) setError('ยังไม่ได้อนุญาตใช้ตำแหน่ง');
                else setError('หาตำแหน่งไม่เจอ ลองกด "ปักหมุดบนแผนที่" แล้วแตะแผนที่เอง');
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    };

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

    const startRequest = () => {
        const email = localStorage.getItem('userEmail');
        if (!email) return router.push('/login?next=/help');
        setError('');
        setMinimized(false);
        setMode('form');
        if (!position) locateMe();
    };

    const closeForm = () => {
        setMinimized(false);
        setMode('browse');
    };

    const submit = async () => {
        if (!position) return setError('ยังไม่ได้ปักหมุด กดใช้ตำแหน่งปัจจุบัน หรือ "ปักหมุดบนแผนที่"');
        if (!f.location_name.trim()) return setError('ระบุที่อยู่หรือจุดสังเกต');
        if (f.phone.replace(/\D/g, '').length < 9) return setError('ระบุเบอร์โทรที่ติดต่อได้ (อย่างน้อย 9 หลัก)');

        const email = localStorage.getItem('userEmail');
        if (!email) return router.push('/login?next=/help');

        setSubmitting(true);
        setError('');
        try {
            const res = await fetch('/api/help-requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...f, people_count: Number(f.people_count) || 1, user_email: email, latitude: position.lat, longitude: position.lng }),
            });
            if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'ส่งคำขอไม่สำเร็จ');
            setF(INITIAL);
            setPosition(null);
            setQuery('');
            setMode('done');
            loadRequests();
        } catch (e) {
            setError(e.message);
        } finally {
            setSubmitting(false);
        }
    };

    const selectedWater = WATER_LEVELS.find((w) => w.key === f.water_level);

    return (
        <div className="flex flex-col bg-[#08222C] font-['Noto_Sans_Thai']" style={{ height: `calc(100dvh - ${NAV_H}px - var(--tabbar-h, 0px))` }}>
            <Head>
                <title>ขอความช่วยเหลือ · Hatyai Flood</title>
            </Head>

            <div className="relative flex-1 min-h-0 isolate">
                <div className="absolute inset-0">
                    <HelpMap
                        requests={requests}
                        picking={mode === 'form'}
                        position={position}
                        onPick={handlePick}
                    />
                </div>

                {/* ---------- โหมดดูแผนที่ปกติ ---------- */}
                {mode === 'browse' && (
                    <>
                        <div className="absolute z-[1000] top-3 left-3 md:top-6 md:left-6 pointer-events-none">
                            <div className="pointer-events-auto bg-[#08222C]/90 backdrop-blur-md border border-white/10 rounded-full md:rounded-2xl px-4 py-2 md:p-5 md:w-[340px] shadow-xl">
                                <div className="flex items-center gap-2.5 text-[#F3F8F7]">
                                    <ShieldAlert size={18} className="text-[#FF6B4A] shrink-0" />
                                    <span className="text-sm md:text-base md:font-['Kanit'] md:font-semibold">
                                        {requests.length > 0 ? `${requests.length} จุดรอความช่วยเหลือ` : 'ยังไม่มีคำขอตอนนี้'}
                                    </span>
                                </div>
                                <p className="hidden md:block mt-2 text-sm text-[#F3F8F7]/65 leading-relaxed">
                                    แตะหมุดบนแผนที่เพื่อดูรายละเอียด ถ้าคุณติดอยู่ในพื้นที่ กดปุ่มด้านล่างเพื่อขอความช่วยเหลือ
                                </p>
                            </div>
                        </div>

                        <div className="absolute z-[1000] left-1/2 -translate-x-1/2 bottom-[max(1.5rem,env(safe-area-inset-bottom))] flex gap-3 w-[92%] md:w-auto md:max-w-[600px] justify-center">
                            <button
                                onClick={() => router.push('/my-requests')}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 h-14 px-5 rounded-full bg-[#08222C]/80 backdrop-blur-md border border-white/20 text-[#F3F8F7] font-semibold active:scale-95 transition-transform shadow-[0_4px_15px_rgba(0,0,0,0.3)]"
                            >
                                <List size={20} className="shrink-0" />
                                <span className="hidden md:inline">ดูสถานะคำขอ</span>
                                <span className="md:hidden">สถานะคำขอ</span>
                            </button>

                            <button
                                onClick={startRequest}
                                className="flex-[1.5] md:flex-none flex items-center justify-center gap-2.5 h-14 px-7 rounded-full bg-[#FF6B4A] text-[#08222C] font-semibold text-base shadow-[0_8px_24px_rgba(255,107,74,0.45)] active:scale-95 transition-transform"
                            >
                                <AlertCircle size={22} className="shrink-0" />
                                ขอความช่วยเหลือ
                            </button>
                        </div>
                    </>
                )}

                {/* ---------- ฟอร์มย่อ (ตอนปักหมุดบนแผนที่) ---------- */}
                {mode === 'form' && minimized && (
                    <div className="sheet absolute z-[1000] left-1/2 -translate-x-1/2 bottom-[max(1.5rem,env(safe-area-inset-bottom))] w-[92%] md:hidden flex items-center gap-3 rounded-2xl bg-[#08222C]/95 backdrop-blur-md border border-white/15 p-3 shadow-[0_8px_30px_rgba(0,0,0,0.45)]">
                        <span className="h-10 w-10 shrink-0 grid place-items-center rounded-full bg-[#FF6B4A]/20 text-[#FF6B4A]">
                            <MapPin size={20} />
                        </span>
                        <p className="flex-1 text-sm text-[#F3F8F7] leading-snug">แตะบนแผนที่เพื่อปักหมุดตำแหน่งของคุณ</p>
                        <button onClick={() => setMinimized(false)} className="h-10 px-4 rounded-xl bg-white/10 text-sm text-[#F3F8F7] active:bg-white/20">
                            กรอกต่อ
                        </button>
                    </div>
                )}

                {/* ---------- ฟอร์มขอความช่วยเหลือ ---------- */}
                {(mode === 'done' || (mode === 'form' && !minimized)) && (
                    <section className="sheet absolute z-[1000] inset-x-0 bottom-0 max-h-[92%] md:inset-x-auto md:bottom-auto md:left-6 md:top-6 md:w-[420px] md:max-h-[calc(100%-3rem)] flex flex-col overflow-hidden bg-[#08222C] border border-white/10 rounded-t-[28px] md:rounded-3xl shadow-[0_-12px_40px_rgba(0,0,0,0.45)]">
                        <div className="md:hidden mx-auto mt-2.5 h-1.5 w-11 shrink-0 rounded-full bg-white/20" />

                        {mode === 'form' && (
                            <header className="shrink-0 flex justify-between items-center gap-2 px-5 pt-3 md:pt-5 pb-3">
                                <h2 className="font-['Kanit'] font-semibold text-xl text-[#F3F8F7]">ขอความช่วยเหลือ</h2>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setMinimized(true)}
                                        className="md:hidden h-10 px-3 flex items-center gap-1.5 rounded-full bg-white/10 text-xs text-[#F3F8F7]/85 active:bg-white/20"
                                    >
                                        <ChevronDown size={16} /> ย่อ
                                    </button>
                                    <button onClick={closeForm} aria-label="ปิด" className="h-10 w-10 grid place-items-center rounded-full bg-white/10 text-[#F3F8F7]/80 active:bg-white/20">
                                        <X size={20} />
                                    </button>
                                </div>
                            </header>
                        )}

                        {/* ใช้ space-y (block) แทน flex-col เพื่อให้ช่องกรอกไม่ถูกบีบ */}
                        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 pb-5 pt-1 space-y-5">
                            {mode === 'form' && (
                                <>
                                    <p className="text-xs text-[#FFB09C] bg-[#FF6B4A]/10 border border-[#FF6B4A]/30 rounded-xl px-3.5 py-3 leading-relaxed">
                                        เสี่ยงอันตรายถึงชีวิต โทร <b className="text-[#FF6B4A]">1669</b> (การแพทย์ฉุกเฉิน) หรือ <b className="text-[#FF6B4A]">191</b> ก่อน ระบบนี้ช่วยรวบรวมตำแหน่งให้เจ้าหน้าที่
                                    </p>

                                    {/* ตำแหน่ง */}
                                    <div className="space-y-3">
                                        <div className="flex gap-2">
                                            <button type="button" onClick={locateMe} disabled={locating}
                                                className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl bg-[#1C6E8C] hover:bg-[#2380a1] text-white text-sm font-medium disabled:opacity-60 transition-colors">
                                                <Crosshair size={18} className={locating ? 'animate-spin' : ''} />
                                                {locating ? 'กำลังหา...' : 'ใช้ตำแหน่งปัจจุบัน'}
                                            </button>
                                            <button type="button" onClick={() => setMinimized(true)}
                                                className="md:hidden flex-1 flex items-center justify-center gap-2 h-12 rounded-xl border border-white/20 text-sm font-medium text-[#F3F8F7] active:bg-white/10">
                                                <MapPin size={18} /> ปักหมุดเอง
                                            </button>
                                        </div>

                                        <div
                                            className={`flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs ${position ? 'bg-[#2FBF83]/10 border border-[#2FBF83]/30 text-[#7EE0B5]' : 'bg-white/[0.04] border border-white/10 text-[#F3F8F7]/60'
                                                }`}
                                        >
                                            {position ? <Check size={15} className="shrink-0" /> : <MapPin size={15} className="shrink-0" />}
                                            {position ? 'ปักหมุดตำแหน่งแล้ว' : 'ยังไม่ได้ปักหมุด — แตะบนแผนที่เพื่อเลือกตำแหน่ง'}
                                        </div>

                                        <div className="relative" ref={searchBoxRef}>
                                            <input className={field} placeholder="ค้นหาที่อยู่ / สถานที่ใกล้เคียง"
                                                value={query} onChange={(e) => setQuery(e.target.value)} onFocus={() => suggestions.length && setOpen(true)} />
                                            {searching && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#F3F8F7]/40">ค้นหา...</span>}
                                            {open && suggestions.length > 0 && (
                                                <ul className="absolute z-[2000] left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-xl border border-white/15 bg-[#0d2f3b] shadow-xl">
                                                    {suggestions.map((it, i) => (
                                                        <li key={it.id || i}>
                                                            <button type="button" onClick={() => pickSuggestion(it)} className="w-full text-left px-4 py-3 hover:bg-white/10 border-b border-white/5">
                                                                <div className="text-sm text-[#F3F8F7]">{it.title}</div>
                                                                {it.address?.label && <div className="text-xs text-[#F3F8F7]/50 truncate">{it.address.label}</div>}
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>

                                        <input className={field} placeholder="ที่อยู่ละเอียด เช่น บ้านเลขที่ ซอย..."
                                            value={f.location_name} onChange={(e) => set({ location_name: e.target.value })} />
                                    </div>

                                    {/* ประเภทความช่วยเหลือ — HeroUI Select */}
                                    <div>
                                        <label className={labelCls}>ประเภทความช่วยเหลือ</label>
                                        <Select
                                            aria-label="ประเภทความช่วยเหลือ"
                                            variant="bordered"
                                            disallowEmptySelection
                                            selectedKeys={[f.help_type]}
                                            onSelectionChange={(keys) => {
                                                const v = Array.from(keys)[0];
                                                if (v) set({ help_type: String(v) });
                                            }}
                                            // popover ต้องสูงกว่าฟอร์ม (z-1000) และแผนที่ ไม่งั้นจะถูกบัง
                                            popoverProps={{
                                                classNames: {
                                                    base: 'z-[10100]',
                                                    content: 'rounded-xl border border-white/15 bg-[#0d2f3b] p-1 text-[#F3F8F7] shadow-xl',
                                                },
                                            }}
                                            listboxProps={{
                                                itemClasses: {
                                                    base: 'rounded-lg px-3 py-2.5 text-[#F3F8F7] data-[hover=true]:bg-white/10 data-[hover=true]:text-white data-[selectable=true]:focus:bg-white/10 data-[selected=true]:bg-[#1C6E8C]/40',
                                                    title: 'text-sm',
                                                    selectedIcon: 'text-[#7CCBE6]',
                                                },
                                            }}
                                            classNames={{
                                                trigger:
                                                    'h-12 min-h-12 rounded-xl border border-white/15 bg-white/[0.06] px-4 shadow-none data-[hover=true]:bg-white/10 data-[open=true]:border-[#1C6E8C] data-[focus=true]:border-[#1C6E8C] transition-colors',
                                                value: 'text-base text-[#F3F8F7] group-data-[has-value=true]:text-[#F3F8F7]',
                                                selectorIcon: 'text-[#F3F8F7]/50',
                                            }}
                                        >
                                            {Object.entries(HELP_TYPES).map(([k, v]) => (
                                                <SelectItem key={k}>{v}</SelectItem>
                                            ))}
                                        </Select>
                                    </div>

                                    <div>
                                        <label className={labelCls}>ความเร่งด่วน</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {Object.entries(URGENCY).map(([k, u]) => {
                                                const on = f.urgency === k;
                                                return (
                                                    <button key={k} type="button" onClick={() => set({ urgency: k })}
                                                        className="flex items-center justify-center gap-1.5 h-11 text-sm rounded-xl border transition-colors"
                                                        style={{
                                                            borderColor: on ? u.color : 'rgba(255,255,255,0.15)',
                                                            background: on ? `${u.color}33` : 'transparent',
                                                            color: on ? '#fff' : 'rgba(243,248,247,0.6)',
                                                        }}>
                                                        <span className="h-2 w-2 rounded-full" style={{ background: u.color }} />
                                                        {u.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* ระดับน้ำ — ปุ่มกดเลือก */}
                                    <div>
                                        <label className={labelCls}>ระดับน้ำตอนนี้</label>
                                        <div className="grid grid-cols-5 gap-1.5" role="radiogroup" aria-label="ระดับน้ำ">
                                            {WATER_LEVELS.map((w) => {
                                                const on = f.water_level === w.key;
                                                return (
                                                    <button
                                                        key={w.key}
                                                        type="button"
                                                        role="radio"
                                                        aria-checked={on}
                                                        onClick={() => set({ water_level: on ? '' : w.key })}
                                                        className={`flex flex-col items-center gap-1.5 rounded-xl border px-1 pb-2 pt-2.5 transition-all duration-200 active:scale-95 ${on ? '-translate-y-0.5' : 'hover:bg-white/5'}`}
                                                        style={{
                                                            borderColor: on ? w.color : 'rgba(255,255,255,0.15)',
                                                            background: on ? `${w.color}26` : 'transparent',
                                                            boxShadow: on ? `0 6px 16px -6px ${w.color}99` : 'none',
                                                        }}
                                                    >
                                                        {/* แท่งแสดงความสูงน้ำเทียบกับตัวคน */}
                                                        <span className="relative block h-11 w-6 overflow-hidden rounded-md border border-white/20 bg-white/[0.05]">
                                                            <span
                                                                className={`absolute inset-x-0 bottom-0 block transition-all duration-500 ease-out ${on ? 'bob' : ''}`}
                                                                style={{
                                                                    height: `${w.fill}%`,
                                                                    background: w.color,
                                                                    opacity: on ? 1 : 0.4,
                                                                }}
                                                            />
                                                        </span>
                                                        <span
                                                            className="text-[11px] font-medium leading-none"
                                                            style={{ color: on ? '#fff' : 'rgba(243,248,247,0.65)' }}
                                                        >
                                                            {w.label}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <p className={`mt-1.5 min-h-[1rem] text-xs transition-opacity duration-200 ${selectedWater ? 'opacity-100 text-[#F3F8F7]/60' : 'opacity-0'}`}>
                                            {selectedWater ? `ระดับน้ำ${selectedWater.label} (${selectedWater.hint})` : ' '}
                                        </p>
                                    </div>

                                    {/* จำนวนคน + ชื่อ */}
                                    <div className="grid grid-cols-[auto_1fr] gap-3">
                                        <div>
                                            <label className={labelCls}>จำนวนคน</label>
                                            <div className="flex items-center h-12 rounded-xl border border-white/15 bg-white/[0.06]">
                                                <button type="button" aria-label="ลดจำนวนคน"
                                                    onClick={() => set({ people_count: Math.max(1, (Number(f.people_count) || 1) - 1) })}
                                                    className="h-12 w-11 grid place-items-center text-[#F3F8F7]/80 active:bg-white/10 rounded-l-xl">
                                                    <Minus size={18} />
                                                </button>
                                                <span className="w-8 text-center text-base font-semibold text-[#F3F8F7]">{f.people_count}</span>
                                                <button type="button" aria-label="เพิ่มจำนวนคน"
                                                    onClick={() => set({ people_count: Math.min(200, (Number(f.people_count) || 1) + 1) })}
                                                    className="h-12 w-11 grid place-items-center text-[#F3F8F7]/80 active:bg-white/10 rounded-r-xl">
                                                    <Plus size={18} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="min-w-0">
                                            <label className={labelCls}>ชื่อผู้ติดต่อ</label>
                                            <input className={field} value={f.contact_name} onChange={(e) => set({ contact_name: e.target.value })} />
                                        </div>
                                    </div>

                                    {/* สวิตช์ผู้เปราะบาง */}
                                    <label className="flex items-center justify-between gap-3 min-h-14 px-4 py-2 rounded-xl border border-white/15 cursor-pointer">
                                        <span className="flex items-center gap-3 text-sm text-[#F3F8F7]/90">
                                            <HeartPulse size={20} className="shrink-0 text-[#FF6B4A]" />
                                            มีผู้สูงอายุ เด็กเล็ก หรือผู้ป่วยติดเตียง
                                        </span>
                                        <input type="checkbox" className="peer sr-only" checked={f.has_vulnerable}
                                            onChange={(e) => set({ has_vulnerable: e.target.checked })} />
                                        <span className="relative h-7 w-12 shrink-0 rounded-full bg-white/20 transition-colors peer-checked:bg-[#FF6B4A] peer-focus-visible:ring-2 peer-focus-visible:ring-[#7CCBE6] after:absolute after:left-0.5 after:top-0.5 after:h-6 after:w-6 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5" />
                                    </label>

                                    <div>
                                        <label className={labelCls}>รายละเอียดเพิ่มเติม</label>
                                        <textarea rows={3} className={`${fieldBase} py-3 resize-none`} placeholder="เช่น ยาที่ต้องใช้ ทางเข้าบ้าน"
                                            value={f.details} onChange={(e) => set({ details: e.target.value })} />
                                    </div>

                                    <div>
                                        <label className={labelCls}>เบอร์โทรที่ติดต่อได้ *</label>
                                        <div className="relative">
                                            <Phone size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#F3F8F7]/40" />
                                            <input type="tel" inputMode="tel" className={`${field} pl-11`} placeholder="08X-XXX-XXXX"
                                                value={f.phone} onChange={(e) => set({ phone: e.target.value })} />
                                        </div>
                                    </div>
                                </>
                            )}

                            {mode === 'done' && (
                                <div className="flex flex-col items-center text-center gap-3 py-8">
                                    <div className="pop h-16 w-16 grid place-items-center rounded-full bg-[#2FBF83] text-[#08222C]">
                                        <Check size={32} strokeWidth={3} />
                                    </div>
                                    <h2 className="font-['Kanit'] font-semibold text-xl text-[#F3F8F7]">ส่งคำขอแล้ว</h2>
                                    <p className="text-sm text-[#F3F8F7]/65 leading-relaxed max-w-xs">
                                        ระบบได้รับคำขอแล้ว คุณสามารถติดตามสถานะการช่วยเหลือได้ที่เมนู "ดูสถานะคำขอ"
                                    </p>
                                </div>
                            )}
                        </div>

                        <footer className="shrink-0 px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-white/10 space-y-3 bg-[#08222C]">
                            {error && (
                                <p className="flex items-start gap-2 text-sm text-[#FF6B4A] bg-[#FF6B4A]/10 rounded-xl px-3 py-2.5">
                                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                    <span>{error}</span>
                                </p>
                            )}
                            {mode === 'form' && (
                                <button onClick={submit} disabled={submitting}
                                    className="w-full h-12 rounded-xl bg-[#FF6B4A] text-[#08222C] font-semibold active:bg-[#ff805f] disabled:opacity-60 transition-colors">
                                    {submitting ? 'กำลังส่งข้อมูล...' : 'ยืนยันการขอความช่วยเหลือ'}
                                </button>
                            )}
                            {mode === 'done' && (
                                <div className="flex gap-3">
                                    <button onClick={() => router.push('/my-requests')} className="flex-1 h-12 rounded-xl bg-[#FF6B4A] text-[#08222C] font-semibold">
                                        ดูสถานะคำขอ
                                    </button>
                                    <button onClick={() => setMode('browse')} className="flex-1 h-12 rounded-xl border border-white/15 text-[#F3F8F7]">
                                        กลับไปที่แผนที่
                                    </button>
                                </div>
                            )}
                        </footer>
                    </section>
                )}
            </div>

            <style jsx>{`
                .sheet { animation: sheet-up 0.3s cubic-bezier(0.22, 1, 0.36, 1); }
                .fade { animation: fade-in 0.25s ease-out; }
                .row { animation: row-in 0.35s ease-out both; }
                .pop { animation: pop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1); }
                .ping { animation: ping 1.6s cubic-bezier(0, 0, 0.2, 1) infinite; }
                .bob { animation: bob 2s ease-in-out infinite; }
                @keyframes sheet-up {
                    from { transform: translateY(32px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                @keyframes row-in {
                    from { transform: translateY(8px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes pop {
                    from { transform: scale(0.4); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                @keyframes ping {
                    75%, 100% { transform: scale(2.2); opacity: 0; }
                }
                @keyframes bob {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(2px); }
                }
                @media (prefers-reduced-motion: reduce) {
                    .sheet, .fade, .row, .pop, .ping, .bob, .breathe, .flicker, .wiggle, .ring-shake, .ring-shake::after, .shine { animation: none; }
                }
            `}</style>
        </div>
    );
}