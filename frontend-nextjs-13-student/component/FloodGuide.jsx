import { useState, useEffect } from 'react';
import Link from 'next/link';

const TABS = [
    { id: 'before', label: 'ก่อนน้ำมา' },
    { id: 'during', label: 'ระหว่างน้ำท่วม' },
    { id: 'after', label: 'หลังน้ำลด' },
];

const CONTENT = {
    before: {
        checklist: {
            key: 'before',
            title: 'เตรียมถุงยังชีพ',
            items: [
                'น้ำดื่มสะอาด',
                'อาหารแห้ง / อาหารกระป๋อง',
                'ยาประจำตัวและยาสามัญ',
                'ไฟฉายและถ่านสำรอง',
                'พาวเวอร์แบงก์ชาร์จเต็ม',
                'เอกสารสำคัญใส่ถุงกันน้ำ',
                'เสื้อผ้า ผ้าห่ม ของใช้ส่วนตัว',
            ],
        },
        boxes: [
            {
                tone: 'yellow',
                title: 'ข้อควรระวัง',
                items: [
                    'ปิดไฟฟ้าหากน้ำเริ่มเข้าบ้าน และไม่แตะอุปกรณ์ไฟฟ้าขณะเปียก',
                    'ไม่เดินหรือขับรถในน้ำไหลแรงหรือไม่รู้ความลึก',
                    'ดื่มน้ำสะอาดหรือน้ำต้มสุกเท่านั้น',
                ],
            },
        ],
        buttons: [
            { label: 'ดูแผนที่ศูนย์พักพิง/ฝากรถ', href: '/', primary: true },
            { label: 'แผนที่ขอความช่วยเหลือ', href: '/help' },
        ],
        // footerLink: { label: 'สำหรับจิตอาสา/เจ้าหน้าที่ →', href: '/help' },
    },
    during: {
        boxes: [
            {
                tone: 'green',
                title: 'ทำทันที',
                items: [
                    'ย้ายของมีค่าและเอกสารขึ้นที่สูง',
                    'ถอดปลั๊กและปิดสวิตช์ไฟ ถ้าน้ำเริ่มเข้าบ้าน',
                    'ติดตามประกาศจากหน่วยงานทางการ',
                    'แจ้งญาติว่าคุณอยู่ที่ไหน',
                ],
            },
            {
                tone: 'red',
                title: 'ห้ามทำ',
                items: [
                    'ลุยน้ำที่ไหลแรงหรือไม่รู้ความลึก',
                    'ขับรถลุยน้ำท่วมสูง',
                    'แตะอุปกรณ์ไฟฟ้าขณะตัวเปียก',
                ],
            },
            {
                tone: 'yellow',
                title: 'ควรอพยพเมื่อ',
                items: [
                    'น้ำเข้าบ้านและสูงขึ้นเร็ว',
                    'มีผู้ป่วย ผู้สูงอายุ หรือเด็กเล็กที่ต้องการความช่วยเหลือ',
                ],
            },
        ],
        buttons: [
            { label: 'ศูนย์พักพิงใกล้ฉัน', href: '/', primary: true },
            { label: 'โทร 1784', href: 'tel:1784', external: true },
        ],
    },
    after: {
        checklist: {
            key: 'after',
            title: 'ก่อนกลับเข้าบ้าน',
            items: [
                'ตรวจโครงสร้างบ้านและรอยแตกร้าว',
                'ให้ช่างไฟตรวจก่อนเปิดไฟฟ้า',
                'สวมรองเท้าบูทและถุงมือตอนทำความสะอาด',
                'ทิ้งอาหารที่ถูกน้ำท่วม',
                'ดื่มน้ำสะอาดหรือน้ำต้มสุก',
                'ถ่ายรูปความเสียหายไว้เป็นหลักฐาน',
            ],
        },
        boxes: [
            {
                tone: 'yellow',
                title: 'ระวังสุขภาพ',
                items: [
                    'ล้างแผลและเท้าให้สะอาดทุกครั้งหลังลุยน้ำ',
                    'มีไข้ ปวดน่อง หรือตาแดง ให้รีบพบแพทย์',
                ],
            },
            {
                tone: 'blue',
                title: 'ขอรับการเยียวยา',
                items: [
                    'ติดต่อเทศบาล / อบต. / ที่ว่าการอำเภอในพื้นที่',
                    'เตรียมรูปถ่ายความเสียหายและบัตรประชาชน',
                ],
            },
        ],
        buttons: [
            { label: 'ดูแผนที่ศูนย์พักพิง/ฝากรถ', href: '/', primary: true },
            { label: 'แผนที่ขอความช่วยเหลือ', href: '/help' },
        ],
    },
};

const TONES = {
    green: { bg: 'bg-[#E3F4EA]', border: 'border-[#9AD7B2]', title: 'text-[#17683A]', dot: 'bg-[#2FA566]' },
    red: { bg: 'bg-[#FDE8E6]', border: 'border-[#F2A9A2]', title: 'text-[#B3261E]', dot: 'bg-[#D9453B]' },
    yellow: { bg: 'bg-[#FFF3D6]', border: 'border-[#F4D58A]', title: 'text-[#8A5A00]', dot: 'bg-[#D99A1B]' },
    blue: { bg: 'bg-[#E6EEFB]', border: 'border-[#AFC6EE]', title: 'text-[#1F4E9C]', dot: 'bg-[#3C74D6]' },
};

const STORAGE_KEY = 'floodGuideChecks';

export default function FloodGuide({ onNavigate }) {
    const [tab, setTab] = useState(0);
    const [checks, setChecks] = useState({});

    // โหลด/บันทึกสถานะติ๊กถูก (ใช้งานต่อได้แม้ปิดเว็บ)
    useEffect(() => {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
            setChecks(saved);
        } catch { /* ignore */ }
    }, []);

    const toggle = (key, idx) => {
        setChecks((prev) => {
            const list = new Set(prev[key] || []);
            list.has(idx) ? list.delete(idx) : list.add(idx);
            const next = { ...prev, [key]: [...list] };
            try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
            return next;
        });
    };

    const current = CONTENT[TABS[tab].id];

    return (
        <div className="font-['Noto_Sans_Thai'] text-[#0B2A3C]">
            <h2 className="font-['Kanit'] text-2xl font-semibold">คู่มือรับมือน้ำท่วม</h2>
            <p className="mt-0.5 text-xs text-[#0B2A3C]/50">เก็บไว้อ่านตอนไม่มีอินเทอร์เน็ตได้</p>

            {/* แท็บ + ตัวเลื่อนพื้นหลังสีขาว */}
            <div className="relative mt-4 grid grid-cols-3 rounded-xl bg-[#E6ECF0] p-1">
                <span
                    aria-hidden="true"
                    className="absolute bottom-1 left-1 top-1 rounded-lg bg-white shadow-sm transition-transform duration-300 ease-[cubic-bezier(.4,1.3,.5,1)]"
                    style={{ width: 'calc((100% - 8px) / 3)', transform: `translateX(${tab * 100}%)` }}
                />
                {TABS.map((t, i) => (
                    <button
                        key={t.id}
                        type="button"
                        onClick={() => setTab(i)}
                        className={`relative z-10 rounded-lg py-2 text-[13px] font-medium transition-colors duration-200 ${tab === i ? 'text-[#0B2A3C]' : 'text-[#0B2A3C]/55'}`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* เนื้อหา — key เปลี่ยนแล้วเล่นแอนิเมชันใหม่ทุกครั้งที่เปลี่ยนแท็บ */}
            <div key={tab} className="mt-4 flex flex-col gap-3">
                {current.checklist && (
                    <Checklist
                        data={current.checklist}
                        checked={checks[current.checklist.key] || []}
                        onToggle={(i) => toggle(current.checklist.key, i)}
                    />
                )}

                {current.boxes.map((box, bi) => {
                    const t = TONES[box.tone];
                    return (
                        <div
                            key={box.title}
                            className={`fg-rise rounded-xl border ${t.bg} ${t.border} p-3.5`}
                            style={{ animationDelay: `${(bi + (current.checklist ? 1 : 0)) * 90}ms` }}
                        >
                            <h3 className={`mb-2 text-sm font-semibold ${t.title}`}>{box.title}</h3>
                            <ul className="flex flex-col gap-1.5">
                                {box.items.map((it) => (
                                    <li key={it} className="flex items-start gap-2 text-[13px] leading-snug">
                                        <span className={`mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full ${t.dot}`} />
                                        <span className={t.title}>{it}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    );
                })}

                <div className="fg-rise mt-1 grid grid-cols-2 gap-2.5" style={{ animationDelay: '320ms' }}>
                    {current.buttons.map((b) => {
                        const cls = `grid h-12 place-items-center rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95 ${b.primary
                            ? 'bg-[#0B3550] text-white shadow-md hover:-translate-y-0.5 hover:shadow-lg'
                            : 'border border-[#0B3550]/10 bg-white text-[#0B3550] hover:-translate-y-0.5 hover:shadow-md'
                            }`;
                        return b.external ? (
                            <a key={b.label} href={b.href} className={cls}>{b.label}</a>
                        ) : (
                            <Link key={b.label} href={b.href} onClick={onNavigate} className={cls}>{b.label}</Link>
                        );
                    })}
                </div>

                {current.footerLink && (
                    <Link
                        href={current.footerLink.href}
                        onClick={onNavigate}
                        className="fg-rise mt-1 text-center text-xs text-[#1F4E9C] underline underline-offset-4"
                        style={{ animationDelay: '380ms' }}
                    >
                        {current.footerLink.label}
                    </Link>
                )}
            </div>

            <style jsx global>{`
                @keyframes fg-rise {
                    from { opacity: 0; transform: translateY(12px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .fg-rise { opacity: 0; animation: fg-rise 0.4s ease-out forwards; }
                @keyframes fg-pop {
                    0% { transform: scale(1); }
                    45% { transform: scale(1.3); }
                    100% { transform: scale(1); }
                }
                .fg-pop { animation: fg-pop 0.3s ease-out; }
                @keyframes fg-draw {
                    from { stroke-dashoffset: 24; }
                    to { stroke-dashoffset: 0; }
                }
                .fg-draw { stroke-dasharray: 24; animation: fg-draw 0.3s ease-out forwards; }
                @media (prefers-reduced-motion: reduce) {
                    .fg-rise, .fg-pop, .fg-draw { animation: none; opacity: 1; }
                }
            `}</style>
        </div>
    );
}

function Checklist({ data, checked, onToggle }) {
    const total = data.items.length;
    const done = checked.length;
    const pct = (done / total) * 100;

    return (
        <div className="fg-rise rounded-xl border border-[#0B3550]/10 bg-white p-3.5 shadow-sm">
            <div className="mb-1 flex items-center justify-between">
                <h3 className="font-['Kanit'] text-[15px] font-semibold">{data.title}</h3>
                <span className="text-xs font-medium text-[#0B3550]/60">{done} / {total}</span>
            </div>

            {/* แถบความคืบหน้า */}
            <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-[#E6ECF0]">
                <div
                    className={`h-full rounded-full transition-all duration-500 ease-out ${done === total ? 'bg-[#2FA566]' : 'bg-[#3FAE6A]'}`}
                    style={{ width: `${pct}%` }}
                />
            </div>

            <ul>
                {data.items.map((label, i) => {
                    const on = checked.includes(i);
                    return (
                        <li key={label}>
                            <button
                                type="button"
                                onClick={() => onToggle(i)}
                                className="flex w-full items-center gap-3 rounded-lg px-1 py-2 text-left transition-colors hover:bg-[#F3F6F8] active:bg-[#E6ECF0]"
                            >
                                <span
                                    key={on ? 'on' : 'off'}
                                    className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 transition-colors duration-200 ${on ? 'fg-pop border-[#3FAE6A] bg-[#3FAE6A]' : 'border-[#0B3550]/25 bg-white'}`}
                                >
                                    {on && (
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                            <path className="fg-draw" d="M2 6.5l2.5 2.5L10 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    )}
                                </span>
                                <span className={`text-sm transition-all duration-200 ${on ? 'text-[#0B3550]/45 line-through' : ''}`}>{label}</span>
                            </button>
                        </li>
                    );
                })}
            </ul>

            {done === total && (
                <p className="fg-rise mt-1 text-center text-xs font-medium text-[#17683A]">เตรียมครบแล้ว 🎉</p>
            )}
        </div>
    );
}