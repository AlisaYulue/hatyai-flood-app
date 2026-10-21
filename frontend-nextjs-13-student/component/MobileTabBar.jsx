import Link from 'next/link';
import { useRouter } from 'next/router';
import { ClipboardList, LifeBuoy, Map, MessageSquareWarning } from 'lucide-react';

// ความสูงแถบล่าง (ไม่รวม safe area) — ตั้งเป็น CSS variable --tabbar-h ให้หน้าอื่นหักออกจากความสูงได้
const TAB_H = 64;

const TABS = [
    { href: '/', label: 'ศูนย์พักพิง', Icon: Map },
    { href: '/help', label: 'ขอความช่วยเหลือ', Icon: LifeBuoy },
    { href: '/my-requests', label: 'คำขอของฉัน', Icon: ClipboardList },
    { href: '/contact', label: 'แจ้งปัญหา', Icon: MessageSquareWarning },
];

export default function MobileTabBar() {
    const { pathname } = useRouter();
    if (pathname === '/admin') return null; // หน้าแอดมินไม่ต้องมีแถบล่าง

    return (
        <>
            <nav
                className="md:hidden fixed bottom-0 inset-x-0 z-[9990] border-t border-white/10 bg-[#08222C]/90 backdrop-blur-xl font-['Noto_Sans_Thai']"
                style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
                aria-label="เมนูหลัก"
            >
                <ul className="grid grid-cols-4" style={{ height: TAB_H }}>
                    {TABS.map(({ href, label, Icon }) => {
                        const active = pathname === href;
                        return (
                            <li key={href} className="min-w-0">
                                <Link
                                    href={href}
                                    aria-current={active ? 'page' : undefined}
                                    className="group relative flex h-full flex-col items-center justify-center gap-0.5 px-1 active:scale-95 transition-transform"
                                >
                                    {/* เส้นบอกแท็บที่เปิดอยู่ */}
                                    <span
                                        aria-hidden="true"
                                        className={`absolute top-0 h-[3px] w-9 rounded-b-full bg-[#FF6B4A] transition-all duration-300 ${active ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'
                                            }`}
                                    />
                                    <span
                                        className={`grid h-8 w-14 place-items-center rounded-full transition-all duration-300 ${active ? 'bg-[#FF6B4A]/15 text-[#FF6B4A]' : 'text-[#F3F8F7]/60 group-active:bg-white/10'
                                            }`}
                                    >
                                        <Icon size={22} strokeWidth={active ? 2.2 : 1.7} />
                                    </span>
                                    <span
                                        className={`w-full truncate text-center text-[11px] leading-tight transition-colors ${active ? 'font-medium text-[#FF6B4A]' : 'text-[#F3F8F7]/60'
                                            }`}
                                    >
                                        {label}
                                    </span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* บอกหน้าอื่นว่าแถบล่างกินที่เท่าไหร่ (เฉพาะจอมือถือ ตอนที่แถบนี้แสดงอยู่) */}
            <style jsx global>{`
                :root { --tabbar-h: 0px; }
                @media (max-width: 767px) {
                    :root { --tabbar-h: calc(${TAB_H}px + env(safe-area-inset-bottom, 0px)); }
                }
            `}</style>
        </>
    );
}