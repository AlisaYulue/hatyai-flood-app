// --------------------------------------------- FUNCTION ใส่ลูกน้ำจำนวนหลักพันในตัวเลข
export function addThousandsSeparator(number) {
    if (number) {
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    } else {
        return '-'
    }
}

// ------------------------------------------- FUNCTION COLOR
export const statusColorMap = {
    0: "danger",
    1: "default",
    2: "primary",
    3: "warning",
    4: "secondary",
    5: "success",
};

// ----------------------------------------------- FUNCTION แปลงอาร์เรย์ให้อยู่ในรูปแบบของ Tuple
export function convertToTuple(arr) {
    const tuple = '(' + arr.join(', ') + ')';
    return tuple;
}

// ----------------------------------------------- FUNCTION filterSortType
export function filterSortType(data, category) {
    return data.filter(item => category.includes(item.category.toString()));
}

//---------------------------------------------------------------------------------------------------------------------------- START FORMAT CID
export function formatCid(CidString) {
    var cleaned = ('' + CidString).replace(/\D/g, '');
    var match = cleaned.match(/^(\d{1})(\d{4})(\d{5})(\d{2})(\d{1})$/);
    // console.log(match)
    if (match) {
        return match[1] + '-' + match[2] + '-' + match[3] + '-' + match[4] + '-' + match[5];
    }
    return null;
}
//---------------------------------------------------------------------------------------------------------------------------- END FORMAT CID

//---------------------------------------------------------------------------------------------------------------------------- START FORMAT PHONE NUMBER
export function formatPhoneNumber(phoneNumberString) {
    var cleaned = ('' + phoneNumberString).replace(/\D/g, '');
    var match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    // console.log(match)
    if (match) {
        return match[1] + '-' + match[2] + '-' + match[3];
    }
    return null;
}
//---------------------------------------------------------------------------------------------------------------------------- END FORMAT PHONE NUMBER


//---------------------------------------------------------------- FUNCTION DELAY ส่งค่าจำนวนวินาทีมา เช่น 100 = 1 วินาที
export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


//---------------------------------------------------------------- FUNCTION กรอง ENTER และ ตาม ข้อ
export function SplitByLines(data) {

    // แยกข้อความตามการขึ้นบรรทัดใหม่
    const splitByLines = data.split(/\r?\n/);

    // จากนั้นแยกข้อความตามหมายเลขลำดับ (ถ้ามี) และกรองข้อมูลที่ไม่ใช่หมายเลขลำดับออก
    // const items = splitByLines.flatMap(line =>
    //     line.split(/(\d+\.)/).filter(item => item.trim() && !item.match(/^\d+\.$/))
    // );

    return splitByLines
}


// ------------------------------------------- FUNCTION สถานะการยืนยันคำขอ
export const statusDevMap = {
    0: "ไม่อนุมัติคำขอ, ยกเลิกพัฒนา",
    1: "รอการยืนยันจากหัวหน้าแผนก",
    2: "รอการยืนยันจากหัวหน้าทีมพัฒนา",
    3: "เข้าคิวรอพัฒนา",
    4: "ทีมพัฒนากำลังดำเนินการพัฒนา",
    5: "ดำเนินการพัฒนาเสร็จแล้ว"
};

// ------------------------------------------- FUNCTION สถานะกล้องวงจรปิด
export const statusCCTVMap = {
    0: "คำขอไม่ผ่านการอนุมัติ",
    1: "กำลังตรวจสอบโดยนิติกร",
    2: "รอการยืนยันจากพ่อบ้าน",
    3: "รอการยืนยันจากรองบริหาร",
    4: "อยู่ระหว่างตรวจสอบกล้อง",
    5: "การตรวจสอบข้อมูลกล้องเสร็จสมบูรณ์",
};

// ------------------------------------------- FUNCTION statusDonateMap
export const statusDonateMap = {
    0: { label: "ไม่ผ่านการตรวจสอบ - ข้อมูลไม่ถูกต้อง", color: "danger" },
    1: { label: "อยู่ระหว่างการตรวจสอบยอดเงิน", color: "warning" },
    2: { label: "ยืนยันการบริจาคเรียบร้อย", color: "success" },
};

//================================================================ FUNCTION สถานะการแจ้งเหตุ
export const statusIncident = {
    0: { label: "ยกเลิก", color: "danger" },
    1: { label: "รอรับเรื่อง", color: "warning" },
    2: { label: "มอบหมายงานแล้ว", color: "primary" },
    3: { label: "กำลังดำเนินการ", color: "default" },
    4: { label: "รอผู้แจ้งยืนยัน", color: "secondary" },
    5: { label: "เสร็จสิ้น", color: "success" }
};