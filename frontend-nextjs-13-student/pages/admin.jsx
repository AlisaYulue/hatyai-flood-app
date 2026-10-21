import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
    Input,
    Textarea,
    Button,
    Select,
    SelectItem,
    Card,
    CardBody,
    Chip,
    Tabs,
    Tab,
    Divider,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
    Spinner,
    DatePicker,
    HeroUIProvider,
} from '@heroui/react';
import {
    KeyRound, LogOut, ArrowLeft, Megaphone, ListChecks, BookOpen,
    Plus, Pencil, Trash2, Check, X, Undo2, ExternalLink, Power,
    AlertCircle, CheckCircle2, Clock, MapPinned, Waves, Search,
    Inbox, Mail, Tent, LifeBuoy, Car,
} from 'lucide-react';
import { I18nProvider } from '@react-aria/i18n';
import { parseDate, today, getLocalTimeZone } from '@internationalized/date';
import { GuideIcon, GUIDE_ICON_OPTIONS, GUIDE_ICON_LABELS } from '../lib/guide-icons';
import WaterGauge from '../component/WaterGauge';
import AdminContactTab from '../component/AdminContactTab';
import AdminHelpTab from '../component/AdminHelpTab';

const EyeIcon = (props) => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);
const EyeSlashIcon = (props) => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
);

function todayStr() { return new Date().toISOString().slice(0, 10); }
function plusDaysStr(n) { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }

// เสียงแจ้งเตือนสั้น ๆ ตอนมีคำขอใหม่ (ไม่ต้องใช้ไฟล์เสียง)
function playBeep() {
    try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        const ctx = new Ctx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
        osc.onended = () => ctx.close();
    } catch { /* ignore */ }
}

const RISK_STYLES = {
    Critical: 'bg-red-500/15 text-red-600 border-red-500/30',
    Warning: 'bg-amber-400/15 text-amber-600 border-amber-400/30',
    Danger: 'bg-orange-400/15 text-orange-600 border-orange-400/30',
};

const COLOR_PRESETS = ['#2FBF83', '#FF6B4A', '#1C6E8C', '#08222C', '#8B5CF6', '#E0B84C'];

const FIELD_CLASSNAMES = {
    input: "font-['Noto_Sans_Thai'] leading-relaxed !outline-none text-[#08222C]",
    inputWrapper: 'border-[#08222C]/15 data-[hover=true]:border-[#1C6E8C] group-data-[focus=true]:border-[#1C6E8C] group-data-[focus-visible=true]:outline-none group-data-[focus-visible=true]:ring-0 bg-white',
    description: "pt-1 font-['Noto_Sans_Thai'] leading-relaxed text-xs",
};

const emptySection = () => ({ heading: '', itemsText: '' });
const emptyGuideForm = () => ({ id: '', icon: 'Package', color: COLOR_PRESETS[0], title: '', subtitle: '', sections: [emptySection()] });

let toastSeq = 1;

export default function AdminPage() {
    const [adminKey, setAdminKey] = useState(null);
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => setIsMounted(true), []);

    const [keyInput, setKeyInput] = useState('');
    const [keyError, setKeyError] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [isVisibleKey, setIsVisibleKey] = useState(false);
    const [shakeKey, setShakeKey] = useState(false);

    const [pending, setPending] = useState([]);
    const [approved, setApproved] = useState([]);
    const [rejected, setRejected] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [loadingReports, setLoadingReports] = useState(true);
    const [loadingAlerts, setLoadingAlerts] = useState(true);

    const [alertForm, setAlertForm] = useState({
        risk_level: 'Warning', title: '', message: '', alert_date: plusDaysStr(3),
        risk_today: 'เสี่ยงต่ำ', risk_tomorrow: 'เสี่ยงสูง', risk_day_after: 'เสี่ยงสูง',
    });
    const [creatingAlert, setCreatingAlert] = useState(false);
    const [alertError, setAlertError] = useState('');
    const [reportsTab, setReportsTab] = useState('pending');
    const [reportsSearch, setReportsSearch] = useState('');
    const [actingId, setActingId] = useState(null);

    const [contactMessages, setContactMessages] = useState([]);
    const [loadingContact, setLoadingContact] = useState(true);

    const [guideTopics, setGuideTopics] = useState([]);
    const [guideSearch, setGuideSearch] = useState('');
    const [loadingGuide, setLoadingGuide] = useState(true);
    const [guideForm, setGuideForm] = useState(emptyGuideForm());
    const [guideError, setGuideError] = useState('');
    const [savingGuide, setSavingGuide] = useState(false);
    const [isNewTopic, setIsNewTopic] = useState(true);
    const guideModal = useDisclosure();

    // --- ศูนย์อพยพ ---
    const [evacCenters, setEvacCenters] = useState([]);
    const [loadingEvac, setLoadingEvac] = useState(true);
    const [evacUpdates, setEvacUpdates] = useState({});
    const [updatingEvac, setUpdatingEvac] = useState(null);

    // --- จุดฝากรถ ---
    const [parkingSpots, setParkingSpots] = useState([]);
    const [loadingParking, setLoadingParking] = useState(true);
    const [parkingUpdates, setParkingUpdates] = useState({});
    const [updatingParking, setUpdatingParking] = useState(null);

    // --- คำขอความช่วยเหลือ (ใช้แสดงตัวเลข + แจ้งเตือน) ---
    const [activeTab, setActiveTab] = useState('alerts');
    const [helpRequests, setHelpRequests] = useState([]);
    const seenHelpIds = useRef(null);

    const [confirmState, setConfirmState] = useState(null);
    const confirmModal = useDisclosure();
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'success', duration = 3200) => {
        const id = toastSeq++;
        setToasts((t) => [...t, { id, message, type }]);
        setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), duration);
    }, []);
    const dismissToast = (id) => setToasts((t) => t.filter((x) => x.id !== id));

    const askConfirm = ({ title, description, confirmLabel = 'ยืนยันการลบ', onConfirm }) => {
        setConfirmState({ title, description, confirmLabel, onConfirm });
        confirmModal.onOpen();
    };
    const runConfirm = async () => {
        if (confirmState?.onConfirm) await confirmState.onConfirm();
        confirmModal.onClose();
        setConfirmState(null);
    };

    useEffect(() => {
        const saved = sessionStorage.getItem('adminKey');
        if (saved) verifyKey(saved);
        else setAdminKey('');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const authHeaders = (key = adminKey) => ({
        'Content-Type': 'application/json',
        'x-admin-key': key,
    });

    const verifyKey = async (key) => {
        setVerifying(true);
        setKeyError('');
        try {
            const res = await fetch('/api/admin/reports?status=all', { headers: { 'x-admin-key': key } });
            if (res.status === 401) {
                setKeyError('รหัสแอดมินไม่ถูกต้อง');
                sessionStorage.removeItem('adminKey');
                setAdminKey('');
                setShakeKey(true);
                setTimeout(() => setShakeKey(false), 500);
                return;
            }
            sessionStorage.setItem('adminKey', key);
            setAdminKey(key);
        } catch (e) {
            setKeyError('เชื่อมต่อไม่สําเร็จ ลองใหม่อีกครั้ง');
        } finally {
            setVerifying(false);
        }
    };

    const loadReports = useCallback(async () => {
        if (!adminKey) return;
        setLoadingReports(true);
        try {
            const [p, a, r] = await Promise.all([
                fetch('/api/admin/reports?status=pending', { headers: authHeaders() }).then((res) => res.json()),
                fetch('/api/admin/reports?status=approved', { headers: authHeaders() }).then((res) => res.json()),
                fetch('/api/admin/reports?status=rejected', { headers: authHeaders() }).then((res) => res.json()),
            ]);
            setPending(p.reports || []);
            setApproved(a.reports || []);
            setRejected(r.reports || []);
        } catch (e) { console.error(e); } finally { setLoadingReports(false); }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [adminKey]);

    const loadAlerts = useCallback(async () => {
        if (!adminKey) return;
        setLoadingAlerts(true);
        try {
            const res = await fetch('/api/admin/alerts', { headers: authHeaders() });
            const data = await res.json();
            setAlerts(Array.isArray(data) ? data : []);
        } catch (e) { console.error(e); } finally { setLoadingAlerts(false); }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [adminKey]);

    const loadGuide = useCallback(async () => {
        if (!adminKey) return;
        setLoadingGuide(true);
        try {
            const res = await fetch('/api/admin/guide', { headers: authHeaders() });
            const data = await res.json();
            setGuideTopics(Array.isArray(data.topics) ? data.topics : []);
        } catch (e) { console.error(e); } finally { setLoadingGuide(false); }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [adminKey]);

    const loadContact = useCallback(async () => {
        if (!adminKey) return;
        setLoadingContact(true);
        try {
            const res = await fetch('/api/admin/contact?status=all', { headers: authHeaders() });
            const data = await res.json();
            setContactMessages(Array.isArray(data.messages) ? data.messages : []);
        } catch (e) { console.error(e); } finally { setLoadingContact(false); }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [adminKey]);

    const loadEvac = useCallback(async () => {
        if (!adminKey) return;
        setLoadingEvac(true);
        try {
            const res = await fetch('/api/map-data', { headers: authHeaders() });
            if (res.ok) {
                const data = await res.json();
                setEvacCenters(Array.isArray(data.evacuationCenters) ? data.evacuationCenters : []);
            }
        } catch (e) { console.error(e); } finally { setLoadingEvac(false); }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [adminKey]);

    const loadParking = useCallback(async () => {
        if (!adminKey) return;
        setLoadingParking(true);
        try {
            const res = await fetch('/api/parking', { headers: authHeaders() });
            if (res.ok) {
                const data = await res.json();
                setParkingSpots(Array.isArray(data.spots) ? data.spots : []);
            }
        } catch (e) { console.error(e); } finally { setLoadingParking(false); }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [adminKey]);

    // โหลดคำขอความช่วยเหลือ + แจ้งเตือนเมื่อมีรายการใหม่
    const loadHelp = useCallback(async () => {
        if (!adminKey) return;
        try {
            const res = await fetch('/api/help-requests', { headers: authHeaders() });
            if (!res.ok) return;
            const data = await res.json();
            if (!Array.isArray(data)) return;
            setHelpRequests(data);

            // ครั้งแรกแค่จำ id ไว้ ครั้งต่อไปค่อยเทียบว่ามีอันใหม่ไหม
            if (seenHelpIds.current) {
                const fresh = data.filter((r) => !seenHelpIds.current.has(r.id) && r.status !== 'resolved');
                if (fresh.length > 0) {
                    showToast(`มีคำขอความช่วยเหลือใหม่ ${fresh.length} รายการ`, 'help', 6000);
                    playBeep();
                }
            }
            seenHelpIds.current = new Set(data.map((r) => r.id));
        } catch (e) { console.error(e); }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [adminKey, showToast]);

    useEffect(() => {
        if (!adminKey) return;
        loadReports();
        loadAlerts();
        loadGuide();
        loadContact();
        loadEvac();
        loadParking();
    }, [adminKey, loadReports, loadAlerts, loadGuide, loadContact, loadEvac, loadParking]);

    // ดึงคำขอทุก 20 วินาที
    useEffect(() => {
        if (!adminKey) return;
        loadHelp();
        const t = setInterval(loadHelp, 20000);
        return () => {
            clearInterval(t);
            seenHelpIds.current = null;
        };
    }, [adminKey, loadHelp]);

    const handleReview = async (id, action) => {
        setActingId(id);
        try {
            const res = await fetch('/api/admin/reports', { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ id, action }) });
            if (res.status === 401) return handleUnauthorized();
            await loadReports();
            if (action === 'approve') showToast('ยืนยันรายงานแล้ว หมุดจะขึ้นบนแผนที่หลักทันที');
            if (action === 'reject') showToast('ปฏิเสธรายงานแล้ว', 'muted');
            if (action === 'reset') showToast('ย้ายรายงานกลับไปรอตรวจสอบแล้ว', 'muted');
        } catch (e) {
            showToast('ทำรายการไม่สำเร็จ ลองใหม่อีกครั้ง', 'error');
        } finally {
            setActingId(null);
        }
    };

    const handleCreateAlert = async () => {
        if (!alertForm.title.trim()) return setAlertError('กรุณาระบุหัวข้อประกาศ');
        if (!alertForm.alert_date) return setAlertError('กรุณาเลือกวันที่');
        setAlertError(''); setCreatingAlert(true);
        try {
            const res = await fetch('/api/admin/alerts', { method: 'POST', headers: authHeaders(), body: JSON.stringify(alertForm) });
            if (res.status === 401) return handleUnauthorized();
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || 'สร้างประกาศไม่สําเร็จ');
            }
            setAlertForm({ risk_level: 'Warning', title: '', message: '', alert_date: plusDaysStr(3), risk_today: 'เสี่ยงต่ำ', risk_tomorrow: 'เสี่ยงสูง', risk_day_after: 'เสี่ยงสูง' });
            await loadAlerts();
            showToast('เผยแพร่ประกาศแล้ว ขึ้นที่หน้าแผนที่หลักทันที');
        } catch (e) {
            setAlertError(e.message); showToast(e.message, 'error');
        } finally {
            setCreatingAlert(false);
        }
    };

    const toggleAlertActive = async (alert) => {
        try {
            const res = await fetch('/api/admin/alerts', { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ id: alert.id, is_active: !alert.is_active }) });
            if (res.status === 401) return handleUnauthorized();
            await loadAlerts();
            showToast(alert.is_active ? 'ปิดประกาศแล้ว' : 'เปิดใช้ประกาศอีกครั้งแล้ว', 'muted');
        } catch (e) {
            showToast('ทำรายการไม่สำเร็จ ลองใหม่อีกครั้ง', 'error');
        }
    };

    const deleteAlert = (id) => {
        askConfirm({
            title: 'ลบประกาศนี้?',
            description: 'ประกาศจะหายไปจากหน้าแผนที่หลักทันที และย้อนกลับไม่ได้',
            onConfirm: async () => {
                try {
                    const res = await fetch('/api/admin/alerts', { method: 'DELETE', headers: authHeaders(), body: JSON.stringify({ id }) });
                    if (res.status === 401) return handleUnauthorized();
                    await loadAlerts();
                    showToast('ลบประกาศแล้ว', 'muted');
                } catch (e) {
                    showToast('ลบไม่สำเร็จ ลองใหม่อีกครั้ง', 'error');
                }
            },
        });
    };

    // --- บันทึกข้อมูลศูนย์อพยพ (ทั้งปัจจุบันและความจุ) ---
    const handleUpdateEvac = async (id, fallbackOcc, fallbackCap) => {
        const upd = evacUpdates[id] || {};
        const current_occupancy = upd.current_occupancy !== undefined ? upd.current_occupancy : fallbackOcc;
        const capacity = upd.capacity !== undefined ? upd.capacity : fallbackCap;

        setUpdatingEvac(id);
        try {
            const res = await fetch('/api/admin/evacuation', {
                method: 'PUT',
                headers: authHeaders(),
                body: JSON.stringify({ id, current_occupancy: Number(current_occupancy), capacity: Number(capacity) })
            });
            if (res.status === 401) return handleUnauthorized();
            if (!res.ok) throw new Error('อัปเดตไม่สำเร็จ กรุณาเช็ค API');
            showToast('อัปเดตข้อมูลศูนย์อพยพแล้ว');
            await loadEvac();
        } catch (e) {
            showToast(e.message, 'error');
        } finally {
            setUpdatingEvac(null);
        }
    };

    // --- บันทึกข้อมูลจุดฝากรถ (ทั้งปัจจุบันและความจุ) ---
    const handleUpdateParking = async (id, fallbackOcc, fallbackCap) => {
        const upd = parkingUpdates[id] || {};
        const current_occupancy = upd.current_occupancy !== undefined ? upd.current_occupancy : fallbackOcc;
        const capacity = upd.capacity !== undefined ? upd.capacity : fallbackCap;

        setUpdatingParking(id);
        try {
            const res = await fetch('/api/admin/parking', {
                method: 'PUT',
                headers: authHeaders(),
                body: JSON.stringify({ id, current_occupancy: Number(current_occupancy), capacity: Number(capacity) })
            });
            if (res.status === 401) return handleUnauthorized();
            if (!res.ok) throw new Error('อัปเดตไม่สำเร็จ กรุณาเช็ค API');
            showToast('อัปเดตข้อมูลจุดฝากรถแล้ว');
            await loadParking();
        } catch (e) {
            showToast(e.message, 'error');
        } finally {
            setUpdatingParking(null);
        }
    };

    const openCreateGuide = () => { setIsNewTopic(true); setGuideError(''); setGuideForm(emptyGuideForm()); guideModal.onOpen(); };
    const openEditGuide = (topic) => {
        setIsNewTopic(false); setGuideError('');
        setGuideForm({
            id: topic.id, icon: topic.icon || 'Package', color: topic.color || COLOR_PRESETS[0], title: topic.title || '', subtitle: topic.subtitle || '',
            sections: (topic.sections && topic.sections.length ? topic.sections : [{ heading: '', items: [] }]).map((s) => ({ heading: s.heading || '', itemsText: (s.items || []).join('\n') })),
        });
        guideModal.onOpen();
    };

    const updateSection = (idx, patch) => { setGuideForm((f) => ({ ...f, sections: f.sections.map((s, i) => (i === idx ? { ...s, ...patch } : s)) })); };
    const addSection = () => setGuideForm((f) => ({ ...f, sections: [...f.sections, emptySection()] }));
    const removeSection = (idx) => setGuideForm((f) => ({ ...f, sections: f.sections.filter((_, i) => i !== idx) }));

    const handleSaveGuide = async () => {
        if (isNewTopic && !guideForm.id.trim()) return setGuideError('กรุณาระบุรหัสหมวด (id) เช่น before, during');
        if (!guideForm.title.trim()) return setGuideError('กรุณาระบุชื่อหมวด');
        const sections = guideForm.sections.map((s) => ({ heading: s.heading.trim(), items: s.itemsText.split('\n').map((t) => t.trim()).filter(Boolean) })).filter((s) => s.heading && s.items.length > 0);
        if (sections.length === 0) return setGuideError('กรุณาเพิ่มอย่างน้อย 1 หัวข้อย่อยพร้อมรายการ');
        setGuideError(''); setSavingGuide(true);
        try {
            const payload = { id: guideForm.id.trim(), icon: guideForm.icon, color: guideForm.color, title: guideForm.title.trim(), subtitle: guideForm.subtitle.trim(), sort_order: isNewTopic ? guideTopics.length + 1 : undefined, sections };
            const res = await fetch('/api/admin/guide', { method: isNewTopic ? 'POST' : 'PATCH', headers: authHeaders(), body: JSON.stringify(payload) });
            if (res.status === 401) return handleUnauthorized();
            if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(data.error || 'บันทึกคู่มือไม่สําเร็จ'); }
            guideModal.onClose(); await loadGuide(); showToast(isNewTopic ? 'เพิ่มหมวดคู่มือแล้ว' : 'บันทึกการแก้ไขแล้ว');
        } catch (e) {
            setGuideError(e.message); showToast(e.message, 'error');
        } finally {
            setSavingGuide(false);
        }
    };

    const deleteGuideTopic = (topic) => {
        askConfirm({
            title: `ลบหมวด "${topic.title}"?`, description: 'เนื้อหาทั้งหมวดจะหายไปจากคู่มือบนแอปทันที และย้อนกลับไม่ได้',
            onConfirm: async () => {
                try {
                    const res = await fetch('/api/admin/guide', { method: 'DELETE', headers: authHeaders(), body: JSON.stringify({ id: topic.id }) });
                    if (res.status === 401) return handleUnauthorized();
                    await loadGuide(); showToast('ลบหมวดคู่มือแล้ว', 'muted');
                } catch (e) { showToast('ลบไม่สำเร็จ ลองใหม่อีกครั้ง', 'error'); }
            },
        });
    };

    const handleUnauthorized = () => { sessionStorage.removeItem('adminKey'); setAdminKey(''); setKeyError('เซสชันหมดอายุหรือรหัสไม่ถูกต้อง กรุณากรอกใหม่'); };
    const handleLogoutKey = () => { sessionStorage.removeItem('adminKey'); setAdminKey(''); setKeyInput(''); };

    const activeReportListRaw = reportsTab === 'pending' ? pending : reportsTab === 'approved' ? approved : rejected;
    const activeReportList = useMemo(() => {
        const q = reportsSearch.trim().toLowerCase();
        if (!q) return activeReportListRaw;
        return activeReportListRaw.filter((r) => (r.location_name || '').toLowerCase().includes(q));
    }, [activeReportListRaw, reportsSearch]);

    const filteredGuideTopics = useMemo(() => {
        const q = guideSearch.trim().toLowerCase();
        if (!q) return guideTopics;
        return guideTopics.filter((t) => (t.title || '').toLowerCase().includes(q) || (t.subtitle || '').toLowerCase().includes(q));
    }, [guideTopics, guideSearch]);

    const activeAlertCount = useMemo(() => alerts.filter((a) => a.is_active).length, [alerts]);
    const pendingContactCount = useMemo(() => contactMessages.filter((m) => m.status !== 'replied').length, [contactMessages]);

    // สรุปคำขอความช่วยเหลือ: ที่ยังเปิดอยู่ / รอรับเรื่อง / กำลังดำเนินการ / เข้ามาวันนี้
    const helpStats = useMemo(() => {
        const open = helpRequests.filter((r) => r.status !== 'resolved');
        const waiting = open.filter((r) => !r.status || r.status === 'pending');
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const newToday = helpRequests.filter((r) => r.created_at && new Date(r.created_at) >= startOfDay);
        return {
            open: open.length,
            pending: waiting.length,
            inProgress: open.length - waiting.length,
            newToday: newToday.length,
        };
    }, [helpRequests]);

    // ใส่จำนวนที่รออยู่ไว้ที่ชื่อแท็บของเบราว์เซอร์
    useEffect(() => {
        if (!adminKey) return;
        const base = 'ระบบหลังบ้าน · Hatyai Flood';
        document.title = helpStats.pending > 0 ? `(${helpStats.pending}) ${base}` : base;
    }, [adminKey, helpStats.pending]);

    if (adminKey === null) { return <div className="min-h-screen bg-[#08222C] flex items-center justify-center"><Spinner color="warning" size="sm" /></div>; }

    if (!adminKey) {
        return (
            <div className="min-h-screen w-full flex flex-col md:flex-row font-['Noto_Sans_Thai']">
                <div className="relative w-full md:w-[44%] min-h-[220px] md:min-h-screen bg-[#08222C] overflow-hidden flex flex-col justify-between p-8 md:p-12">
                    <div className="absolute inset-0 opacity-60" style={{ background: 'radial-gradient(120% 100% at 10% 0%, #12506B 0%, #08222C 60%)' }} />
                    <div className="relative z-10">
                        <Link href="/" className="inline-flex items-center gap-1.5 text-[#F3F8F7]/70 hover:text-[#F3F8F7] text-sm transition-colors">
                            <ArrowLeft size={15} /> กลับไปหน้าแผนที่
                        </Link>
                        <div className="mt-10">
                            <WaterGauge size={44} level={68} label="ระดับน้ํา · เรียลไทม์" />
                            <div className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-[#FF6B4A]/30 bg-[#FF6B4A]/10 px-3 py-1 text-xs text-[#FF6B4A]">
                                <KeyRound size={12} /> สำหรับผู้ดูแลระบบเท่านั้น
                            </div>
                            <h1 className="mt-4 font-['Kanit'] font-semibold text-3xl md:text-[2.6rem] leading-tight text-[#F3F8F7]">ระบบหลังบ้าน</h1>
                            <p className="mt-3 text-[#F3F8F7]/70 text-sm md:text-base max-w-sm leading-relaxed">จัดการประกาศแจ้งเตือน ตรวจสอบรายงานจากผู้ใช้ และแก้ไขคู่มือรับมือน้ําท่วม — กรอกรหัสแอดมินเพื่อเข้าใช้งาน</p>
                        </div>
                    </div>
                    <div className="relative z-10 mt-10 hidden md:block">
                        <svg viewBox="0 0 400 40" className="w-full h-10 opacity-80 tide-line">
                            <path d="M0 20 Q50 0 100 20 T200 20 T300 20 T400 20" fill="none" stroke="#FF6B4A" strokeWidth="2" />
                        </svg>
                    </div>
                </div>
                <div className="flex-1 flex items-center justify-center bg-[#F3F8F7] p-6 md:p-12">
                    <div className="w-full max-w-sm">
                        <div className="mb-8">
                            <h2 className="font-['Kanit'] font-medium text-2xl text-[#08222C]">กรอกรหัสแอดมิน</h2>
                            <p className="text-sm text-[#08222C]/50 mt-1">เฉพาะผู้ดูแลระบบที่ได้รับสิทธิ์เท่านั้น</p>
                        </div>
                        <div className={`flex flex-col gap-5 ${shakeKey ? 'admin-key-shake' : ''}`}>
                            <Input
                                type={isVisibleKey ? 'text' : 'password'} aria-label="รหัสแอดมิน" placeholder="กรอกรหัสของคุณ"
                                value={keyInput} onChange={(e) => setKeyInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && keyInput && verifyKey(keyInput)}
                                disabled={verifying} variant="bordered" size="lg" autoFocus
                                endContent={
                                    <button className="focus:outline-none" type="button" onClick={() => setIsVisibleKey(!isVisibleKey)} aria-label={isVisibleKey ? 'ซ่อนรหัส' : 'แสดงรหัส'}>
                                        {isVisibleKey ? <EyeSlashIcon /> : <EyeIcon />}
                                    </button>
                                }
                                classNames={{
                                    input: "!outline-none !ring-0 !border-none !shadow-none font-['Kanit'] leading-relaxed",
                                    inputWrapper: 'border-[#08222C]/15 data-[hover=true]:border-[#1C6E8C] group-data-[focus=true]:border-[#1C6E8C] group-data-[focus-visible=true]:outline-none group-data-[focus-visible=true]:ring-0 bg-white py-2',
                                }}
                            />
                            {keyError && <div className="flex items-center gap-1.5 text-sm text-red-500"><AlertCircle size={14} />{keyError}</div>}
                            <Button onClick={() => verifyKey(keyInput)} isLoading={verifying} isDisabled={!keyInput} className="bg-[#08222C] text-[#F3F8F7] font-medium h-12 rounded-xl">เข้าสู่ระบบ</Button>
                        </div>
                    </div>
                </div>
                <style jsx>{`.tide-line { animation: tide-drift 6s ease-in-out infinite; } @keyframes tide-drift { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(-12px); } } .admin-key-shake { animation: admin-key-shake 0.4s ease; } @keyframes admin-key-shake { 0%, 100% { transform: translateX(0); } 20% { transform: translateX(-6px); } 40% { transform: translateX(6px); } 60% { transform: translateX(-4px); } 80% { transform: translateX(4px); } }`}</style>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F3F8F7] font-['Noto_Sans_Thai']">
            <div className="relative bg-[#08222C] px-6 py-8 md:px-12 overflow-hidden">
                <div className="absolute inset-0 opacity-60 pointer-events-none" style={{ background: 'radial-gradient(120% 100% at 90% 0%, #12506B 0%, #08222C 60%)' }} />
                <div className="relative z-10 max-w-6xl mx-auto">
                    <div className="flex items-center justify-between">
                        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[#F3F8F7]/60 hover:text-[#F3F8F7] transition-colors">
                            <ArrowLeft size={15} /> กลับแผนที่หลัก
                        </Link>
                        <button onClick={handleLogoutKey} className="inline-flex items-center gap-1.5 text-sm text-[#F3F8F7]/50 hover:text-[#F3F8F7] transition-colors">
                            <LogOut size={14} /> ออกจากระบบแอดมิน
                        </button>
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                        <WaterGauge size={36} level={68} />
                        <div>
                            <h1 className="font-['Kanit'] font-semibold text-3xl text-[#F3F8F7]">ระบบหลังบ้าน (Admin)</h1>
                            <p className="text-sm text-[#F3F8F7]/60 mt-0.5">ประกาศแจ้งเตือนความเสี่ยง ตรวจสอบรายงานจากผู้ใช้ และแก้ไขคู่มือรับมือน้ําท่วม</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-6">
                        <StatCard icon={Clock} label="รอตรวจสอบ" value={pending.length} accent="#FF6B4A" />
                        <StatCard icon={Check} label="ยืนยันแล้ว" value={approved.length} accent="#2FBF83" />
                        <StatCard icon={X} label="ปฏิเสธ" value={rejected.length} accent="#F3F8F7" muted />
                        <StatCard icon={Megaphone} label="ประกาศที่ Active" value={activeAlertCount} accent="#1C6E8C" live={activeAlertCount > 0} />
                        <StatCard icon={Mail} label="ข้อความรอตอบ" value={pendingContactCount} accent="#FF6B4A" live={pendingContactCount > 0} />
                        <StatCard icon={LifeBuoy} label="ขอความช่วยเหลือรอ" value={helpStats.pending} accent="#FF6B4A" live={helpStats.pending > 0} />
                    </div>

                    {/* แถบแจ้งเตือนคำขอความช่วยเหลือ */}
                    {helpStats.open > 0 && (
                        <button
                            type="button"
                            onClick={() => setActiveTab('help')}
                            className="mt-4 flex w-full items-center gap-3 rounded-xl border border-[#FF6B4A]/40 bg-[#FF6B4A]/10 px-4 py-3 text-left transition-colors hover:bg-[#FF6B4A]/15"
                        >
                            <span className="relative flex h-2.5 w-2.5 shrink-0">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FF6B4A] opacity-75" />
                                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#FF6B4A]" />
                            </span>
                            <LifeBuoy size={18} className="shrink-0 text-[#FF6B4A]" />
                            <span className="flex-1 text-sm text-[#F3F8F7]">
                                <b className="text-[#FF6B4A]">รอรับเรื่อง {helpStats.pending} คำขอ</b>
                                <span className="text-[#F3F8F7]/60"> · กำลังดำเนินการ {helpStats.inProgress} · เข้ามาวันนี้ {helpStats.newToday}</span>
                            </span>
                            <span className="shrink-0 text-xs text-[#F3F8F7]/70">ดูคำขอ →</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 md:px-12 py-8">
                <Tabs
                    aria-label="ส่วนจัดการ"
                    selectedKey={activeTab}
                    onSelectionChange={(k) => setActiveTab(String(k))}
                    color="warning"
                    variant="underlined"
                    classNames={{ tabList: 'gap-6 border-b border-[#08222C]/10', cursor: 'bg-[#FF6B4A]', tab: 'px-1 h-12', tabContent: 'text-[#08222C]/50 group-data-[selected=true]:text-[#08222C] font-medium' }}
                >
                    <Tab key="alerts" title={<div className="flex items-center gap-2"><Megaphone size={16} />ประกาศแจ้งเตือน</div>}>
                        <div className="py-6">
                            <p className="text-sm text-[#08222C]/50">ตั้งประกาศล่วงหน้าได้ เช่น เตรียมขนย้ายของล่วงหน้า 3 วัน ประกาศจะขึ้นเป็น popup ที่หน้าแผนที่หลักทันทีที่สร้าง</p>
                            <Card className="mt-5 rounded-2xl border border-[#08222C]/10 shadow-none">
                                <CardBody className="p-5 md:p-6 grid md:grid-cols-2 gap-5">
                                    <div className="flex flex-col gap-4">
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-sm font-medium text-[#08222C]">ระดับความเสี่ยงภาพรวม</label>
                                            <Select selectedKeys={[alertForm.risk_level]} onChange={(e) => setAlertForm((f) => ({ ...f, risk_level: e.target.value }))} variant="bordered" classNames={FIELD_CLASSNAMES}>
                                                <SelectItem key="Warning">เฝ้าระวัง (Warning)</SelectItem>
                                                <SelectItem key="Critical">วิกฤต (Critical)</SelectItem>
                                            </Select>
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-sm font-medium text-[#08222C]">หัวข้อประกาศ</label>
                                            <Input placeholder="เช่น คาดว่าจะมีน้ำท่วมในพื้นที่คลองอู่ตะเภา" value={alertForm.title} onChange={(e) => setAlertForm((f) => ({ ...f, title: e.target.value }))} variant="bordered" classNames={FIELD_CLASSNAMES} />
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-sm font-medium text-[#08222C]">วันที่คาดว่าจะเกิดเหตุ</label>
                                            {isMounted ? (
                                                <HeroUIProvider locale="th-TH-u-ca-buddhist">
                                                    <DatePicker value={alertForm.alert_date ? parseDate(alertForm.alert_date) : null} onChange={(date) => setAlertForm((f) => ({ ...f, alert_date: date ? date.toString() : '' }))} minValue={today(getLocalTimeZone())} variant="bordered" classNames={{ base: "font-['Noto_Sans_Thai']", inputWrapper: "border-[#08222C]/15 data-[hover=true]:border-[#1C6E8C] data-[focus=true]:border-[#1C6E8C] bg-white shadow-none !outline-none", segment: "focus:!outline-none" }} />
                                                </HeroUIProvider>
                                            ) : <div className="h-[42px] w-full rounded-xl border border-[#08222C]/15 bg-white/50 animate-pulse" />}
                                        </div>
                                        <div className="flex flex-col gap-1.5 pt-1">
                                            <label className="text-sm font-medium text-[#08222C]">ระดับความเสี่ยงคาดการณ์ 3 วัน</label>
                                            <div className="grid grid-cols-3 gap-3">
                                                <div className="flex flex-col gap-1.5">
                                                    <span className="text-xs font-medium text-[#08222C]/70">วันนี้</span>
                                                    <Select aria-label="ความเสี่ยงวันนี้" selectedKeys={[alertForm.risk_today]} onChange={(e) => setAlertForm((f) => ({ ...f, risk_today: e.target.value }))} variant="bordered" classNames={{ ...FIELD_CLASSNAMES, trigger: "h-11 min-h-[44px]", value: "text-xs sm:text-sm font-medium" }}>
                                                        <SelectItem key="เสี่ยงต่ำ">เสี่ยงต่ำ</SelectItem><SelectItem key="เสี่ยงปานกลาง">เสี่ยงปานกลาง</SelectItem><SelectItem key="เสี่ยงสูง">เสี่ยงสูง</SelectItem><SelectItem key="วิกฤต">วิกฤต</SelectItem>
                                                    </Select>
                                                </div>
                                                <div className="flex flex-col gap-1.5">
                                                    <span className="text-xs font-medium text-[#08222C]/70">พรุ่งนี้</span>
                                                    <Select aria-label="ความเสี่ยงพรุ่งนี้" selectedKeys={[alertForm.risk_tomorrow]} onChange={(e) => setAlertForm((f) => ({ ...f, risk_tomorrow: e.target.value }))} variant="bordered" classNames={{ ...FIELD_CLASSNAMES, trigger: "h-11 min-h-[44px]", value: "text-xs sm:text-sm font-medium" }}>
                                                        <SelectItem key="เสี่ยงต่ำ">เสี่ยงต่ำ</SelectItem><SelectItem key="เสี่ยงปานกลาง">เสี่ยงปานกลาง</SelectItem><SelectItem key="เสี่ยงสูง">เสี่ยงสูง</SelectItem><SelectItem key="วิกฤต">วิกฤต</SelectItem>
                                                    </Select>
                                                </div>
                                                <div className="flex flex-col gap-1.5">
                                                    <span className="text-xs font-medium text-[#08222C]/70">มะรืน</span>
                                                    <Select aria-label="ความเสี่ยงมะรืน" selectedKeys={[alertForm.risk_day_after]} onChange={(e) => setAlertForm((f) => ({ ...f, risk_day_after: e.target.value }))} variant="bordered" classNames={{ ...FIELD_CLASSNAMES, trigger: "h-11 min-h-[44px]", value: "text-xs sm:text-sm font-medium" }}>
                                                        <SelectItem key="เสี่ยงต่ำ">เสี่ยงต่ำ</SelectItem><SelectItem key="เสี่ยงปานกลาง">เสี่ยงปานกลาง</SelectItem><SelectItem key="เสี่ยงสูง">เสี่ยงสูง</SelectItem><SelectItem key="วิกฤต">วิกฤต</SelectItem>
                                                    </Select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-4">
                                        <div className="flex flex-col gap-1.5 flex-1">
                                            <label className="text-sm font-medium text-[#08222C]">รายละเอียดเพิ่มเติม / สิ่งที่ควรทำ</label>
                                            <Textarea placeholder="เช่น เตรียมถุงยังชีพ น้ำดื่ม และย้ายของมีค่าขึ้นที่สูง" minRows={7} value={alertForm.message} onChange={(e) => setAlertForm((f) => ({ ...f, message: e.target.value }))} variant="bordered" classNames={FIELD_CLASSNAMES} />
                                        </div>
                                        {alertError && <div className="flex items-center gap-1.5 text-sm text-red-500"><AlertCircle size={14} />{alertError}</div>}
                                        <Button onClick={handleCreateAlert} isLoading={creatingAlert} startContent={!creatingAlert && <Plus size={16} />} className="bg-[#FF6B4A] text-[#08222C] font-medium rounded-xl h-11 mt-auto">เผยแพร่ประกาศ</Button>
                                    </div>
                                </CardBody>
                            </Card>
                            <div className="mt-5 flex flex-col gap-2">
                                {loadingAlerts && <SkeletonList rows={3} />}
                                {!loadingAlerts && alerts.length === 0 && <EmptyState text="ยังไม่มีประกาศ" />}
                                {alerts.map((a) => (
                                    <Card key={a.id} className="rounded-xl border border-[#08222C]/10 shadow-none transition-shadow hover:shadow-sm">
                                        <CardBody className="flex-row items-center justify-between gap-3 px-4 py-3">
                                            <div className="flex items-start gap-3">
                                                <Chip size="sm" variant="bordered" className={`shrink-0 ${RISK_STYLES[a.risk_level] || ''}`}>{a.risk_level}</Chip>
                                                <div>
                                                    <div className="flex items-center gap-1.5">
                                                        {a.is_active && <span className="relative flex h-1.5 w-1.5 shrink-0"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2FBF83] opacity-75" /><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#2FBF83]" /></span>}
                                                        <p className={`text-sm font-medium text-[#08222C] ${!a.is_active ? 'line-through opacity-40' : ''}`}>{a.title}</p>
                                                    </div>
                                                    <p className="text-xs text-[#08222C]/45">แจ้งเมื่อ {new Date(a.created_at).toLocaleDateString('th-TH')} · เกิดเหตุ {new Date(a.alert_date).toLocaleDateString('th-TH')}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <Button size="sm" variant="flat" startContent={<Power size={13} />} onClick={() => toggleAlertActive(a)} className="bg-[#08222C]/5 text-[#08222C]/70">{a.is_active ? 'ปิดประกาศ' : 'เปิดใช้อีกครั้ง'}</Button>
                                                <Button size="sm" variant="flat" isIconOnly onClick={() => deleteAlert(a.id)} className="bg-red-50 text-red-500" aria-label="ลบประกาศ"><Trash2 size={14} /></Button>
                                            </div>
                                        </CardBody>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </Tab>

                    <Tab key="reports" title={<div className="flex items-center gap-2"><ListChecks size={16} />รายงานผู้ใช้</div>}>
                        <div className="py-6">
                            <p className="text-sm text-[#08222C]/50">ตรวจสอบความถูกต้องก่อนกดยอมรับ — เมื่อยอมรับแล้วหมุดจะแสดงบนแผนที่หลักทันที</p>
                            <div className="mt-4 flex flex-col md:flex-row md:items-center gap-3">
                                <div className="flex items-center gap-2">
                                    {[{ key: 'pending', label: `รอตรวจสอบ (${pending.length})` }, { key: 'approved', label: `ยืนยันแล้ว (${approved.length})` }, { key: 'rejected', label: `ปฏิเสธ (${rejected.length})` }].map((tab) => (
                                        <button key={tab.key} onClick={() => setReportsTab(tab.key)} className={`text-sm px-4 py-2 rounded-lg transition-colors ${reportsTab === tab.key ? 'bg-[#08222C] text-[#F3F8F7]' : 'bg-[#08222C]/5 text-[#08222C]/60 hover:bg-[#08222C]/10'}`}>{tab.label}</button>
                                    ))}
                                </div>
                                <Input size="sm" placeholder="ค้นหาชื่อสถานที่..." value={reportsSearch} onChange={(e) => setReportsSearch(e.target.value)} startContent={<Search size={14} className="text-[#08222C]/40" />} variant="bordered" className="md:max-w-[220px] md:ml-auto" classNames={{ input: "font-['Noto_Sans_Thai'] leading-relaxed !outline-none", inputWrapper: 'bg-white border-[#08222C]/15 group-data-[focus-visible=true]:outline-none group-data-[focus-visible=true]:ring-0 py-2' }} />
                            </div>
                            <div className="mt-4 flex flex-col gap-3">
                                {loadingReports && <SkeletonList rows={3} />}
                                {!loadingReports && activeReportList.length === 0 && <EmptyState text={reportsSearch ? `ไม่พบรายงานที่ตรงกับ "${reportsSearch}"` : 'ไม่มีรายงานในหมวดนี้'} />}
                                {activeReportList.map((r) => (
                                    <Card key={r.id} className="rounded-xl border border-[#08222C]/10 shadow-none transition-shadow hover:shadow-sm">
                                        <CardBody className="md:flex-row md:items-center justify-between gap-3 px-4 py-3.5">
                                            <div className="flex items-start gap-3">
                                                <Chip size="sm" variant="bordered" className={`shrink-0 ${RISK_STYLES[r.risk_level] || ''}`}>{r.risk_level}</Chip>
                                                <div>
                                                    <p className="text-sm font-medium text-[#08222C]">{r.location_name}</p>
                                                    <p className="text-xs text-[#08222C]/45 flex items-center gap-1"><Waves size={11} />ความลึก {Number(r.water_level_meters).toFixed(2)} ม. · {new Date(r.reported_at).toLocaleString('th-TH')}</p>
                                                    <a href={`https://www.google.com/maps?q=${r.latitude},${r.longitude}`} target="_blank" rel="noreferrer" className="text-xs text-[#1C6E8C] hover:underline inline-flex items-center gap-1 mt-0.5"><MapPinned size={11} />เปิดพิกัดใน Google Maps<ExternalLink size={10} /></a>
                                                </div>
                                            </div>
                                            {reportsTab === 'pending' && (
                                                <div className="flex items-center gap-2 shrink-0 mt-3 md:mt-0">
                                                    <Button size="sm" isLoading={actingId === r.id} startContent={actingId !== r.id && <Check size={14} />} onClick={() => handleReview(r.id, 'approve')} className="bg-[#2FBF83] text-[#08222C] font-medium rounded-lg">ยอมรับ</Button>
                                                    <Button size="sm" isLoading={actingId === r.id} startContent={actingId !== r.id && <X size={14} />} onClick={() => handleReview(r.id, 'reject')} variant="bordered" className="border-red-300 text-red-500 rounded-lg">ปฏิเสธ</Button>
                                                </div>
                                            )}
                                            {reportsTab !== 'pending' && <button onClick={() => handleReview(r.id, 'reset')} className="text-xs text-[#08222C]/50 hover:text-[#08222C] inline-flex items-center gap-1 self-start md:self-auto mt-3 md:mt-0"><Undo2 size={12} />ย้ายกลับไปรอตรวจสอบ</button>}
                                        </CardBody>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </Tab>

                    <Tab key="guide" title={<div className="flex items-center gap-2"><BookOpen size={16} />คู่มือ</div>}>
                        <div className="py-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                <p className="text-sm text-[#08222C]/50">แก้ไขเนื้อหาคู่มือเตรียมพร้อมรับมือน้ําท่วมที่แสดงบนแอปได้จากที่นี่ — บันทึกแล้วมีผลทันที</p>
                                <div className="flex items-center gap-2 shrink-0">
                                    <Input size="sm" placeholder="ค้นหาหมวด..." value={guideSearch} onChange={(e) => setGuideSearch(e.target.value)} startContent={<Search size={14} className="text-[#08222C]/40" />} variant="bordered" className="w-[180px]" classNames={{ input: "font-['Noto_Sans_Thai'] leading-relaxed !outline-none", inputWrapper: 'bg-white border-[#08222C]/15 group-data-[focus-visible=true]:outline-none group-data-[focus-visible=true]:ring-0 py-2' }} />
                                    <Button size="sm" onClick={openCreateGuide} startContent={<Plus size={15} />} className="bg-[#08222C] text-[#F3F8F7] font-medium rounded-xl shrink-0">เพิ่มหมวด</Button>
                                </div>
                            </div>
                            <div className="mt-5 flex flex-col gap-3">
                                {loadingGuide && <SkeletonList rows={4} />}
                                {!loadingGuide && guideTopics.length === 0 && <EmptyState text="ยังไม่มีข้อมูลคู่มือ (ต้องรัน db/migration_guide.sql ก่อน)" />}
                                {!loadingGuide && guideTopics.length > 0 && filteredGuideTopics.length === 0 && <EmptyState text={`ไม่พบหมวดที่ตรงกับ "${guideSearch}"`} />}
                                {filteredGuideTopics.map((t) => (
                                    <Card key={t.id} className="rounded-xl border border-[#08222C]/10 shadow-none transition-shadow hover:shadow-sm">
                                        <CardBody className="flex-row items-center justify-between gap-3 px-4 py-3.5">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${t.color}1F`, color: t.color }}><GuideIcon name={t.icon} size={17} /></div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-[#08222C] truncate">{t.title}</p>
                                                    <p className="text-xs text-[#08222C]/45 truncate">{t.subtitle} · {(t.sections || []).length} หัวข้อย่อย</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <Button size="sm" variant="flat" isIconOnly onClick={() => openEditGuide(t)} className="bg-[#08222C]/5 text-[#08222C]/70" aria-label="แก้ไข"><Pencil size={14} /></Button>
                                                <Button size="sm" variant="flat" isIconOnly onClick={() => deleteGuideTopic(t)} className="bg-red-50 text-red-500" aria-label="ลบ"><Trash2 size={14} /></Button>
                                            </div>
                                        </CardBody>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </Tab>

                    <Tab key="evac" title={<div className="flex items-center gap-2"><Tent size={16} />ศูนย์อพยพ</div>}>
                        <div className="py-6">
                            <p className="text-sm text-[#08222C]/50 mb-5">อัปเดตจำนวนผู้เข้าพักในแต่ละศูนย์อพยพ เพื่อให้ประชาชนทราบสถานะว่าว่าง/เต็มแบบเรียลไทม์บนแผนที่</p>
                            <div className="grid md:grid-cols-2 gap-4">
                                {loadingEvac && <SkeletonList rows={3} />}
                                {!loadingEvac && evacCenters.length === 0 && <EmptyState text="ยังไม่มีข้อมูลศูนย์อพยพในระบบ" />}
                                {evacCenters.map((c) => {
                                    const dbCap = Number(c.capacity) || 0;
                                    const dbOcc = Number(c.current_occupancy) || 0;
                                    const upd = evacUpdates[c.id] || {};
                                    const currentCap = upd.capacity !== undefined ? upd.capacity : dbCap;
                                    const currentOcc = upd.current_occupancy !== undefined ? upd.current_occupancy : dbOcc;
                                    const isFull = currentCap > 0 && currentOcc >= currentCap;

                                    return (
                                        <Card key={c.id} className="rounded-xl border border-[#08222C]/10 shadow-none">
                                            <CardBody className="gap-4 p-5">
                                                <div>
                                                    <h3 className="font-semibold text-[#08222C] text-[15px]">{c.name}</h3>
                                                </div>
                                                <div className="flex flex-col gap-3">
                                                    <div className="flex gap-3">
                                                        <div className="flex-1 flex flex-col gap-1.5">
                                                            <label className="text-sm font-medium text-[#08222C]">ความจุสูงสุด (คน)</label>
                                                            <Input type="number" min={0} variant="bordered" value={currentCap} onChange={(e) => setEvacUpdates((prev) => ({ ...prev, [c.id]: { ...prev[c.id], capacity: e.target.value } }))} classNames={{ input: "font-['Noto_Sans_Thai'] text-lg font-medium text-[#08222C] !outline-none", inputWrapper: "border-[#08222C]/15 bg-white data-[focus=true]:border-[#1C6E8C] data-[focus-visible=true]:!outline-none data-[focus-visible=true]:!ring-0 data-[focus-visible=true]:!ring-offset-0 shadow-none" }} />
                                                        </div>
                                                        <div className="flex-1 flex flex-col gap-1.5">
                                                            <label className="text-sm font-medium text-[#08222C]">เข้าพักปัจจุบัน (คน)</label>
                                                            <Input type="number" min={0} variant="bordered" value={currentOcc} onChange={(e) => setEvacUpdates((prev) => ({ ...prev, [c.id]: { ...prev[c.id], current_occupancy: e.target.value } }))} classNames={{ input: "font-['Noto_Sans_Thai'] text-lg font-medium text-[#08222C] !outline-none", inputWrapper: "border-[#08222C]/15 bg-white data-[focus=true]:border-[#1C6E8C] data-[focus-visible=true]:!outline-none data-[focus-visible=true]:!ring-0 data-[focus-visible=true]:!ring-offset-0 shadow-none" }} />
                                                        </div>
                                                    </div>
                                                    <Button isLoading={updatingEvac === c.id} onClick={() => handleUpdateEvac(c.id, dbOcc, dbCap)} className="bg-[#2FBF83] text-[#08222C] font-medium h-12 rounded-xl w-full">บันทึกข้อมูล</Button>
                                                </div>
                                                {isFull && <div className="text-xs text-red-500 font-medium bg-red-50 px-2.5 py-1.5 rounded-lg inline-block w-fit mt-1">⚠️ ขณะนี้ศูนย์อพยพเต็มความจุแล้ว!</div>}
                                            </CardBody>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                    </Tab>

                    <Tab key="parking" title={<div className="flex items-center gap-2"><Car size={16} />จุดฝากรถ</div>}>
                        <div className="py-6">
                            <p className="text-sm text-[#08222C]/50 mb-5">อัปเดตจำนวนรถที่ฝากในแต่ละจุด เพื่อให้ประชาชนทราบสถานะว่าว่าง/เต็มแบบเรียลไทม์บนแผนที่</p>
                            <div className="grid md:grid-cols-2 gap-4">
                                {loadingParking && <SkeletonList rows={3} />}
                                {!loadingParking && parkingSpots.length === 0 && <EmptyState text="ยังไม่มีข้อมูลจุดฝากรถในระบบ" />}
                                {parkingSpots.map((p) => {
                                    const dbCap = Number(p.capacity) || 0;
                                    const dbOcc = Number(p.current_occupancy) || 0;
                                    const upd = parkingUpdates[p.id] || {};
                                    const currentCap = upd.capacity !== undefined ? upd.capacity : dbCap;
                                    const currentOcc = upd.current_occupancy !== undefined ? upd.current_occupancy : dbOcc;
                                    const isFull = currentCap > 0 && currentOcc >= currentCap;

                                    return (
                                        <Card key={p.id} className="rounded-xl border border-[#08222C]/10 shadow-none">
                                            <CardBody className="gap-4 p-5">
                                                <div>
                                                    <h3 className="font-semibold text-[#08222C] text-[15px]">{p.name}</h3>
                                                </div>
                                                <div className="flex flex-col gap-3">
                                                    <div className="flex gap-3">
                                                        <div className="flex-1 flex flex-col gap-1.5">
                                                            <label className="text-sm font-medium text-[#08222C]">ความจุสูงสุด (คัน)</label>
                                                            <Input type="number" min={0} variant="bordered" value={currentCap} onChange={(e) => setParkingUpdates((prev) => ({ ...prev, [p.id]: { ...prev[p.id], capacity: e.target.value } }))} classNames={{ input: "font-['Noto_Sans_Thai'] text-lg font-medium text-[#08222C] !outline-none", inputWrapper: "border-[#08222C]/15 bg-white data-[focus=true]:border-[#1C6E8C] data-[focus-visible=true]:!outline-none data-[focus-visible=true]:!ring-0 data-[focus-visible=true]:!ring-offset-0 shadow-none" }} />
                                                        </div>
                                                        <div className="flex-1 flex flex-col gap-1.5">
                                                            <label className="text-sm font-medium text-[#08222C]">ฝากปัจจุบัน (คัน)</label>
                                                            <Input type="number" min={0} variant="bordered" value={currentOcc} onChange={(e) => setParkingUpdates((prev) => ({ ...prev, [p.id]: { ...prev[p.id], current_occupancy: e.target.value } }))} classNames={{ input: "font-['Noto_Sans_Thai'] text-lg font-medium text-[#08222C] !outline-none", inputWrapper: "border-[#08222C]/15 bg-white data-[focus=true]:border-[#1C6E8C] data-[focus-visible=true]:!outline-none data-[focus-visible=true]:!ring-0 data-[focus-visible=true]:!ring-offset-0 shadow-none" }} />
                                                        </div>
                                                    </div>
                                                    <Button isLoading={updatingParking === p.id} onClick={() => handleUpdateParking(p.id, dbOcc, dbCap)} className="bg-[#2FBF83] text-[#08222C] font-medium h-12 rounded-xl w-full">บันทึกข้อมูล</Button>
                                                </div>
                                                {isFull && <div className="text-xs text-red-500 font-medium bg-red-50 px-2.5 py-1.5 rounded-lg inline-block w-fit mt-1">⚠️ ขณะนี้จุดฝากรถเต็มความจุแล้ว!</div>}
                                            </CardBody>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                    </Tab>

                    <Tab key="help" title={<div className="flex items-center gap-2"><LifeBuoy size={16} />ขอความช่วยเหลือ{helpStats.pending > 0 && <Chip size="sm" className="bg-[#FF6B4A]/15 text-[#FF6B4A] h-5 px-1.5">{helpStats.pending}</Chip>}</div>}>
                        <AdminHelpTab authHeaders={authHeaders} onUnauthorized={handleUnauthorized} showToast={showToast} onChanged={loadHelp} />
                    </Tab>

                    <Tab key="contact" title={<div className="flex items-center gap-2"><Mail size={16} />ข้อความจากผู้ใช้{pendingContactCount > 0 && <Chip size="sm" className="bg-[#FF6B4A]/15 text-[#FF6B4A] h-5 px-1.5">{pendingContactCount}</Chip>}</div>}>
                        <AdminContactTab messages={contactMessages} loading={loadingContact} authHeaders={authHeaders} onHandled={loadContact} onUnauthorized={handleUnauthorized} showToast={showToast} />
                    </Tab>
                </Tabs>
            </div>

            {/* Modal: เพิ่ม/แก้ไขหมวดคู่มือ */}
            <Modal isOpen={guideModal.isOpen} onOpenChange={guideModal.onOpenChange} size="2xl" scrollBehavior="inside">
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="font-['Kanit'] font-semibold text-[#08222C]">{isNewTopic ? 'เพิ่มหมวดคู่มือใหม่' : `แก้ไขหมวด: ${guideForm.title}`}</ModalHeader>
                            <ModalBody className="gap-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    {isNewTopic && (
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-sm font-medium text-[#08222C]">รหัสหมวด (id)</label>
                                            <Input placeholder="เช่น evacuation" description="ใช้ตัวอักษรอังกฤษเล็กและขีดกลาง แก้ไขภายหลังไม่ได้" value={guideForm.id} onChange={(e) => setGuideForm((f) => ({ ...f, id: e.target.value.trim().toLowerCase() }))} variant="bordered" classNames={FIELD_CLASSNAMES} />
                                        </div>
                                    )}
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-sm font-medium text-[#08222C]">ชื่อหมวด</label>
                                        <Input placeholder="เช่น ก่อนน้ําท่วม" value={guideForm.title} onChange={(e) => setGuideForm((f) => ({ ...f, title: e.target.value }))} variant="bordered" classNames={FIELD_CLASSNAMES} />
                                    </div>
                                    <div className={`flex flex-col gap-1.5 ${isNewTopic ? '' : 'md:col-span-1'}`}>
                                        <label className="text-sm font-medium text-[#08222C]">คําอธิบายย่อย</label>
                                        <Input placeholder="เช่น เตรียมของและวางแผนล่วงหน้า" value={guideForm.subtitle} onChange={(e) => setGuideForm((f) => ({ ...f, subtitle: e.target.value }))} variant="bordered" classNames={FIELD_CLASSNAMES} />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-sm font-medium text-[#08222C]">ไอคอน</label>
                                        <Select selectedKeys={[guideForm.icon]} onChange={(e) => setGuideForm((f) => ({ ...f, icon: e.target.value }))} variant="bordered" classNames={FIELD_CLASSNAMES} renderValue={() => (<div className="flex items-center gap-2"><GuideIcon name={guideForm.icon} size={15} />{GUIDE_ICON_LABELS[guideForm.icon] || guideForm.icon}</div>)}>
                                            {GUIDE_ICON_OPTIONS.map((name) => (<SelectItem key={name} textValue={GUIDE_ICON_LABELS[name] || name}><div className="flex items-center gap-2"><GuideIcon name={name} size={15} />{GUIDE_ICON_LABELS[name] || name}</div></SelectItem>))}
                                        </Select>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs text-[#08222C]/50 mb-2">สีประจําหมวด</p>
                                    <div className="flex items-center gap-2">
                                        {COLOR_PRESETS.map((c) => (<button key={c} onClick={() => setGuideForm((f) => ({ ...f, color: c }))} className="w-7 h-7 rounded-full border-2 transition-transform" style={{ background: c, borderColor: guideForm.color === c ? '#08222C' : 'transparent', transform: guideForm.color === c ? 'scale(1.1)' : 'scale(1)' }} aria-label={c} />))}
                                    </div>
                                </div>
                                <Divider />
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-[#08222C]">หัวข้อย่อย</p>
                                    <Button size="sm" variant="flat" startContent={<Plus size={14} />} onClick={addSection} className="bg-[#08222C]/5 text-[#08222C]/70">เพิ่มหัวข้อย่อย</Button>
                                </div>
                                {guideForm.sections.map((s, idx) => (
                                    <Card key={idx} className="rounded-xl border border-[#08222C]/10 shadow-none">
                                        <CardBody className="gap-4">
                                            <div className="flex items-start gap-2">
                                                <div className="flex flex-col gap-1.5 flex-1">
                                                    <label className="text-sm font-medium text-[#08222C]">หัวข้อย่อยที่ {idx + 1}</label>
                                                    <Input placeholder="เช่น ของใช้จําเป็น" value={s.heading} onChange={(e) => updateSection(idx, { heading: e.target.value })} variant="bordered" classNames={FIELD_CLASSNAMES} className="w-full" />
                                                </div>
                                                {guideForm.sections.length > 1 && (<Button size="sm" variant="flat" isIconOnly onClick={() => removeSection(idx)} className="bg-red-50 text-red-500 mt-7" aria-label="ลบหัวข้อย่อย"><Trash2 size={14} /></Button>)}
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-sm font-medium text-[#08222C]">รายการ (1 บรรทัดต่อ 1 รายการ)</label>
                                                <Textarea placeholder={'น้ําดื่มสํารอง คนละ 3 ลิตร/วัน\nไฟฉาย ถ่านไฟฉาย และพาวเวอร์แบงก์'} minRows={3} value={s.itemsText} onChange={(e) => updateSection(idx, { itemsText: e.target.value })} variant="bordered" classNames={FIELD_CLASSNAMES} />
                                            </div>
                                        </CardBody>
                                    </Card>
                                ))}
                                {guideError && <div className="flex items-center gap-1.5 text-sm text-red-500"><AlertCircle size={14} />{guideError}</div>}
                            </ModalBody>
                            <ModalFooter>
                                <Button variant="light" onClick={onClose} className="text-[#08222C]/60">ยกเลิก</Button>
                                <Button onClick={handleSaveGuide} isLoading={savingGuide} className="bg-[#FF6B4A] text-[#08222C] font-medium rounded-xl">บันทึก</Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

            {/* Modal: ยืนยันการลบ (ใช้ร่วมกัน) */}
            <Modal isOpen={confirmModal.isOpen} onOpenChange={confirmModal.onOpenChange} size="sm">
                <ModalContent>
                    {() => (
                        <>
                            <ModalHeader className="font-['Kanit'] font-semibold text-[#08222C]">{confirmState?.title}</ModalHeader>
                            <ModalBody><p className="text-sm text-[#08222C]/60">{confirmState?.description}</p></ModalBody>
                            <ModalFooter>
                                <Button variant="light" onClick={confirmModal.onClose} className="text-[#08222C]/60">ยกเลิก</Button>
                                <Button onClick={runConfirm} startContent={<Trash2 size={14} />} className="bg-red-500 text-white font-medium rounded-xl">{confirmState?.confirmLabel || 'ยืนยันการลบ'}</Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

            <ToastStack toasts={toasts} onDismiss={dismissToast} />

            <style jsx global>{`@keyframes toast-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        </div>
    );
}

function StatCard({ icon: Icon, label, value, accent, muted, live }) {
    return (
        <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
            <div className="flex items-center gap-1.5 text-[11px] text-[#F3F8F7]/45">
                {Icon && <Icon size={12} />}
                {label}
                {live && (
                    <span className="relative flex h-1.5 w-1.5 ml-0.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2FBF83] opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#2FBF83]" />
                    </span>
                )}
            </div>
            <p className="mt-1 font-['JetBrains_Mono'] text-2xl font-semibold" style={{ color: muted ? 'rgba(243,248,247,0.5)' : accent }}><AnimatedNumber value={value} /></p>
        </div>
    );
}

function AnimatedNumber({ value }) {
    const [display, setDisplay] = useState(value);
    const fromRef = useRef(value);
    useEffect(() => {
        const from = fromRef.current;
        const to = value;
        if (from === to) { setDisplay(to); return; }
        const duration = 450;
        const start = performance.now();
        let raf;
        const tick = (now) => {
            const t = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - t, 3);
            setDisplay(Math.round(from + (to - from) * eased));
            if (t < 1) raf = requestAnimationFrame(tick);
            else fromRef.current = to;
        };
        raf = requestAnimationFrame(tick);
        return () => raf && cancelAnimationFrame(raf);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);
    return <>{display}</>;
}

function SkeletonList({ rows = 3 }) {
    return (
        <div className="flex flex-col gap-2">
            {Array.from({ length: rows }).map((_, i) => (<div key={i} className="h-[60px] rounded-xl border border-[#08222C]/10 bg-[#08222C]/[0.03] animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />))}
        </div>
    );
}

function EmptyState({ text }) {
    return (
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <div className="w-10 h-10 rounded-full bg-[#08222C]/5 flex items-center justify-center text-[#08222C]/30"><Inbox size={18} /></div>
            <p className="text-sm text-[#08222C]/40">{text}</p>
        </div>
    );
}

function ToastStack({ toasts, onDismiss }) {
    if (!toasts.length) return null;
    const styles = {
        success: { bg: '#08222C', fg: '#F3F8F7', Icon: CheckCircle2, iconColor: '#2FBF83' },
        error: { bg: '#08222C', fg: '#F3F8F7', Icon: AlertCircle, iconColor: '#FF6B4A' },
        muted: { bg: '#08222C', fg: '#F3F8F7', Icon: CheckCircle2, iconColor: '#F3F8F7' },
        help: { bg: '#08222C', fg: '#F3F8F7', Icon: LifeBuoy, iconColor: '#FF6B4A' },
    };
    return (
        <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 items-end">
            {toasts.map((t) => {
                const s = styles[t.type] || styles.success;
                const Icon = s.Icon;
                return (
                    <div key={t.id} role="status" onClick={() => onDismiss(t.id)} className="flex items-center gap-2 rounded-xl px-4 py-2.5 shadow-lg cursor-pointer max-w-xs" style={{ background: s.bg, color: s.fg, animation: 'toast-in 0.25s ease' }}>
                        <Icon size={15} style={{ color: s.iconColor }} className="shrink-0" />
                        <span className="text-sm">{t.message}</span>
                    </div>
                );
            })}
        </div>
    );
}