import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Input, Textarea, Button, Spinner } from '@heroui/react';
import { ArrowLeft, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import WaterGauge from '../component/WaterGauge';

const FIELD_CLASSNAMES = {
    input: "font-['Noto_Sans_Thai'] leading-relaxed !outline-none text-[#08222C]",
    inputWrapper:
        'border-[#08222C]/15 data-[hover=true]:border-[#1C6E8C] group-data-[focus=true]:border-[#1C6E8C] group-data-[focus-visible=true]:outline-none group-data-[focus-visible=true]:ring-0 bg-white',
    description: "pt-1 font-['Noto_Sans_Thai'] leading-relaxed text-xs",
};

export default function ContactPage() {
    const router = useRouter();
    // null = ยังเช็คไม่เสร็จ, '' = ไม่ได้ login, string = อีเมลที่ login อยู่
    const [userEmail, setUserEmail] = useState(null);
    const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const [sent, setSent] = useState(false);

    // เหมือน pattern เดียวกับหน้า /report — ต้อง login (มี userEmail ใน localStorage) ก่อนถึงแจ้งได้
    useEffect(() => {
        const email = localStorage.getItem('userEmail');
        if (!email) {
            router.replace('/login?next=/contact');
            return;
        }
        setUserEmail(email);
        setForm((f) => ({ ...f, email }));
    }, [router]);

    const handleSubmit = async () => {
        if (!form.email.trim() || !form.subject.trim() || !form.message.trim()) {
            return setError('กรุณากรอกอีเมล หัวข้อ และรายละเอียดให้ครบ');
        }
        setError('');
        setSending(true);
        try {
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || 'ส่งข้อความไม่สำเร็จ');
            }
            setSent(true);
        } catch (e) {
            setError(e.message);
        } finally {
            setSending(false);
        }
    };

    // ยังเช็ค login ไม่เสร็จ หรือกำลังจะ redirect ไป /login — กันหน้าฟอร์มโผล่วูบก่อนเด้งออก
    if (userEmail === null || userEmail === '') {
        return (
            <div className="min-h-screen bg-[#08222C] flex items-center justify-center">
                <Spinner color="warning" size="sm" />
            </div>
        );
    }

    if (sent) {
        return (
            <div className="min-h-screen bg-[#F3F8F7] flex items-center justify-center p-6 font-['Noto_Sans_Thai']">
                <div className="max-w-sm text-center">
                    <div className="mx-auto w-14 h-14 rounded-full bg-[#2FBF83]/15 text-[#2FBF83] flex items-center justify-center">
                        <CheckCircle2 size={28} />
                    </div>
                    <h1 className="mt-4 font-['Kanit'] font-semibold text-2xl text-[#08222C]">ส่งข้อความแล้ว</h1>
                    <p className="mt-2 text-sm text-[#08222C]/60 leading-relaxed">
                        เราส่งอีเมลยืนยันไปที่ <b>{form.email}</b> แล้ว ทีมงานกำลังตรวจสอบ
                        และจะติดต่อกลับโดยเร็วที่สุด
                    </p>
                    <Link
                        href="/"
                        className="mt-6 inline-flex items-center gap-1.5 text-sm text-[#1C6E8C] hover:underline"
                    >
                        <ArrowLeft size={14} /> กลับไปหน้าแผนที่
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full flex flex-col md:flex-row font-['Noto_Sans_Thai']">
            {/* LEFT — Context panel */}
            <div className="relative w-full md:w-[42%] min-h-[200px] md:min-h-screen bg-[#08222C] overflow-hidden flex flex-col justify-between p-8 md:p-12">
                <div
                    className="absolute inset-0 opacity-60"
                    style={{ background: 'radial-gradient(120% 100% at 10% 0%, #12506B 0%, #08222C 60%)' }}
                />
                <div className="relative z-10">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-1.5 text-[#F3F8F7]/70 hover:text-[#F3F8F7] text-sm transition-colors"
                    >
                        <ArrowLeft size={15} /> กลับไปหน้าแผนที่
                    </Link>
                    <div className="mt-10">
                        <WaterGauge size={44} level={68} label="ระดับน้ำ · เรียลไทม์" />
                        <h1 className="mt-6 font-['Kanit'] font-semibold text-3xl md:text-[2.4rem] leading-tight text-[#F3F8F7]">
                            แจ้งปัญหา / ติดต่อเจ้าหน้าที่
                        </h1>
                        <p className="mt-3 text-[#F3F8F7]/70 text-sm md:text-base max-w-sm leading-relaxed">
                            พบปัญหาการใช้งาน ข้อมูลผิดพลาด หรือต้องการแจ้งเรื่องอื่น ๆ
                            กรอกแบบฟอร์มนี้ได้เลย เจ้าหน้าที่จะติดต่อกลับทางอีเมลที่คุณระบุ
                        </p>
                    </div>
                </div>
            </div>

            {/* RIGHT — Form panel */}
            <div className="flex-1 flex items-center justify-center bg-[#F3F8F7] p-6 md:p-12">
                <div className="w-full max-w-sm flex flex-col gap-5">

                    {/* ชื่อ */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-[#08222C]">ชื่อ (ไม่บังคับ)</label>
                        <Input
                            placeholder="ชื่อของคุณ"
                            value={form.name}
                            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                            variant="bordered"
                            classNames={FIELD_CLASSNAMES}
                        />
                    </div>

                    {/* อีเมล */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-[#08222C]">อีเมลสำหรับติดต่อกลับ</label>
                        <Input
                            type="email"
                            description="ดึงจากบัญชีที่คุณ login อยู่ แก้ไขไม่ได้"
                            value={form.email}
                            isReadOnly
                            variant="bordered"
                            classNames={FIELD_CLASSNAMES}
                        />
                    </div>

                    {/* หัวข้อ */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-[#08222C]">
                            หัวข้อ <span className="text-red-500">*</span>
                        </label>
                        <Input
                            placeholder="เช่น หมุดบนแผนที่แสดงตำแหน่งผิด"
                            value={form.subject}
                            onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                            variant="bordered"
                            classNames={FIELD_CLASSNAMES}
                        />
                    </div>

                    {/* รายละเอียด */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-[#08222C]">
                            รายละเอียด <span className="text-red-500">*</span>
                        </label>
                        <Textarea
                            placeholder="อธิบายปัญหาหรือเรื่องที่ต้องการแจ้ง"
                            minRows={5}
                            value={form.message}
                            onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                            variant="bordered"
                            classNames={FIELD_CLASSNAMES}
                        />
                    </div>

                    {/* Error & Submit Button (คงเดิม) */}
                    {error && (
                        <div className="flex items-center gap-1.5 text-sm text-red-500">
                            <AlertCircle size={14} />
                            {error}
                        </div>
                    )}

                    <Button
                        onClick={handleSubmit}
                        isLoading={sending}
                        startContent={!sending && <Send size={15} />}
                        className="bg-[#FF6B4A] text-[#08222C] font-medium h-12 rounded-xl mt-1"
                    >
                        ส่งข้อความ
                    </Button>
                </div>
            </div>
        </div>
    );
}