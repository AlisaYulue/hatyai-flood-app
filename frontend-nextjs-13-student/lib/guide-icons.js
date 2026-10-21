// lib/guide-icons.js
// ไอคอนทั้งหมดที่ใช้ในคู่มือ — ไม่มี emoji, อ้างอิงด้วยชื่อ (string) ที่เก็บไว้ในตาราง flood_guide_topics
// เพิ่ม/ลดตัวเลือกได้จากอ็อบเจ็กต์นี้ที่เดียว ตัวเลือกในหน้า admin จะอัปเดตตาม

import {
    Backpack,
    AlertTriangle,
    Wrench,
    Phone,
    ShieldAlert,
    Droplets,
    LifeBuoy,
    HeartPulse,
    Home,
    Flashlight,
    Siren,
    MapPin,
    Package,
    CloudRain,
    Waves,
    FileWarning,
    HandHelping,
} from 'lucide-react';

export const GUIDE_ICON_MAP = {
    Backpack,
    AlertTriangle,
    Wrench,
    Phone,
    ShieldAlert,
    Droplets,
    LifeBuoy,
    HeartPulse,
    Home,
    Flashlight,
    Siren,
    MapPin,
    Package,
    CloudRain,
    Waves,
    FileWarning,
    HandHelping,
};

export const GUIDE_ICON_OPTIONS = Object.keys(GUIDE_ICON_MAP);

// ป้ายชื่อภาษาไทยสั้น ๆ ไว้โชว์ในตัวเลือกของหน้า admin (ไม่บังคับต้องใช้)
export const GUIDE_ICON_LABELS = {
    Backpack: 'กระเป๋าเตรียมของ',
    AlertTriangle: 'แจ้งเตือน',
    Wrench: 'ซ่อมแซม/ฟื้นฟู',
    Phone: 'โทรศัพท์',
    ShieldAlert: 'ความปลอดภัย',
    Droplets: 'ระดับน้ำ',
    LifeBuoy: 'ช่วยเหลือ/กู้ภัย',
    HeartPulse: 'การแพทย์',
    Home: 'ที่พักอาศัย',
    Flashlight: 'ไฟฉาย',
    Siren: 'ไซเรน/ฉุกเฉิน',
    MapPin: 'จุดพิกัด',
    Package: 'ทั่วไป',
    CloudRain: 'สภาพอากาศ',
    Waves: 'น้ำท่วม',
    FileWarning: 'เอกสารสำคัญ',
    HandHelping: 'อาสาสมัคร',
};

/**
 * เรนเดอร์ไอคอนจากชื่อ (string) — ถ้าไม่พบชื่อในแมป จะ fallback ไปที่ Package
 * ใช้แทน emoji ทุกจุดที่แสดงไอคอนของคู่มือ
 */
export function GuideIcon({ name, ...props }) {
    const Cmp = GUIDE_ICON_MAP[name] || Package;
    return <Cmp {...props} />;
}