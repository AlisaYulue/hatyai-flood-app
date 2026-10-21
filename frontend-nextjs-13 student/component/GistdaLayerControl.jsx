// ตัวเปิด-ปิดชั้นข้อมูล GISTDA (วางนอก <MapContainer>) — ธีมมืดเดียวกับแผงรายการ
import { useState } from 'react';
import { Layers, ChevronDown } from 'lucide-react';
import { GISTDA_LAYERS } from './gistdaLayers';
import { summarize } from './GistdaOverlays';

function statusText(layer, on, status) {
    if (!on) return layer.hint;
    if (!status || status.state === 'loading') return 'กำลังโหลด...';
    if (status.state === 'empty') return 'ไม่พบข้อมูลในพื้นที่นี้';
    if (status.state === 'error') {
        return status.reason === 'NO_API_KEY'
            ? 'ยังไม่ได้ตั้งค่า GISTDA_API_KEY'
            : 'โหลดไม่สำเร็จ — ปิดแล้วเปิดใหม่เพื่อลองอีกครั้ง';
    }
    return summarize(layer, status);
}

export default function GistdaLayerControl({ enabled = {}, status = {}, onToggle }) {
    const [open, setOpen] = useState(false);
    const activeCount = GISTDA_LAYERS.filter((l) => enabled[l.id]).length;

    return (
        <div className="font-['Noto_Sans_Thai']">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-sm font-medium border border-white/10 bg-[#08222C]/90 backdrop-blur-md text-[#F3F8F7] shadow-lg shadow-black/30 hover:bg-[#0c2f3c] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B4A]/70"
            >
                <Layers size={15} className="text-sky-300" />
                ชั้นข้อมูล GISTDA
                {activeCount > 0 && (
                    <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-sky-400 text-[#08222C] text-[11px] font-semibold inline-flex items-center justify-center tabular-nums">
                        {activeCount}
                    </span>
                )}
                <ChevronDown size={14} className={`text-[#F3F8F7]/50 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <ul className="mt-2 w-64 rounded-xl border border-white/10 bg-[#08222C]/90 backdrop-blur-md p-1.5 shadow-2xl shadow-black/40">
                    {GISTDA_LAYERS.map((layer) => {
                        const on = !!enabled[layer.id];
                        return (
                            <li key={layer.id}>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={on}
                                    onClick={() => onToggle(layer.id)}
                                    className="w-full flex items-start gap-2.5 text-left rounded-lg px-2.5 py-2 hover:bg-white/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B4A]/70"
                                >
                                    <span
                                        className="mt-1 w-3.5 h-3.5 rounded-[4px] border shrink-0 transition-colors"
                                        style={
                                            on
                                                ? { background: layer.color, borderColor: layer.color }
                                                : { borderColor: 'rgba(243,248,247,0.3)' }
                                        }
                                        aria-hidden="true"
                                    />
                                    <span className="min-w-0">
                                        <span className="block text-sm text-[#F3F8F7] leading-snug">{layer.label}</span>
                                        <span
                                            className={`block text-[11px] leading-snug mt-0.5 ${status[layer.id]?.state === 'error' ? 'text-[#FF6B4A]' : 'text-[#F3F8F7]/50'
                                                }`}
                                        >
                                            {statusText(layer, on, status[layer.id])}
                                        </span>
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}