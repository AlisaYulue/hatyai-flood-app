// pages/my-requests.jsx
import { useCallback, useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { AlertCircle, ArrowLeft, Check, ChevronDown, MapPin, Phone, Plus, RefreshCw } from 'lucide-react';
import { HELP_TYPES, URGENCY, STATUS_LABEL } from '../component/help-meta';

// ต้องตรงกับ CANCEL_NOTE ใน pages/api/my-help-requests.js
const CANCEL_NOTE = 'ผู้แจ้งยกเลิกเอง';

// ไทม์ไลน์: ขั้นแรก "ส่งคำขอแล้ว" เสมอ ที่เหลือผูกกับสถานะในฐานข้อมูล
const STEPS = [
    { label: 'ส่งคำขอแล้ว', hint: 'ระบบได้รับข้อมูลของคุณแล้ว' },
    { label: 'รอผู้ดูแลตรวจสอบ', hint: 'ผู้ดูแลระบบกำลังตรวจสอบข้อมูลและตำแหน่ง' },
    { label: 'ตรวจสอบแล้ว รอผู้ช่วยเหลือ', hint: 'หมุดของคุณขึ้นบนแผนที่ให้อาสาสมัครเห็นแล้ว' },
    { label: 'กำลังช่วยเหลือ', hint: 'มีผู้รับเรื่องแล้ว กำลังประสานงานเข้าไปหาคุณ' },
    { label: 'ช่วยเหลือแล้ว', hint: 'คำขอนี้ปิดเรียบร้อยแล้ว' },
];
const CURRENT_INDEX = { pending: 1, open: 2, in_progress: 3, resolved: 4 };
const ACTIVE = ['pending', 'open', 'in_progress'];

const STATUS_TONE = {
    pending: { c: '#E0B84C' },
    open: { c: '#FF6B4A' },
    in_progress: { c: '#7CCBE6' },
    resolved: { c: '#2FBF83' },
};

const fmt = (d) =>
    d
        ? new Date(d).toLocaleString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
        : '';
const refCode = (id) => `HY-${String(id).padStart(4, '0')}`;

/* แถบความคืบหน้าแบบแบ่งช่อง — อ่านได้เร็วบนมือถือ */
function ProgressBar({ r }) {
    const cur = CURRENT_INDEX[r.status] ?? 0;
    const closed = r.status === 'resolved';
    return (
        <div className="flex gap-1.5" role="progressbar" aria-valuemin={0} aria-valuemax={STEPS.length - 1} aria-valuenow={cur}>
            {STEPS.map((s, i) => {
                const done = i < cur || (i === cur && closed);
                const current = i === cur && !closed;
                return (
                    <span key={s.label} className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                        {(done || current) && (
                            <span
                                className={`seg-fill absolute inset-0 rounded-full ${current ? 'seg-current' : ''}`}
                                style={{ background: done ? '#2FBF83' : '#FF6B4A', animationDelay: `${i * 90}ms` }}
                            />
                        )}
                    </span>
                );
            })}
        </div>
    );
}

function Timeline({ r }) {
    const cur = CURRENT_INDEX[r.status] ?? 0;
    const closed = r.status === 'resolved';

    return (
        <ol className="pt-1">
            {STEPS.map((s, i) => {
                const state = i < cur || (i === cur && closed) ? 'done' : i === cur ? 'current' : 'todo';
                const last = i === STEPS.length - 1;
                return (
                    <li key={s.label} className="flex gap-3">
                        <div className="flex flex-col items-center">
                            {state === 'done' && (
                                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#2FBF83] text-[#08222C]">
                                    <Check size={14} strokeWidth={3} />
                                </span>
                            )}
                            {state === 'current' && (
                                <span className="relative grid h-6 w-6 shrink-0 place-items-center">
                                    <span className="dot-pulse absolute inset-0 rounded-full bg-[#FF6B4A]" />
                                    <span className="relative grid h-6 w-6 place-items-center rounded-full border-[3px] border-[#FF6B4A] bg-[#08222C]">
                                        <span className="h-2 w-2 rounded-full bg-[#FF6B4A]" />
                                    </span>
                                </span>
                            )}
                            {state === 'todo' && <span className="h-6 w-6 shrink-0 rounded-full border-2 border-white/15" />}
                            {!last && (
                                <span className={`my-1 min-h-[22px] w-0.5 flex-1 rounded-full ${i < cur ? 'bg-[#2FBF83]' : 'bg-white/10'}`} />
                            )}
                        </div>

                        <div className={last ? '' : 'pb-4'}>
                            <div className={`text-[15px] leading-6 ${state === 'todo' ? 'text-[#F3F8F7]/35' : 'font-medium text-[#F3F8F7]'}`}>
                                {s.label}
                            </div>
                            {i === 0 && <div className="text-xs text-[#F3F8F7]/50">{fmt(r.created_at)}</div>}
                            {state === 'current' && (
                                <div className="text-xs leading-relaxed text-[#F3F8F7]/60">
                                    {s.hint}
                                    {r.updated_at && ` · อัปเดต ${fmt(r.updated_at)}`}
                                </div>
                            )}
                        </div>
                    </li>
                );
            })}
        </ol>
    );
}

function RequestCard({ r, index, confirming, busy, onAskCancel, onConfirmCancel, onKeep }) {
    const [open, setOpen] = useState(false);
    const u = URGENCY[r.urgency] || { label: r.urgency, color: '#FF6B4A' };
    const isRejected = r.status === 'rejected';
    const selfCancelled = isRejected && r.admin_note === CANCEL_NOTE;
    const canCancel = r.status === 'pending' || r.status === 'open';
    const cur = CURRENT_INDEX[r.status] ?? 0;
    const closed = r.status === 'resolved';
    const tone = STATUS_TONE[r.status]?.c || '#F3F8F7';
    const step = STEPS[closed ? STEPS.length - 1 : cur];

    return (
        <article
            className="rise relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.045] p-5 pl-6"
            style={{ '--i': index, opacity: isRejected ? 0.9 : 1 }}
        >
            {/* แถบสีด้านซ้ายบอกความเร่งด่วน */}
            <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1.5" style={{ background: isRejected ? 'rgba(255,255,255,0.15)' : u.color }} />

            {/* แถวบน: สถานะ + รหัส */}
            <div className="flex items-center justify-between gap-2">
                {isRejected ? (
                    <span className="rounded-full border border-white/20 px-2.5 py-1 text-xs text-[#F3F8F7]/65">
                        {selfCancelled ? 'ยกเลิกแล้ว' : 'ไม่ผ่านการตรวจสอบ'}
                    </span>
                ) : (
                    <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
                        style={{ background: `${tone}22`, color: tone, border: `1px solid ${tone}44` }}
                    >
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: tone }} />
                        {STATUS_LABEL[r.status] || r.status}
                    </span>
                )}
                <span className="font-['JetBrains_Mono'] text-[11px] text-[#F3F8F7]/40">{refCode(r.id)}</span>
            </div>

            {/* หัวเรื่อง */}
            <h2 className="mt-3 font-['Kanit'] text-[19px] font-medium leading-snug text-[#F3F8F7]">
                {HELP_TYPES[r.help_type] || r.help_type}
                <span className="text-[#F3F8F7]/50"> · {r.people_count} คน</span>
            </h2>
            <p className="mt-1.5 flex items-start gap-1.5 text-sm leading-relaxed text-[#F3F8F7]/60">
                <MapPin size={15} className="mt-1 shrink-0" style={{ color: isRejected ? undefined : u.color }} />
                <span className="min-w-0 break-words">{r.location_name}</span>
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-[#F3F8F7]/40">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: u.color }} />
                {u.label} · ส่งเมื่อ {fmt(r.created_at)}
            </p>

            {isRejected ? (
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm leading-relaxed text-[#F3F8F7]/70">
                    {selfCancelled
                        ? 'คุณยกเลิกคำขอนี้แล้ว หากยังต้องการความช่วยเหลือ ส่งคำขอใหม่ได้เลย'
                        : `คำขอนี้ไม่ผ่านการตรวจสอบ${r.admin_note ? `: ${r.admin_note}` : ''} หากยังต้องการความช่วยเหลือ ส่งคำขอใหม่พร้อมข้อมูลที่ครบถ้วนได้`}
                </div>
            ) : (
                <div className="mt-5">
                    <ProgressBar r={r} />
                    <div className="mt-3 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <div className="text-[15px] font-medium text-[#F3F8F7]">{step.label}</div>
                            <div className="mt-0.5 text-xs leading-relaxed text-[#F3F8F7]/55">
                                {step.hint}
                                {r.updated_at && !closed && ` · อัปเดต ${fmt(r.updated_at)}`}
                            </div>
                        </div>
                    </div>

                    {/* ดูความคืบหน้าทั้งหมด (ขยาย/ย่อแบบนุ่มๆ) */}
                    <button
                        type="button"
                        onClick={() => setOpen((v) => !v)}
                        aria-expanded={open}
                        className="mt-3 flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-white/[0.05] text-sm text-[#F3F8F7]/75 active:bg-white/10 transition-colors"
                    >
                        {open ? 'ซ่อนความคืบหน้า' : 'ดูความคืบหน้าทั้งหมด'}
                        <ChevronDown size={16} className={`transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
                    </button>
                    <div className={`expand ${open ? 'expand-open' : ''}`}>
                        <div className="overflow-hidden">
                            <div className="pt-4">
                                <Timeline r={r} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {canCancel && (
                <div className="mt-4 border-t border-white/10 pt-3">
                    {confirming ? (
                        <div className="rise-sm flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <span className="text-sm text-[#F3F8F7]/75">ยกเลิกคำขอนี้?</span>
                            <div className="flex gap-2">
                                <button
                                    onClick={onKeep}
                                    className="h-11 flex-1 rounded-xl border border-white/15 px-4 text-sm text-[#F3F8F7]/85 active:bg-white/10 sm:flex-none"
                                >
                                    ไม่ยกเลิก
                                </button>
                                <button
                                    onClick={onConfirmCancel}
                                    disabled={busy}
                                    className="h-11 flex-1 rounded-xl bg-[#E5383B] px-4 text-sm font-medium text-white disabled:opacity-60 sm:flex-none"
                                >
                                    {busy ? 'กำลังยกเลิก...' : 'ยืนยันยกเลิก'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button onClick={onAskCancel} className="min-h-10 text-sm text-[#E5383B]/90 active:opacity-70">
                            ยกเลิกคำขอ
                        </button>
                    )}
                </div>
            )}
        </article>
    );
}

export default function MyRequestsPage() {
    const router = useRouter();
    const [email, setEmail] = useState(null);
    const [requests, setRequests] = useState(null); // null = กำลังโหลดครั้งแรก
    const [error, setError] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [updatedAt, setUpdatedAt] = useState(null);
    const [confirmId, setConfirmId] = useState(null);
    const [busyId, setBusyId] = useState(null);

    const load = useCallback(async (mail, silent = false) => {
        if (!silent) setRefreshing(true);
        try {
            const res = await fetch(`/api/my-help-requests?email=${encodeURIComponent(mail)}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'โหลดข้อมูลไม่สำเร็จ');
            setRequests(data);
            setError('');
            setUpdatedAt(new Date());
        } catch (e) {
            setError(e.message);
            setRequests((prev) => prev ?? []);
        } finally {
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        const mail = localStorage.getItem('userEmail');
        if (!mail) {
            router.replace('/login?next=/my-requests');
            return;
        }
        setEmail(mail);
        load(mail, true);

        const timer = setInterval(() => load(mail, true), 20000);
        const onVisible = () => document.visibilityState === 'visible' && load(mail, true);
        document.addEventListener('visibilitychange', onVisible);
        return () => {
            clearInterval(timer);
            document.removeEventListener('visibilitychange', onVisible);
        };
    }, [router, load]);

    const cancelRequest = async (id) => {
        setBusyId(id);
        setError('');
        try {
            const res = await fetch('/api/my-help-requests', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, user_email: email }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || 'ยกเลิกไม่สำเร็จ');
            setConfirmId(null);
            await load(email, true);
        } catch (e) {
            setError(e.message);
        } finally {
            setBusyId(null);
        }
    };

    if (!email) return <div className="min-h-screen bg-[#08222C]" />;

    const list = requests || [];
    const activeCount = list.filter((r) => ACTIVE.includes(r.status)).length;
    const hasActive = activeCount > 0;

    return (
        <div className="min-h-[calc(100dvh-72px)] bg-[#08222C] font-['Noto_Sans_Thai']">
            <Head>
                <title>คำขอของฉัน · Hatyai Flood</title>
            </Head>

            <main className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 pb-[calc(var(--tabbar-h,0px)+6rem)] pt-4">
                {/* หัวหน้า */}
                <header className="flex items-center gap-3">
                    <Link
                        href="/help"
                        aria-label="กลับแผนที่"
                        className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/[0.07] text-[#F3F8F7] active:bg-white/15 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <div className="min-w-0 flex-1">
                        <h1 className="font-['Kanit'] text-2xl font-semibold leading-tight text-[#F3F8F7]">คำขอของฉัน</h1>
                        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-[#F3F8F7]/50">
                            <span className="relative flex h-2 w-2">
                                <span className="dot-pulse absolute inline-flex h-full w-full rounded-full bg-[#2FBF83]" />
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#2FBF83]" />
                            </span>
                            {updatedAt
                                ? `อัปเดตล่าสุด ${updatedAt.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} · รีเฟรชอัตโนมัติ`
                                : 'กำลังโหลด...'}
                        </p>
                    </div>
                    <button
                        onClick={() => load(email)}
                        disabled={refreshing}
                        aria-label="อัปเดตสถานะ"
                        className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/[0.07] text-[#F3F8F7] active:bg-white/15 disabled:opacity-60 transition-colors"
                    >
                        <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                    </button>
                </header>

                {/* แบนเนอร์ฉุกเฉิน (แสดงเมื่อมีคำขอที่ยังดำเนินการอยู่) */}
                {hasActive && (
                    <section className="rise rounded-3xl border border-[#FF6B4A]/30 bg-gradient-to-br from-[#FF6B4A]/15 to-[#FF6B4A]/5 p-4" style={{ '--i': 0 }}>
                        <p className="flex items-start gap-2.5 text-sm leading-relaxed text-[#FFB09C]">
                            <AlertCircle size={18} className="mt-0.5 shrink-0 text-[#FF6B4A]" />
                            ถ้าอาการแย่ลงหรือน้ำสูงขึ้นเร็ว โทร 1669 (การแพทย์ฉุกเฉิน) หรือ 191 ทันที ระบบนี้ไม่ได้รับประกันว่าจะมีผู้ไปถึงทันที
                        </p>
                        <a
                            href="tel:1669"
                            className="mt-3 flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#FF6B4A] font-semibold text-[#08222C] active:bg-[#ff805f] transition-colors"
                        >
                            <Phone size={18} /> โทร 1669
                        </a>
                    </section>
                )}

                {error && (
                    <p role="alert" className="flex items-start gap-2 rounded-2xl bg-[#FF6B4A]/10 px-3.5 py-3 text-sm text-[#FF6B4A]">
                        <AlertCircle size={16} className="mt-0.5 shrink-0" />
                        <span>{error}</span>
                    </p>
                )}

                {/* กำลังโหลด */}
                {requests === null && (
                    <div className="flex flex-col gap-4" aria-busy="true">
                        {[0, 1].map((i) => (
                            <div key={i} className="h-64 animate-pulse rounded-3xl border border-white/10 bg-white/[0.04]" />
                        ))}
                    </div>
                )}

                {/* ยังไม่มีคำขอ */}
                {requests && requests.length === 0 && !error && (
                    <div className="rise flex flex-col items-center gap-3 rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center" style={{ '--i': 0 }}>
                        <span className="grid h-14 w-14 place-items-center rounded-full bg-white/[0.07] text-[#F3F8F7]/60">
                            <MapPin size={26} />
                        </span>
                        <p className="text-[#F3F8F7]/70">คุณยังไม่ได้ส่งคำขอความช่วยเหลือ</p>
                        <Link
                            href="/help"
                            className="inline-flex h-12 items-center justify-center rounded-2xl bg-[#FF6B4A] px-6 font-semibold text-[#08222C]"
                        >
                            ขอความช่วยเหลือ
                        </Link>
                    </div>
                )}

                {/* รายการคำขอ */}
                {list.map((r, i) => (
                    <RequestCard
                        key={r.id}
                        r={r}
                        index={i + 1}
                        confirming={confirmId === r.id}
                        busy={busyId === r.id}
                        onAskCancel={() => setConfirmId(r.id)}
                        onConfirmCancel={() => cancelRequest(r.id)}
                        onKeep={() => setConfirmId(null)}
                    />
                ))}
            </main>

            {/* ปุ่มลอยส่งคำขอใหม่ */}
            {requests && requests.length > 0 && (
                <Link
                    href="/help"
                    className="fixed bottom-[calc(var(--tabbar-h,0px)+1rem)] right-4 z-20 inline-flex h-14 items-center gap-2 rounded-full bg-[#FF6B4A] pl-4 pr-5 font-semibold text-[#08222C] shadow-[0_8px_24px_rgba(255,107,74,0.45)] active:scale-95 transition-transform"
                >
                    <Plus size={20} /> ขอความช่วยเหลือ
                </Link>
            )}

            <style jsx global>{`
                .dot-pulse {
                    opacity: 0.45;
                    animation: dot-pulse 1.8s ease-out infinite;
                }
                @keyframes dot-pulse {
                    0% { transform: scale(0.7); opacity: 0.5; }
                    100% { transform: scale(1.7); opacity: 0; }
                }

                /* การ์ดไหลเข้าทีละใบ */
                .rise {
                    animation: rise 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
                    animation-delay: calc(var(--i, 0) * 70ms);
                }
                .rise-sm { animation: rise 0.25s ease-out both; }
                @keyframes rise {
                    from { opacity: 0; transform: translateY(14px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                /* แถบความคืบหน้าเติมจากซ้ายไปขวา */
                .seg-fill {
                    transform-origin: left;
                    animation: seg-grow 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
                }
                @keyframes seg-grow {
                    from { transform: scaleX(0); }
                    to { transform: scaleX(1); }
                }
                /* ช่องปัจจุบันกะพริบเบาๆ */
                .seg-current { animation: seg-grow 0.6s cubic-bezier(0.22, 1, 0.36, 1) both, seg-breathe 1.8s ease-in-out 0.8s infinite; }
                @keyframes seg-breathe {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.45; }
                }

                /* ขยาย/ย่อไทม์ไลน์ */
                .expand {
                    display: grid;
                    grid-template-rows: 0fr;
                    transition: grid-template-rows 0.3s ease-out;
                }
                .expand-open { grid-template-rows: 1fr; }

                @media (prefers-reduced-motion: reduce) {
                    .dot-pulse { animation: none; opacity: 0.2; }
                    .rise, .rise-sm, .seg-fill, .seg-current { animation: none; }
                    .expand { transition: none; }
                }
            `}</style>
        </div>
    );
}