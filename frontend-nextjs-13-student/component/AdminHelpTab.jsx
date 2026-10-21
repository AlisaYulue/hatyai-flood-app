// ใช้ใน admin.js:  <AdminHelpTab authHeaders={authHeaders} onUnauthorized={handleUnauthorized} showToast={showToast} />
import { useCallback, useEffect, useState } from 'react';
import { HELP_TYPES, URGENCY, STATUS_LABEL } from './help-meta';

const TABS = ['pending', 'open', 'in_progress', 'resolved', 'rejected'];

export default function AdminHelpTab({ authHeaders, onUnauthorized, showToast }) {
    const [tab, setTab] = useState('pending');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/help-requests?status=${tab}`, { headers: authHeaders() });
            if (res.status === 401) return onUnauthorized();
            const d = await res.json();
            setItems(d.requests || []);
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab]);

    useEffect(() => { load(); }, [load]);

    const setStatus = async (id, status) => {
        const res = await fetch('/api/admin/help-requests', {
            method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ id, status }),
        });
        if (res.status === 401) return onUnauthorized();
        if (!res.ok) return showToast('ทำรายการไม่สำเร็จ', 'error');
        showToast(`เปลี่ยนสถานะเป็น "${STATUS_LABEL[status]}" แล้ว`);
        load();
    };

    const btn = 'text-xs px-3 py-1.5 rounded-lg border border-[#08222C]/15 text-[#08222C]/70 hover:bg-[#08222C]/5';

    return (
        <div className="py-6">
            <p className="text-sm text-[#08222C]/50">
                ตรวจสอบคำขอก่อนกด "ยืนยัน" — เมื่อยืนยันแล้วหมุดจะขึ้นบนแผนที่หลัก เบอร์โทรจะเห็นเฉพาะที่นี่ ยกเว้นผู้ขอยินยอมให้แสดง
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
                {TABS.map((t) => (
                    <button key={t} onClick={() => setTab(t)}
                        className={`text-sm px-4 py-2 rounded-lg ${tab === t ? 'bg-[#08222C] text-[#F3F8F7]' : 'bg-[#08222C]/5 text-[#08222C]/60 hover:bg-[#08222C]/10'}`}>
                        {STATUS_LABEL[t]}
                    </button>
                ))}
            </div>

            <div className="mt-4 flex flex-col gap-3">
                {loading && <p className="text-sm text-[#08222C]/40">กำลังโหลด...</p>}
                {!loading && items.length === 0 && <p className="text-sm text-[#08222C]/40 py-8 text-center">ไม่มีคำขอในหมวดนี้</p>}
                {items.map((h) => {
                    const u = URGENCY[h.urgency];
                    return (
                        <div key={h.id} className="bg-white border border-[#08222C]/10 rounded-xl p-4 flex flex-col md:flex-row md:items-start justify-between gap-3">
                            <div className="text-sm text-[#08222C] min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[11px] text-white px-2 py-0.5 rounded-full" style={{ background: u.color }}>{u.label}</span>
                                    <b>{HELP_TYPES[h.help_type]}</b>
                                </div>
                                <p>{h.location_name}</p>
                                <p className="text-xs text-[#08222C]/55 mt-1">
                                    {h.people_count} คน{h.has_vulnerable ? ' · มีผู้สูงอายุ/เด็ก/ผู้ป่วย' : ''}
                                    {' · '}โทร <a className="text-[#1C6E8C]" href={`tel:${h.phone}`}>{h.phone}</a>
                                    {h.contact_name ? ` (${h.contact_name})` : ''}
                                </p>
                                {h.details && <p className="text-xs mt-1 text-[#08222C]/70">{h.details}</p>}
                                <p className="text-[11px] text-[#08222C]/40 mt-1">
                                    {h.user_email} · {new Date(h.created_at).toLocaleString('th-TH')} ·{' '}
                                    <a className="text-[#1C6E8C]" target="_blank" rel="noreferrer"
                                        href={`https://www.google.com/maps?q=${h.latitude},${h.longitude}`}>เปิดพิกัด</a>
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2 shrink-0">
                                {h.status === 'pending' && (<>
                                    <button className={`${btn} !bg-[#2FBF83] !text-[#08222C] !border-transparent`} onClick={() => setStatus(h.id, 'open')}>ยืนยัน</button>
                                    <button className={`${btn} !text-red-500 !border-red-300`} onClick={() => setStatus(h.id, 'rejected')}>ปฏิเสธ</button>
                                </>)}
                                {h.status === 'open' && <button className={btn} onClick={() => setStatus(h.id, 'in_progress')}>กำลังช่วยเหลือ</button>}
                                {(h.status === 'open' || h.status === 'in_progress') && <button className={btn} onClick={() => setStatus(h.id, 'resolved')}>เสร็จสิ้น</button>}
                                {(h.status === 'resolved' || h.status === 'rejected') && <button className={btn} onClick={() => setStatus(h.id, 'pending')}>ย้ายกลับรอตรวจสอบ</button>}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
