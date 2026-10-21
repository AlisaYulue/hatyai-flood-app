import { useState } from 'react';
import { Card, CardBody, Chip, Button, Textarea } from '@heroui/react';
import { Send, MailCheck, Inbox } from 'lucide-react';

const STATUS_STYLE = {
    pending: 'bg-[#FF6B4A]/15 text-[#FF6B4A] border-[#FF6B4A]/30',
    replied: 'bg-[#2FBF83]/15 text-[#2FBF83] border-[#2FBF83]/30',
};

/**
 * ใช้งานใน admin.jsx:
 *
 * import AdminContactTab from '../component/AdminContactTab';
 * const [contactMessages, setContactMessages] = useState([]);
 * const [loadingContact, setLoadingContact] = useState(true);
 *
 * const loadContact = useCallback(async () => {
 *   if (!adminKey) return;
 *   setLoadingContact(true);
 *   try {
 *     const res = await fetch('/api/admin/contact?status=all', { headers: authHeaders() });
 *     const data = await res.json();
 *     setContactMessages(Array.isArray(data.messages) ? data.messages : []);
 *   } finally { setLoadingContact(false); }
 * }, [adminKey]);
 *
 * // เรียก loadContact() คู่กับ loadReports/loadAlerts/loadGuide ใน useEffect เดิม
 *
 * แล้วเพิ่ม <Tab key="contact" title="ข้อความจากผู้ใช้">
 *   <AdminContactTab
 *     messages={contactMessages}
 *     loading={loadingContact}
 *     authHeaders={authHeaders}
 *     onHandled={loadContact}
 *     onUnauthorized={handleUnauthorized}
 *     showToast={showToast}
 *   />
 * </Tab>
 */
export default function AdminContactTab({ messages, loading, authHeaders, onHandled, onUnauthorized, showToast }) {
    const [replyDrafts, setReplyDrafts] = useState({});
    const [sendingId, setSendingId] = useState(null);

    const setDraft = (id, text) => setReplyDrafts((d) => ({ ...d, [id]: text }));

    const handleReply = async (msg) => {
        const reply = (replyDrafts[msg.id] || '').trim();
        if (!reply) return;
        setSendingId(msg.id);
        try {
            const res = await fetch('/api/admin/contact', {
                method: 'PATCH',
                headers: authHeaders(),
                body: JSON.stringify({ id: msg.id, admin_reply: reply }),
            });
            if (res.status === 401) return onUnauthorized?.();
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || 'ตอบกลับไม่สำเร็จ');
            }
            setReplyDrafts((d) => ({ ...d, [msg.id]: '' }));
            await onHandled?.();
            showToast?.(`ส่งคำตอบไปที่ ${msg.email} แล้ว`);
        } catch (e) {
            showToast?.(e.message, 'error');
        } finally {
            setSendingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col gap-2 py-6">
                {[0, 1, 2].map((i) => (
                    <div key={i} className="h-[80px] rounded-xl border border-[#08222C]/10 bg-[#08222C]/[0.03] animate-pulse" />
                ))}
            </div>
        );
    }

    if (!messages.length) {
        return (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                <div className="w-10 h-10 rounded-full bg-[#08222C]/5 flex items-center justify-center text-[#08222C]/30">
                    <Inbox size={18} />
                </div>
                <p className="text-sm text-[#08222C]/40">ยังไม่มีข้อความจากผู้ใช้</p>
            </div>
        );
    }

    return (
        <div className="py-6 flex flex-col gap-3">
            {messages.map((m) => (
                <Card key={m.id} className="rounded-xl border border-[#08222C]/10 shadow-none">
                    <CardBody className="p-4 flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <div className="flex items-center gap-2">
                                    <Chip size="sm" variant="bordered" className={STATUS_STYLE[m.status] || ''}>
                                        {m.status === 'replied' ? 'ตอบแล้ว' : 'รอตอบ'}
                                    </Chip>
                                    <p className="text-sm font-medium text-[#08222C]">{m.subject}</p>
                                </div>
                                <p className="text-xs text-[#08222C]/45 mt-1">
                                    {m.name ? `${m.name} · ` : ''}
                                    {m.email} · {new Date(m.created_at).toLocaleString('th-TH')}
                                </p>
                            </div>
                        </div>

                        <p className="text-sm text-[#08222C]/75 whitespace-pre-wrap bg-[#08222C]/[0.03] rounded-lg p-3">
                            {m.message}
                        </p>

                        {m.status === 'replied' ? (
                            <div className="flex items-start gap-2 text-xs text-[#2FBF83] bg-[#2FBF83]/10 rounded-lg p-3">
                                <MailCheck size={14} className="mt-0.5 shrink-0" />
                                <div>
                                    <p className="font-medium">คำตอบที่ส่งไปแล้ว</p>
                                    <p className="text-[#08222C]/70 mt-1 whitespace-pre-wrap">{m.admin_reply}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                <Textarea
                                    placeholder="พิมพ์คำตอบที่จะส่งไปทางอีเมลผู้แจ้ง..."
                                    minRows={3}
                                    value={replyDrafts[m.id] || ''}
                                    onChange={(e) => setDraft(m.id, e.target.value)}
                                    variant="bordered"
                                    classNames={{
                                        // เพิ่ม !outline-none และปรับ inputWrapper เพื่อปิดกรอบดำเวลาโฟกัส
                                        input: "font-['Noto_Sans_Thai'] leading-relaxed !outline-none",
                                        inputWrapper:
                                            "border-[#08222C]/15 data-[hover=true]:border-[#1C6E8C] group-data-[focus=true]:border-[#1C6E8C] group-data-[focus-visible=true]:!outline-none group-data-[focus-visible=true]:!ring-0 bg-white shadow-none"
                                    }}
                                />
                                <Button
                                    size="sm"
                                    onClick={() => handleReply(m)}
                                    isLoading={sendingId === m.id}
                                    isDisabled={!replyDrafts[m.id]?.trim()}
                                    startContent={sendingId !== m.id && <Send size={14} />}
                                    className="self-end bg-[#08222C] text-[#F3F8F7] font-medium rounded-lg"
                                >
                                    ส่งคำตอบทางอีเมล
                                </Button>
                            </div>
                        )}
                    </CardBody>
                </Card>
            ))}
        </div>
    );
}