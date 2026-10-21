import { useState } from 'react';
import { useRouter } from 'next/router';
import {
    Input,
    Button,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure
} from '@heroui/react';
import Link from 'next/link';
import WaterGauge from '../component/WaterGauge';

// ไอคอนลูกตา (เปิดรหัส)
const EyeIcon = (props) => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

// ไอคอนลูกตาปิด (ซ่อนรหัส)
const EyeSlashIcon = (props) => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
);

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // สถานะสำหรับการเปิด/ปิดลูกตา
    const [isVisiblePass, setIsVisiblePass] = useState(false);
    const [isVisibleConfirm, setIsVisibleConfirm] = useState(false);

    const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: Set Password, 4: Enter Password
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // ปลายทางที่จะพากลับไปหลัง login สำเร็จ — มาจาก query ?next=
    // กันไม่ให้เป็น external URL (ต้องขึ้นต้นด้วย '/' เท่านั้น) ป้องกัน open redirect
    const rawNext = Array.isArray(router.query.next) ? router.query.next[0] : router.query.next;
    const nextPath = rawNext && rawNext.startsWith('/') ? rawNext : '/help';

    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [modalConfig, setModalConfig] = useState({ title: '', content: null, onConfirm: null });

    const showAlert = (title, content, onConfirm = null) => {
        setModalConfig({ title, content, onConfirm });
        onOpen();
    };

    // --- ฟังก์ชันคำนวณความแข็งแรงของรหัสผ่าน ---
    const getPasswordStrength = (pass) => {
        let score = 0;
        if (!pass) return { score: 0, label: 'ยังไม่ได้ระบุ', color: 'bg-gray-200' };
        if (pass.length >= 6) score += 1;
        if (pass.length >= 8) score += 1;
        if (/[A-Za-z]/.test(pass)) score += 1;
        if (/\d/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 1;

        if (score <= 2) return { score, label: 'ง่ายเกินไป', color: 'bg-red-400' };
        if (score === 3) return { score, label: 'ปานกลาง', color: 'bg-yellow-400' };
        return { score, label: 'คาดเดายาก', color: 'bg-green-500' };
    };
    const strength = getPasswordStrength(password);

    // 1. ตรวจสอบอีเมล
    const handleCheckEmail = async () => {
        if (!email) return showAlert('แจ้งเตือน', <p>กรุณาระบุอีเมลก่อนดำเนินการต่อ</p>);
        setLoading(true);
        try {
            const res = await fetch('/api/auth/check-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await res.json().catch(() => ({}));

            if (data.hasPassword) {
                setStep(4); // มีรหัสแล้ว -> ไปหน้าเข้าสู่ระบบ
            } else {
                await sendOTP(); // ยังไม่มีรหัส -> ส่ง OTP เพื่อยืนยันตัวก่อนตั้งรหัส
            }
        } catch (error) {
            await sendOTP();
        } finally {
            setLoading(false);
        }
    };

    const sendOTP = async () => {
        const res = await fetch('/api/auth/otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });

        if (res.ok) {
            setStep(2);
            showAlert('ส่งรหัสสำเร็จ', (
                <>
                    <p>ระบบได้จัดส่งรหัส OTP 6 หลัก ไปยัง <span className="font-semibold text-[#1C6E8C]">{email}</span></p>
                    <p className="text-sm mt-2">กรุณาตรวจสอบในกล่องจดหมาย หรือ Junk/Spam</p>
                </>
            ));
        } else {
            showAlert('เกิดข้อผิดพลาด', <p>ไม่สามารถส่ง OTP ได้ กรุณาลองใหม่อีกครั้ง</p>);
        }
    };

    // 2. ยืนยัน OTP
    const handleVerifyOTP = async () => {
        if (!otp) return showAlert('แจ้งเตือน', <p>กรุณาระบุรหัส OTP</p>);
        setLoading(true);
        const res = await fetch('/api/auth/otp', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp }),
        });
        setLoading(false);

        if (res.ok) {
            setStep(3); // ยืนยันผ่าน -> ไปตั้งรหัสผ่าน
        } else {
            showAlert('ตรวจสอบไม่ผ่าน', <p>รหัส OTP ไม่ถูกต้องหรือหมดอายุ</p>);
        }
    };

    // 3. บันทึกรหัสผ่านใหม่
    const handleSetPassword = async () => {
        if (password.length < 6) return showAlert('แจ้งเตือน', <p>รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร</p>);
        if (password !== confirmPassword) return showAlert('แจ้งเตือน', <p>รหัสผ่านทั้งสองช่องไม่ตรงกัน</p>);

        setLoading(true);
        const res = await fetch('/api/auth/set-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        setLoading(false);

        if (res.ok) {
            localStorage.setItem('userEmail', email);
            showAlert('สำเร็จ', <p>ตั้งรหัสผ่านเรียบร้อย ระบบจะพาท่านไปยังหน้าที่ตั้งใจไว้</p>, () => {
                router.push(nextPath);
            });
        } else {
            showAlert('ผิดพลาด', <p>ไม่สามารถบันทึกรหัสผ่านได้</p>);
        }
    };

    // 4. เข้าสู่ระบบด้วยรหัสผ่าน
    const handleLoginWithPassword = async () => {
        if (!password) return showAlert('แจ้งเตือน', <p>กรุณาระบุรหัสผ่าน</p>);
        setLoading(true);
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        setLoading(false);

        if (res.ok) {
            localStorage.setItem('userEmail', email);
            showAlert('ยินดีต้อนรับ', <p>เข้าสู่ระบบสำเร็จ</p>, () => {
                router.push(nextPath);
            });
        } else {
            showAlert('เข้าสู่ระบบไม่สำเร็จ', <p>รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง</p>);
        }
    };

    return (
        <div className="min-h-screen w-full flex flex-col md:flex-row font-['Noto_Sans_Thai']">
            {/* LEFT — Context panel */}
            <div className="relative w-full md:w-[44%] min-h-[220px] md:min-h-screen bg-[#08222C] overflow-hidden flex flex-col justify-between p-8 md:p-12">
                <div
                    className="absolute inset-0 opacity-60"
                    style={{ background: 'radial-gradient(120% 100% at 10% 0%, #12506B 0%, #08222C 60%)' }}
                />
                <div className="relative z-10">
                    <Link href="/" className="inline-flex items-center gap-1.5 text-[#F3F8F7]/70 hover:text-[#F3F8F7] text-sm transition-colors">
                        <span aria-hidden>←</span> กลับไปหน้าแผนที่
                    </Link>
                    <div className="mt-10">
                        <WaterGauge size={44} level={68} label="ระดับน้ำ · เรียลไทม์" />
                        <h1 className="mt-6 font-['Kanit'] font-semibold text-3xl md:text-[2.6rem] leading-tight text-[#F3F8F7]">สำหรับผู้แจ้งเหตุ</h1>
                        <p className="mt-3 text-[#F3F8F7]/70 text-sm md:text-base max-w-sm leading-relaxed">
                            เข้าสู่ระบบด้วยอีเมลเพื่อแจ้งจุดน้ำท่วม ข้อมูลของคุณช่วยให้แผนที่แม่นยำขึ้นสำหรับทุกคน
                        </p>
                    </div>
                </div>
                <div className="relative z-10 mt-10 hidden md:block">
                    <svg viewBox="0 0 400 40" className="w-full h-10 opacity-80 tide-line">
                        <path d="M0 20 Q50 0 100 20 T200 20 T300 20 T400 20" fill="none" stroke="#FF6B4A" strokeWidth="2" />
                    </svg>
                </div>
            </div>

            {/* RIGHT — Task panel */}
            <div className="flex-1 flex items-center justify-center bg-[#F3F8F7] p-6 md:p-12">
                <div className="w-full max-w-sm">
                    {/* Progress Bar สำหรับผู้ใช้ใหม่ */}
                    {step !== 4 && (
                        <div className="flex items-center gap-2 mb-8">
                            <span className={`h-1.5 w-8 rounded-full transition-colors ${step >= 1 ? 'bg-[#FF6B4A]' : 'bg-[#08222C]/10'}`} />
                            <span className={`h-1.5 w-8 rounded-full transition-colors ${step >= 2 ? 'bg-[#FF6B4A]' : 'bg-[#08222C]/10'}`} />
                            <span className={`h-1.5 w-8 rounded-full transition-colors ${step >= 3 ? 'bg-[#FF6B4A]' : 'bg-[#08222C]/10'}`} />
                            <span className="font-['JetBrains_Mono'] text-[11px] text-[#08222C]/40 ml-1">ขั้นที่ {step} / 3</span>
                        </div>
                    )}

                    {/* Step 1: ใส่ Email */}
                    {step === 1 && (
                        <div className="flex flex-col gap-5">
                            <div>
                                <h2 className="font-['Kanit'] font-medium text-2xl text-[#08222C]">กรอกอีเมลของคุณ</h2>
                                <p className="text-sm text-[#08222C]/50 mt-1">เพื่อตรวจสอบข้อมูลหรือสมัครสมาชิกใหม่</p>
                            </div>
                            <Input
                                type="email"
                                aria-label="อีเมล"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                                variant="bordered"
                                size="lg"
                                classNames={{
                                    // บังคับลบกรอบดำและใช้ฟอนต์ Kanit ให้เข้ากับช่องอื่นๆ
                                    input: "!outline-none !ring-0 !border-none !shadow-none font-['Kanit'] text-base",
                                    inputWrapper:
                                        'border-[#08222C]/15 data-[hover=true]:border-[#1C6E8C] group-data-[focus=true]:border-[#1C6E8C] bg-white',
                                }}
                            />
                            <Button onClick={handleCheckEmail} isLoading={loading} className="bg-[#08222C] text-[#F3F8F7] font-medium h-12 mt-2 rounded-xl">
                                ถัดไป
                            </Button>
                        </div>
                    )}

                    {/* Step 2: ใส่ OTP (ผู้ใช้ใหม่) */}
                    {step === 2 && (
                        <div className="flex flex-col gap-5">
                            <div>
                                <h2 className="font-['Kanit'] font-medium text-2xl text-[#08222C]">ยืนยันรหัส OTP</h2>
                                <p className="text-sm text-[#08222C]/50 mt-1">ส่งไปยัง <span className="font-medium text-[#1C6E8C]">{email}</span></p>
                            </div>
                            <Input
                                type="text"
                                aria-label="รหัส OTP"
                                placeholder="ตัวเลข 6 หลัก"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                disabled={loading}
                                variant="bordered"
                                size="lg"
                                maxLength={6}
                                classNames={{
                                    // บังคับลบกรอบดำ (!outline-none !ring-0) และใช้ฟอนต์ Kanit ให้สวยงาม
                                    input: `!outline-none !ring-0 !border-none !shadow-none text-center text-xl transition-all ${otp
                                        ? "font-['Kanit'] tracking-[0.4em] ml-2"
                                        : "font-['Kanit'] tracking-normal"
                                        }`,
                                    inputWrapper:
                                        'border-[#08222C]/15 data-[hover=true]:border-[#1C6E8C] group-data-[focus=true]:border-[#1C6E8C] bg-white',
                                }}
                            />
                            <Button onClick={handleVerifyOTP} isLoading={loading} className="bg-[#2FBF83] text-[#08222C] font-medium h-12 mt-2 rounded-xl">
                                ตรวจสอบรหัส
                            </Button>
                            <button onClick={() => setStep(1)} disabled={loading} className="text-sm text-[#08222C]/45 hover:text-[#08222C]/70 self-start">เปลี่ยนอีเมล</button>
                        </div>
                    )}

                    {/* Step 3: ตั้งรหัสผ่าน (เพิ่ม Confirm Password & Strength Meter) */}
                    {step === 3 && (
                        <div className="flex flex-col gap-5">
                            <div>
                                <h2 className="font-['Kanit'] font-medium text-2xl text-[#08222C]">ตั้งรหัสผ่านใหม่</h2>
                                <p className="text-sm text-[#08222C]/50 mt-1">สำหรับการเข้าใช้งานในครั้งถัดไป</p>
                            </div>

                            <div className="flex flex-col gap-1">
                                <Input
                                    type={isVisiblePass ? "text" : "password"}
                                    aria-label="รหัสผ่าน"
                                    placeholder="รหัสผ่าน (ขั้นต่ำ 6 ตัวอักษร)"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={loading}
                                    variant="bordered"
                                    size="lg"
                                    endContent={
                                        <button className="focus:outline-none" type="button" onClick={() => setIsVisiblePass(!isVisiblePass)}>
                                            {isVisiblePass ? <EyeSlashIcon /> : <EyeIcon />}
                                        </button>
                                    }
                                    classNames={{ input: 'outline-none focus:outline-none focus:ring-0', inputWrapper: 'bg-white' }}
                                />

                                {/* แถบบอกความปลอดภัยรหัสผ่าน */}
                                <div className="mt-2 flex flex-col gap-1.5 px-1">
                                    <div className="flex gap-1.5">
                                        {[1, 2, 3, 4].map(level => (
                                            <div key={level} className={`h-1.5 w-full rounded-full transition-colors ${strength.score >= level ? strength.color : 'bg-gray-200'}`} />
                                        ))}
                                    </div>
                                    <span className={`text-xs ${strength.score <= 2 ? 'text-red-500' : strength.score === 3 ? 'text-yellow-600' : 'text-green-600'}`}>
                                        ระดับรหัสผ่าน: {strength.label}
                                    </span>
                                </div>
                            </div>

                            <Input
                                type={isVisibleConfirm ? "text" : "password"}
                                aria-label="ยืนยันรหัสผ่าน"
                                placeholder="ยืนยันรหัสผ่านอีกครั้ง"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                disabled={loading}
                                variant="bordered"
                                size="lg"
                                endContent={
                                    <button className="focus:outline-none" type="button" onClick={() => setIsVisibleConfirm(!isVisibleConfirm)}>
                                        {isVisibleConfirm ? <EyeSlashIcon /> : <EyeIcon />}
                                    </button>
                                }
                                classNames={{ input: 'outline-none focus:outline-none focus:ring-0', inputWrapper: 'bg-white' }}
                            />

                            <Button onClick={handleSetPassword} isLoading={loading} className="bg-[#FF6B4A] text-[#08222C] font-medium h-12 mt-2 rounded-xl hover:bg-[#ff805f]">
                                บันทึกและเข้าสู่ระบบ
                            </Button>
                        </div>
                    )}

                    {/* Step 4: ล็อกอินด้วยรหัสผ่าน (ผู้ใช้เก่า) */}
                    {step === 4 && (
                        <div className="flex flex-col gap-5">
                            <div>
                                <h2 className="font-['Kanit'] font-medium text-2xl text-[#08222C]">เข้าสู่ระบบ</h2>
                                <p className="text-sm text-[#08222C]/50 mt-1">ยินดีต้อนรับกลับมา, <span className="font-medium text-[#1C6E8C]">{email}</span></p>
                            </div>

                            <div className="flex flex-col gap-2">
                                <Input
                                    type={isVisiblePass ? "text" : "password"}
                                    aria-label="รหัสผ่าน"
                                    placeholder="รหัสผ่านของคุณ"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={loading}
                                    variant="bordered"
                                    size="lg"
                                    endContent={
                                        <button className="focus:outline-none" type="button" onClick={() => setIsVisiblePass(!isVisiblePass)}>
                                            {isVisiblePass ? <EyeSlashIcon /> : <EyeIcon />}
                                        </button>
                                    }
                                    classNames={{
                                        // ปรับฟอนต์เป็น Kanit และลบกรอบดำเวลากดพิมพ์
                                        input: "!outline-none !ring-0 !border-none !shadow-none font-['Kanit']",
                                        inputWrapper: 'border-[#08222C]/15 data-[hover=true]:border-[#1C6E8C] group-data-[focus=true]:border-[#1C6E8C] bg-white'
                                    }}
                                />
                                {/* ปุ่มลืมรหัสผ่าน */}
                                <button
                                    onClick={async () => {
                                        setLoading(true);
                                        await sendOTP(); // ส่งรหัส OTP ใหม่ไปที่อีเมล และระบบจะพาเด้งไป Step 2 เอง
                                        setLoading(false);
                                    }}
                                    disabled={loading}
                                    className="text-xs text-[#1C6E8C] hover:text-[#FF6B4A] self-end transition-colors"
                                >
                                    ลืมรหัสผ่านใช่หรือไม่?
                                </button>
                            </div>

                            <Button onClick={handleLoginWithPassword} isLoading={loading} className="bg-[#2FBF83] text-[#08222C] font-medium h-12 mt-2 rounded-xl hover:bg-[#28a874] transition-colors">
                                เข้าสู่ระบบ
                            </Button>

                            <button onClick={() => setStep(1)} disabled={loading} className="text-sm text-[#08222C]/45 hover:text-[#08222C]/70 self-start transition-colors">
                                เข้าใช้อีเมลอื่น
                            </button>
                        </div>
                    )}
                </div>
            </div>



            {/* Modal แจ้งเตือน */}
            <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="center">
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1 font-['Kanit'] text-xl text-[#08222C]">{modalConfig.title}</ModalHeader>
                            <ModalBody className="font-['Noto_Sans_Thai'] text-[#08222C]/70">{modalConfig.content}</ModalBody>
                            <ModalFooter>
                                <Button className="bg-[#2FBF83] text-[#08222C] font-medium w-full rounded-xl" onPress={() => { onClose(); if (modalConfig.onConfirm) modalConfig.onConfirm(); }}>
                                    ตกลง
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

            <style jsx>{`
                .tide-line { animation: tide-drift 6s ease-in-out infinite; }
                @keyframes tide-drift {
                    0%, 100% { transform: translateX(0); }
                    50% { transform: translateX(-12px); }
                }
            `}</style>
        </div>
    );
}