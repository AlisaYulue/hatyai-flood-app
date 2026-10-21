import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Modal, ModalContent, ModalBody, useDisclosure } from '@heroui/react';
import {
    BookOpen, ChevronDown, ClipboardList, LifeBuoy, LogOut, Map, Menu,
    MessageSquareWarning, ShieldCheck, X, MapPinned,
} from 'lucide-react';
import FloodGuide from './FloodGuide';

// ความสูงแถบนำทาง — หน้าอื่นใช้ค่า 72px นี้คำนวณความสูงแผนที่ (calc(100dvh - 72px))
const NAV_H = 72;

// ==========================================
// รายชื่ออีเมลแอดมินที่อนุญาตให้เห็นปุ่มหลังบ้าน
// (เป็นแค่การซ่อน/แสดงเมนู — ฝั่ง API ของ /admin ต้องตรวจสิทธิ์เองอีกชั้น)
// ==========================================
const ADMIN_EMAILS = [
    'loginopo123@gmail.com',
    'chonnathatyulue@gmail.com',
];

export default function Navbar() {
    const router = useRouter();
    const [userEmail, setUserEmail] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    // dropdown บัญชีบน desktop
    const [isUserOpen, setIsUserOpen] = useState(false);
    const userRef = useRef(null);

    // การ์ดคู่มือรับมือน้ำท่วม
    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    const isAdmin = !!userEmail && ADMIN_EMAILS.includes(userEmail);
    const initial = userEmail ? userEmail.charAt(0).toUpperCase() : '';

    useEffect(() => {
        const email = localStorage.getItem('userEmail');
        setUserEmail(email || null);
    }, [router.pathname]);

    // เปลี่ยนหน้า -> ปิดเมนูทั้งหมด
    useEffect(() => {
        setIsMenuOpen(false);
        setIsUserOpen(false);
    }, [router.pathname]);

    useEffect(() => {
        const onScroll = () => setIsScrolled(window.scrollY > 12);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // คลิก/แตะนอก dropdown และกด Esc เพื่อปิด
    useEffect(() => {
        const onDown = (e) => {
            if (userRef.current && !userRef.current.contains(e.target)) setIsUserOpen(false);
        };
        const onKey = (e) => {
            if (e.key === 'Escape') {
                setIsUserOpen(false);
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', onDown);
        document.addEventListener('touchstart', onDown, { passive: true });
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onDown);
            document.removeEventListener('touchstart', onDown);
            document.removeEventListener('keydown', onKey);
        };
    }, []);

    // ล็อกการเลื่อนหน้าเว็บตอนเมนูมือถือเปิด
    useEffect(() => {
        if (!isMenuOpen) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = prev; };
    }, [isMenuOpen]);

    const handleLogout = () => {
        localStorage.removeItem('userEmail');
        setUserEmail(null);
        setIsUserOpen(false);
        setIsMenuOpen(false);
        router.push('/');
    };

    const isActive = (path) => router.pathname === path;

    // กด "คู่มือเตรียมพร้อม" -> เปิดการ์ดคู่มือทันที
    const openGuide = () => {
        setIsUserOpen(false);
        setIsMenuOpen(false);
        onOpen();
    };

    const links = [
        { href: '/', label: 'แผนที่ศูนย์พักพิงและฝากรถ', short: 'ศูนย์พักพิงและฝากรถ', icon: Map, show: true },
        { href: '/help', label: 'แผนที่ขอความช่วยเหลือ', short: 'ขอความช่วยเหลือ', icon: LifeBuoy, show: !!userEmail },
        { href: '/report', label: 'รายงานจุดน้ำท่วม', short: 'รายงานน้ำท่วม', icon: MapPinned, show: !!userEmail },
        { href: '/my-requests', label: 'คำขอของฉัน', icon: ClipboardList, show: !!userEmail },
        { href: '/contact', label: 'แจ้งปัญหา', icon: MessageSquareWarning, show: !!userEmail },
    ].filter((l) => l.show);

    const deskLink = (active) =>
        `relative rounded-full px-3.5 py-2 text-[15px] transition-colors ${active ? 'bg-white/10 text-white' : 'text-[#F3F8F7]/75 hover:bg-white/5 hover:text-white'
        }`;

    return (
        <nav
            className={`sticky top-0 z-[9999] font-['Kanit'] text-[#F3F8F7] transition-[background-color,box-shadow,border-color] duration-300 ${isScrolled
                ? 'bg-[#08222C]/90 backdrop-blur-md shadow-[0_6px_24px_-8px_rgba(0,0,0,0.5)] border-b border-white/10'
                : 'bg-[#08222C] border-b border-white/5'
                }`}
            style={{ height: NAV_H }}
        >
            <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                {/* โลโก้ */}
                <Link href="/" className="group flex shrink-0 items-center gap-2.5">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#2FBF83]/12 ring-1 ring-[#2FBF83]/25 transition-transform duration-300 group-hover:-translate-y-0.5">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-[#2FBF83]">
                            <path
                                d="M12 2C12 2 5 10.5 5 15.5C5 19.09 8.13 22 12 22C15.87 22 19 19.09 19 15.5C19 10.5 12 2 12 2Z"
                                stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" fill="currentColor" fillOpacity="0.18"
                            />
                        </svg>
                    </span>
                    <span className="text-lg font-bold leading-none tracking-wide sm:text-xl">HATYAI FLOOD</span>
                </Link>

                {/* ---------- Desktop ---------- */}
                <div className="hidden items-center gap-1 lg:flex">
                    {links.filter((l) => l.href !== '/my-requests').map((l) => (
                        <Link key={l.href} href={l.href} className={`${deskLink(isActive(l.href))} whitespace-nowrap`}>
                            {l.short ? (
                                <>
                                    <span className="xl:hidden">{l.short}</span>
                                    <span className="hidden xl:inline">{l.label}</span>
                                </>
                            ) : (
                                l.label
                            )}
                        </Link>
                    ))}

                    {/* คู่มือ — เปิดการ์ดคู่มือโดยตรง */}
                    <button
                        type="button"
                        onClick={openGuide}
                        className={`${deskLink(isOpen)} flex items-center gap-1.5 whitespace-nowrap`}
                    >
                        <BookOpen size={16} />
                        คู่มือเตรียมพร้อม
                    </button>

                    {isAdmin && (
                        <Link
                            href="/admin"
                            className="ml-1 inline-flex items-center gap-1.5 rounded-full border border-[#2FBF83]/30 bg-[#2FBF83]/10 px-3 py-1.5 text-sm text-[#2FBF83] transition-colors hover:bg-[#2FBF83]/20"
                        >
                            <ShieldCheck size={15} /> หลังบ้าน
                        </Link>
                    )}

                    <span className="mx-3 h-6 w-px bg-white/15" aria-hidden="true" />

                    {userEmail ? (
                        <div className="relative" ref={userRef}>
                            <button
                                onClick={() => setIsUserOpen((v) => !v)}
                                aria-expanded={isUserOpen}
                                aria-label="เมนูบัญชี"
                                className="flex items-center gap-2 rounded-full bg-white/[0.06] py-1 pl-1 pr-3 transition-colors hover:bg-white/10"
                            >
                                <span className="grid h-8 w-8 place-items-center rounded-full bg-[#FF6B4A]/20 text-sm font-semibold text-[#FF6B4A]">
                                    {initial}
                                </span>
                                <ChevronDown size={15} className={`text-white/60 transition-transform duration-200 ${isUserOpen ? 'rotate-180' : ''}`} />
                            </button>

                            <div
                                className={`absolute right-0 top-full z-50 mt-3 w-64 origin-top-right transition-all duration-150 ${isUserOpen ? 'pointer-events-auto scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'
                                    }`}
                            >
                                <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0B2A36] p-1.5 shadow-2xl shadow-black/50">
                                    <div className="px-3 pb-2 pt-2.5">
                                        <p className="font-['Noto_Sans_Thai'] text-[11px] text-[#F3F8F7]/40">เข้าสู่ระบบด้วย</p>
                                        <p className="mt-0.5 truncate font-['Noto_Sans_Thai'] text-sm text-[#F3F8F7]">{userEmail}</p>
                                    </div>
                                    <div className="h-px bg-white/10" />
                                    <Link
                                        href="/my-requests"
                                        className="mt-1.5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-white/[0.06]"
                                    >
                                        <ClipboardList size={17} className="text-[#7CCBE6]" /> คำขอของฉัน
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-red-300 transition-colors hover:bg-red-500/10"
                                    >
                                        <LogOut size={17} /> ออกจากระบบ
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <Link
                            href="/login"
                            className="rounded-full bg-[#FF6B4A] px-5 py-2 text-[15px] font-medium text-[#08222C] transition-all hover:bg-[#ff805f] hover:shadow-[0_0_0_4px_rgba(255,107,74,0.2)]"
                        >
                            เข้าสู่ระบบ
                        </Link>
                    )}
                </div>

                {/* ---------- ปุ่มเมนูมือถือ/แท็บเล็ต ---------- */}
                <button
                    onClick={() => setIsMenuOpen((v) => !v)}
                    aria-label="เปิด/ปิดเมนู"
                    aria-expanded={isMenuOpen}
                    className="grid h-11 w-11 place-items-center rounded-full bg-white/[0.07] text-white transition-colors active:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B4A] lg:hidden"
                >
                    {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
                </button>
            </div>

            {/* ---------- Drawer มือถือ ---------- */}
            <div className={`lg:hidden ${isMenuOpen ? '' : 'pointer-events-none'}`}>
                {/* พื้นหลังมืด แตะเพื่อปิด */}
                <div
                    onClick={() => setIsMenuOpen(false)}
                    aria-hidden="true"
                    className={`absolute left-0 right-0 top-full h-[100dvh] bg-black/55 backdrop-blur-[2px] transition-opacity duration-300 ${isMenuOpen ? 'opacity-100' : 'opacity-0'
                        }`}
                />

                <div
                    className={`absolute left-0 right-0 top-full overflow-y-auto overscroll-contain border-b border-white/10 bg-[#08222C] shadow-2xl shadow-black/50 transition-all duration-300 ease-out ${isMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-3 opacity-0'
                        }`}
                    style={{ maxHeight: `calc(100dvh - ${NAV_H}px)` }}
                >
                    <div className="mx-auto max-w-xl space-y-1.5 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
                        {/* บัญชีผู้ใช้ */}
                        {userEmail && (
                            <div className="mb-2 flex items-center gap-3 rounded-2xl bg-white/[0.05] p-3">
                                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#FF6B4A]/20 text-base font-semibold text-[#FF6B4A]">
                                    {initial}
                                </span>
                                <div className="min-w-0">
                                    <p className="truncate font-['Noto_Sans_Thai'] text-sm text-[#F3F8F7]">{userEmail}</p>
                                    {isAdmin && (
                                        <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-[#2FBF83]">
                                            <ShieldCheck size={12} /> ผู้ดูแลระบบ
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ลิงก์หลัก */}
                        {[...links, ...(isAdmin ? [{ href: '/admin', label: 'ระบบหลังบ้าน (Admin)', icon: ShieldCheck }] : [])].map((item, i) => {
                            const Icon = item.icon;
                            const active = isActive(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    style={{ transitionDelay: isMenuOpen ? `${i * 40}ms` : '0ms' }}
                                    className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-base transition-all duration-300 ${active ? 'bg-[#FF6B4A]/12 text-[#FF6B4A]' : 'text-[#F3F8F7] active:bg-white/10'
                                        } ${isMenuOpen ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0'}`}
                                >
                                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${active ? 'bg-[#FF6B4A]/15' : 'bg-white/[0.07]'}`}>
                                        <Icon size={18} />
                                    </span>
                                    {item.label}
                                </Link>
                            );
                        })}

                        {/* คู่มือ — เปิดการ์ดคู่มือโดยตรง */}
                        <button
                            type="button"
                            onClick={openGuide}
                            className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-base text-[#F3F8F7] transition-colors active:bg-white/10"
                        >
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/[0.07]">
                                <BookOpen size={18} />
                            </span>
                            <span className="flex-1">คู่มือเตรียมพร้อม</span>
                        </button>

                        {/* ออกจากระบบ / เข้าสู่ระบบ */}
                        <div className="pt-2">
                            {userEmail ? (
                                <button
                                    onClick={handleLogout}
                                    className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-white/15 text-sm text-red-300 active:bg-red-500/10"
                                >
                                    <LogOut size={17} /> ออกจากระบบ
                                </button>
                            ) : (
                                <Link
                                    href="/login"
                                    className="flex h-12 w-full items-center justify-center rounded-2xl bg-[#FF6B4A] font-medium text-[#08222C] active:bg-[#ff805f]"
                                >
                                    เข้าสู่ระบบ
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* การ์ดคู่มือรับมือน้ำท่วม (มือถือขึ้นจากล่าง / คอมอยู่กลางจอ) */}
            <Modal
                isOpen={isOpen}
                onOpenChange={onOpenChange}
                placement="auto"
                size="md"
                scrollBehavior="inside"
                backdrop="blur"
                classNames={{
                    wrapper: 'z-[10050]',
                    backdrop: 'z-[10040] bg-black/60',
                    base: 'mx-2 mb-2 sm:mx-0 sm:mb-0 max-h-[90dvh] rounded-3xl bg-[#F3F6F8] shadow-2xl',
                    body: 'px-5 py-6',
                    closeButton: 'right-3 top-3 h-10 w-10 rounded-full text-[#0B3550]/70 hover:bg-black/5 active:bg-black/10',
                }}
            >
                <ModalContent>
                    {(onClose) => (
                        <ModalBody>
                            <FloodGuide onNavigate={onClose} />
                        </ModalBody>
                    )}
                </ModalContent>
            </Modal>
        </nav>
    );
}