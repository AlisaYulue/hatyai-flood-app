// ใช้ config เดียวกับระบบส่ง OTP (ไฟล์ที่จัดการ /api/otp)
// เพื่อให้ auth ผ่านด้วย EMAIL_USER / EMAIL_PASS ที่ตั้งไว้ใน .env อยู่แล้ว

import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const FROM = `"ระบบแจ้งเตือนน้ำท่วมหาดใหญ่" <${process.env.EMAIL_USER}>`;

// เทมเพลตฐาน โทนเดียวกับอีเมล OTP (การ์ดพื้นเข้ม + โลโก้ HATYAI FLOOD WATCH)
function baseTemplate({ heading, bodyHtml, footerText }) {
    // Font Stack ที่ออกแบบมาเพื่อรองรับทั้งฟอนต์นอกและฟอนต์ระบบที่สวยที่สุดของแต่ละ OS
    const fontStack = "'Kanit', 'Sukhumvit Set', 'Thonburi', 'Leelawadee UI', 'Segoe UI', Tahoma, sans-serif";

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600&display=swap" rel="stylesheet">
    </head>
    <body style="margin: 0; padding: 0; background-color: #08222C;">
        <div style="font-family: ${fontStack}; background-color: #08222C; margin: 0; padding: 40px 0; width: 100%;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #12506B; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.5);">
                <div style="background-color: #08222C; padding: 25px; text-align: center; border-bottom: 2px solid #FF6B4A;">
                    <h1 style="color: #F3F8F7; margin: 0; font-size: 26px; font-weight: 600; letter-spacing: 1px;">HATYAI <span style="color: #FF6B4A;">FLOOD WATCH</span></h1>
                </div>
                <div style="padding: 40px 30px; text-align: center;">
                    <h2 style="color: #F3F8F7; font-size: 22px; font-weight: 500; margin-top: 0;">${heading}</h2>
                    <div style="color: #B0C4DE; font-size: 15px; font-weight: 300; line-height: 1.6; margin-bottom: 24px; text-align: left;">
                        ${bodyHtml}
                    </div>
                    <p style="color: #8fa3b0; font-size: 13px; font-weight: 300; margin-top: 30px;">
                        ${footerText}
                    </p>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
}

// ส่งทันทีหลังผู้ใช้กดส่งข้อความ — แจ้งว่าได้รับเรื่องแล้ว กำลังตรวจสอบ
export async function sendContactAckEmail({ to, subject, name }) {
    const bodyHtml = `
        <p>เรียน ${name ? name : 'ผู้แจ้ง'},</p>
        <p>เราได้รับข้อความของคุณเรื่อง <b style="color:#F3F8F7;">"${subject}"</b> เรียบร้อยแล้ว</p>
        <p>ทีมงานกำลังตรวจสอบเรื่องนี้ และจะติดต่อกลับโดยเร็วที่สุด</p>
    `;
    try {
        await transporter.sendMail({
            from: FROM,
            to,
            subject: `ได้รับเรื่องแล้ว: ${subject}`,
            text: `เราได้รับข้อความของคุณเรื่อง "${subject}" แล้ว ทีมงานจะติดต่อกลับโดยเร็วที่สุด`,
            html: baseTemplate({
                heading: 'ได้รับเรื่องของคุณแล้ว',
                bodyHtml,
                footerText: 'อีเมลนี้ส่งโดยระบบอัตโนมัติ กรุณาอย่าตอบกลับอีเมลฉบับนี้',
            }),
        });
    } catch (mailError) {
        console.error('[contact] ack mail failed:', {
            message: mailError.message,
            code: mailError.code,
        });
        throw mailError;
    }
}

// ส่งเมื่อแอดมินกดตอบกลับในหน้า admin
export async function sendContactReplyEmail({ to, subject, reply, name }) {
    const bodyHtml = `
        <p>เรียน ${name ? name : 'ผู้แจ้ง'},</p>
        <p>เจ้าหน้าที่ได้ตอบกลับข้อความเรื่อง <b style="color:#F3F8F7;">"${subject}"</b> ของคุณแล้ว:</p>
        <div style="border-left:3px solid #FF6B4A; margin:16px 0; padding:12px 16px; background:#08222C; border-radius:4px; color:#F3F8F7;">
            ${String(reply).replace(/\n/g, '<br/>')}
        </div>
        <p>หากมีคำถามเพิ่มเติม ติดต่อกลับได้ตามช่องทางเดิม</p>
    `;
    try {
        await transporter.sendMail({
            from: FROM,
            to,
            subject: `แจ้งกลับเรื่อง: ${subject}`,
            text: `เจ้าหน้าที่ตอบกลับ: ${reply}`,
            html: baseTemplate({
                heading: 'เจ้าหน้าที่ตอบกลับข้อความของคุณ',
                bodyHtml,
                footerText: 'อีเมลนี้ส่งโดยระบบอัตโนมัติ กรุณาอย่าตอบกลับอีเมลฉบับนี้',
            }),
        });
    } catch (mailError) {
        console.error('[admin/contact] reply mail failed:', {
            message: mailError.message,
            code: mailError.code,
        });
        throw mailError;
    }
}