// component/FloodAlertPopup.jsx
import { useEffect, useState, useCallback } from 'react';
import {
    AlertTriangle,
    Siren,
    X,
    ChevronLeft,
    ChevronRight,
    MapPin,
    Check
} from 'lucide-react';

const RISK_CONFIG = {
    Critical: {
        icon: Siren,
        badgeText: 'วิกฤต',
        badgeBg: 'bg-rose-500/15 border-rose-500/40 text-rose-400',
        cardBg: 'linear-gradient(180deg, #18222a 0%, #08222C 100%)',
        accentColor: '#FF6B4A',
        iconBg: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    },
    Warning: {
        icon: AlertTriangle,
        badgeText: 'เฝ้าระวัง',
        badgeBg: 'bg-amber-500/15 border-amber-500/40 text-amber-400',
        cardBg: 'linear-gradient(180deg, #18262a 0%, #08222C 100%)',
        accentColor: '#E0B84C',
        iconBg: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    },
};

// ฟังก์ชันจัดสีตามระดับความเสี่ยงแต่ละวัน
function getLevelStyle(level) {
    switch (level) {
        case 'เสี่ยงต่ำ':
            return { text: 'text-amber-300', bg: 'bg-amber-500/10 border-amber-500/25' };
        case 'เสี่ยงปานกลาง':
            return { text: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/25' };
        case 'เสี่ยงสูง':
            return { text: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/25' };
        case 'วิกฤต':
            return { text: 'text-red-500', bg: 'bg-red-500/20 border-red-500/40' };
        default:
            return { text: 'text-amber-300', bg: 'bg-amber-500/10 border-amber-500/25' };
    }
}

const DISMISS_DATE_KEY = 'floodAlertDismissedDate';

function todayKey() {
    return new Date().toISOString().slice(0, 10);
}

export function shouldAutoShowToday() {
    try {
        return localStorage.getItem(DISMISS_DATE_KEY) !== todayKey();
    } catch {
        return true;
    }
}

function markDismissedToday() {
    try {
        localStorage.setItem(DISMISS_DATE_KEY, todayKey());
    } catch {
        // ignore
    }
}

export default function FloodAlertPopup({ alerts = [], open, onOpenChange }) {
    const [index, setIndex] = useState(0);
    const [dontShowToday, setDontShowToday] = useState(false);
    const [closing, setClosing] = useState(false);

    useEffect(() => {
        if (open) {
            setIndex(0);
            setDontShowToday(false);
        }
    }, [open, alerts]);

    const current = alerts[index];

    const closeNow = useCallback(() => {
        if (dontShowToday) markDismissedToday();
        onOpenChange?.(false);
    }, [dontShowToday, onOpenChange]);

    const handleClose = useCallback(() => {
        setClosing(true);
        setTimeout(() => {
            setClosing(false);
            if (index < alerts.length - 1) {
                setIndex((i) => i + 1);
            } else {
                closeNow();
            }
        }, 200);
    }, [index, alerts.length, closeNow]);

    if (!open || !current) return null;

    const cfg = RISK_CONFIG[current.risk_level] || RISK_CONFIG.Warning;
    const Icon = cfg.icon;

    // แสดงวันที่พร้อมปี พ.ศ.
    const alertDate = current.alert_date
        ? new Date(current.alert_date).toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        })
        : null;

    const todayLevel = current.risk_today || 'เสี่ยงต่ำ';
    const tomorrowLevel = current.risk_tomorrow || 'เสี่ยงสูง';
    const dayAfterLevel = current.risk_day_after || 'เสี่ยงสูง';

    const sToday = getLevelStyle(todayLevel);
    const sTomorrow = getLevelStyle(tomorrowLevel);
    const sDayAfter = getLevelStyle(dayAfterLevel);

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none font-['Noto_Sans_Thai'] bg-black/65 backdrop-blur-[2px]"
            aria-live="polite"
        >
            <div
                role="alertdialog"
                aria-label="ประกาศแจ้งเตือนความเสี่ยงน้ำท่วม"
                className={`pointer-events-auto relative w-full max-w-[390px] sm:max-w-md bg-[#09222c] border border-teal-800/60 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92dvh] ${closing ? 'flood-alert-out' : 'flood-alert-in'
                    }`}
                style={{
                    background: cfg.cardBg,
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
                }}
            >
                {/* Glow ด้านบน */}
                <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 blur-3xl pointer-events-none rounded-full"
                    style={{ background: `${cfg.accentColor}25` }}
                />

                {/* ปุ่มปิด X */}
                <button
                    onClick={handleClose}
                    aria-label="ปิดประกาศ"
                    className="absolute top-3.5 right-3.5 p-1.5 rounded-full text-[#F3F8F7]/60 hover:text-[#F3F8F7] hover:bg-white/10 transition-colors z-20"
                >
                    <X size={20} />
                </button>

                <div className="overflow-y-auto px-5 pt-7 pb-4 sm:px-6 space-y-4 scrollbar-thin scrollbar-thumb-teal-900/60">
                    {/* Header */}
                    <div className="flex flex-col items-center text-center">
                        <div
                            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center border mb-3 shadow-lg ${cfg.iconBg}`}
                        >
                            <Icon className="w-8 h-8 sm:w-9 sm:h-9" />
                        </div>

                        <h2 className="text-xl sm:text-2xl font-bold text-[#F3F8F7] tracking-tight">
                            {current.title || 'เสี่ยงน้ำท่วมภายใน 3 วัน'}
                        </h2>

                        <div className="mt-1.5 flex flex-wrap items-center justify-center gap-1.5 text-xs text-[#F3F8F7]/75">
                            <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                            <span>พื้นที่: <strong className="text-teal-200 font-medium">{current.location || 'ต.หาดใหญ่ อ.หาดใหญ่'}</strong></span>
                            {alertDate && (
                                <span className="text-[#F3F8F7]/50">(คาดการณ์ {alertDate})</span>
                            )}
                        </div>
                    </div>

                    {/* การ์ดความเสี่ยง 3 วัน */}
                    <div className="grid grid-cols-3 gap-2">
                        <div className={`flex flex-col items-center justify-center py-2.5 px-1.5 rounded-xl border ${sToday.bg}`}>
                            <span className="text-[11px] text-[#F3F8F7]/70">วันนี้</span>
                            <span className={`text-xs sm:text-sm font-semibold mt-0.5 ${sToday.text}`}>
                                {todayLevel}
                            </span>
                        </div>

                        <div className={`flex flex-col items-center justify-center py-2.5 px-1.5 rounded-xl border ${sTomorrow.bg}`}>
                            <span className="text-[11px] text-[#F3F8F7]/70">พรุ่งนี้</span>
                            <span className={`text-xs sm:text-sm font-semibold mt-0.5 ${sTomorrow.text}`}>
                                {tomorrowLevel}
                            </span>
                        </div>

                        <div className={`flex flex-col items-center justify-center py-2.5 px-1.5 rounded-xl border ${sDayAfter.bg}`}>
                            <span className="text-[11px] text-[#F3F8F7]/70">มะรืน</span>
                            <span className={`text-xs sm:text-sm font-semibold mt-0.5 ${sDayAfter.text}`}>
                                {dayAfterLevel}
                            </span>
                        </div>
                    </div>

                    {/* สิ่งที่ควรทำตอนนี้ */}
                    <div className="bg-[#0b2b37]/80 border border-teal-800/40 rounded-xl p-3.5 sm:p-4 text-left">
                        <p className="text-xs sm:text-sm font-semibold text-teal-300 mb-2">
                            ควรทำตอนนี้
                        </p>
                        {current.message ? (
                            <p className="text-xs sm:text-[13px] text-[#F3F8F7]/85 leading-relaxed whitespace-pre-line">
                                {current.message}
                            </p>
                        ) : (
                            <ul className="space-y-1.5 text-xs sm:text-[13px] text-[#F3F8F7]/80">
                                <li className="flex items-start gap-2">
                                    <span className="text-teal-400 leading-none mt-1">•</span>
                                    <span>เตรียมถุงยังชีพ น้ำดื่ม และเอกสารสำคัญ</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-teal-400 leading-none mt-1">•</span>
                                    <span>ย้ายของมีค่าและเครื่องใช้ไฟฟ้าขึ้นที่สูง</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-teal-400 leading-none mt-1">•</span>
                                    <span>หาที่ฝากรถยนต์และมอเตอร์ไซค์ไว้ล่วงหน้า</span>
                                </li>
                            </ul>
                        )}
                    </div>

                    <div className="text-[11px] text-[#F3F8F7]/50 text-center leading-relaxed">
                        เป็นการประเมินความเสี่ยงจากข้อมูลล่าสุด ไม่ใช่คำยืนยันว่าน้ำจะท่วม
                        <div className="text-teal-400/60 mt-0.5">
                            แหล่งข้อมูล: เทศบาลนครหาดใหญ่
                        </div>
                    </div>

                    {/* สลับใบประกาศ */}
                    {alerts.length > 1 && (
                        <div className="flex items-center justify-between pt-1 border-t border-white/5">
                            <div className="flex items-center gap-1.5">
                                {alerts.map((_, i) => (
                                    <span
                                        key={i}
                                        className="h-1.5 rounded-full transition-all duration-200"
                                        style={{
                                            width: i === index ? 16 : 6,
                                            background: i === index ? cfg.accentColor : 'rgba(243,248,247,0.2)',
                                        }}
                                    />
                                ))}
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setIndex((i) => Math.max(0, i - 1))}
                                    disabled={index === 0}
                                    className="w-7 h-7 rounded-full flex items-center justify-center text-[#F3F8F7]/50 hover:text-[#F3F8F7] disabled:opacity-20"
                                    aria-label="ประกาศก่อนหน้า"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <span className="text-[11px] text-[#F3F8F7]/50 font-mono">
                                    {index + 1}/{alerts.length}
                                </span>
                                <button
                                    onClick={() => setIndex((i) => Math.min(alerts.length - 1, i + 1))}
                                    disabled={index === alerts.length - 1}
                                    className="w-7 h-7 rounded-full flex items-center justify-center text-[#F3F8F7]/50 hover:text-[#F3F8F7] disabled:opacity-20"
                                    aria-label="ประกาศถัดไป"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer ปุ่มรับทราบ */}
                <div className="p-4 sm:p-5 bg-[#06181f]/90 border-t border-teal-900/50 flex flex-col gap-3">
                    <button
                        onClick={handleClose}
                        className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white font-medium text-sm sm:text-base transition-all shadow-md shadow-black/40 flex items-center justify-center gap-2"
                    >
                        <Check size={18} />
                        <span>{index < alerts.length - 1 ? 'รับทราบ (ดูใบถัดไป)' : 'รับทราบ'}</span>
                    </button>

                    <label className="flex items-center justify-center gap-2 text-xs text-[#F3F8F7]/65 cursor-pointer select-none hover:text-[#F3F8F7]/90 transition-colors">
                        <input
                            type="checkbox"
                            checked={dontShowToday}
                            onChange={(e) => setDontShowToday(e.target.checked)}
                            className="w-3.5 h-3.5 rounded border-teal-800 bg-[#0b2b37] text-teal-600 focus:ring-0 cursor-pointer"
                        />
                        <span>ไม่ต้องแจ้งเตือนอีกในวันนี้</span>
                    </label>
                </div>
            </div>

            <style jsx>{`
                .flood-alert-in {
                    animation: flood-alert-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .flood-alert-out {
                    animation: flood-alert-out 0.2s ease-in forwards;
                }
                @keyframes flood-alert-in {
                    from {
                        opacity: 0;
                        transform: translateY(12px) scale(0.96);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
                @keyframes flood-alert-out {
                    to {
                        opacity: 0;
                        transform: translateY(-8px) scale(0.96);
                    }
                }
                @media (prefers-reduced-motion: reduce) {
                    .flood-alert-in,
                    .flood-alert-out {
                        animation: none;
                    }
                }
            `}</style>
        </div>
    );
}