// components/Modal.jsx
// One shared modal shell so every popup (flood point detail, confirmations,
// errors) looks and animates the same way instead of each screen inventing
// its own dialog.

import { useEffect } from 'react';

export default function Modal({ open, onClose, children, maxWidth = 'max-w-md' }) {
    // ปิด modal ด้วยปุ่ม Esc และล็อกการสกอลด้านหลังตอนเปิด
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => e.key === 'Escape' && onClose?.();
        document.addEventListener('keydown', onKey);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = prevOverflow;
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center p-0 sm:p-6 modal-backdrop"
            onClick={onClose}
        >
            <div className="absolute inset-0 bg-[#08222C]/60 backdrop-blur-sm" />

            <div
                className={`relative w-full ${maxWidth} bg-[#0E3F52] border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl shadow-black/40 modal-panel overflow-hidden`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* handle bar สำหรับมือถือ ลากปิดในอนาคตได้ถ้าต้องการ */}
                <div className="sm:hidden flex justify-center pt-3">
                    <span className="h-1 w-10 rounded-full bg-white/20" />
                </div>

                <button
                    onClick={onClose}
                    aria-label="ปิด"
                    className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-[#F3F8F7] flex items-center justify-center transition-colors z-10"
                >
                    ✕
                </button>

                {children}
            </div>

            <style jsx>{`
                .modal-backdrop {
                    animation: fade-in 0.18s ease-out;
                }
                .modal-panel {
                    animation: panel-in 0.28s cubic-bezier(0.16, 1, 0.3, 1);
                }
                @media (prefers-reduced-motion: reduce) {
                    .modal-backdrop, .modal-panel { animation: none; }
                }
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes panel-in {
                    from { opacity: 0; transform: translateY(24px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </div>
    );
}