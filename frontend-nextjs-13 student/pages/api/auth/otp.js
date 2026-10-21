import db from '../../../lib/db';
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

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'กรุณาระบุอีเมล' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60000);

        try {
            await db.query(
                'INSERT INTO users (email, otp_code, otp_expires) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE otp_code = ?, otp_expires = ?',
                [email, otp, expiresAt, otp, expiresAt]
            );
        } catch (dbError) {
            console.error('[OTP] บันทึกฐานข้อมูลล้มเหลว:', dbError);
            return res.status(500).json({ error: 'ไม่สามารถบันทึกรหัส OTP ได้' });
        }

        try {
            // ส่วนนี้คือการทำ HTML Email ให้สวยงามระดับมืออาชีพ พร้อม Font Stack ที่รองรับทุก OS
            const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600&display=swap" rel="stylesheet">
            </head>
            <body style="margin: 0; padding: 0; background-color: #08222C;">
                <div style="font-family: 'Kanit', 'Sukhumvit Set', 'Thonburi', 'Leelawadee UI', 'Segoe UI', Tahoma, sans-serif; background-color: #08222C; margin: 0; padding: 40px 0; width: 100%;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: #12506B; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.5);">
                        <div style="background-color: #08222C; padding: 25px; text-align: center; border-bottom: 2px solid #FF6B4A;">
                            <h1 style="color: #F3F8F7; margin: 0; font-size: 26px; font-weight: 600; letter-spacing: 1px;">HATYAI <span style="color: #FF6B4A;">FLOOD WATCH</span></h1>
                        </div>
                        <div style="padding: 40px 30px; text-align: center;">
                            <h2 style="color: #F3F8F7; font-size: 22px; font-weight: 500; margin-top: 0;">รหัสยืนยันตัวตน (OTP)</h2>
                            <p style="color: #B0C4DE; font-size: 15px; font-weight: 300; line-height: 1.6; margin-bottom: 30px;">
                                คุณได้ทำการร้องขอเพื่อเข้าสู่ระบบหรือเปลี่ยนรหัสผ่าน<br>
                                กรุณาใช้รหัส 6 หลักด้านล่างนี้เพื่อดำเนินการต่อ
                            </p>
                            
                            <!-- กล่องแสดง OTP (เน้นตัวใหญ่ ถ่างระยะ คัดลอกง่าย) -->
                            <div style="background-color: #08222C; border: 1px solid #1C6E8C; border-radius: 8px; padding: 20px; margin: 0 auto; max-width: 300px;">
                                <span style="font-size: 36px; font-weight: 600; letter-spacing: 12px; color: #2FBF83; display: block; margin-left: 12px;">${otp}</span>
                            </div>
                            
                            <p style="color: #8fa3b0; font-size: 13px; font-weight: 300; margin-top: 30px;">
                                รหัสนี้มีอายุการใช้งาน 5 นาที<br>
                                หากคุณไม่ได้ทำรายการนี้ กรุณาเพิกเฉยต่ออีเมลฉบับนี้ ระบบของคุณยังปลอดภัยดี
                            </p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
            `;

            await transporter.sendMail({
                from: `"ระบบแผนที่น้ำท่วมหาดใหญ่" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: 'รหัส OTP สำหรับระบบแผนที่น้ำท่วมหาดใหญ่',
                text: `รหัส OTP สำหรับยืนยันตัวตนของคุณคือ: ${otp} (มีอายุ 5 นาที)`, // Fallback สำหรับเครื่องที่ไม่อ่าน HTML
                html: emailHtml, // ใส่ HTML ตรงนี้!
            });

            return res.status(200).json({ message: 'ส่ง OTP สำเร็จ' });
        } catch (mailError) {
            console.error('[OTP] ส่งอีเมลล้มเหลว:', {
                message: mailError.message,
                code: mailError.code,
            });
            return res.status(500).json({
                error: 'บันทึกรหัสสำเร็จ แต่ส่งอีเมลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง',
            });
        }
    } else if (req.method === 'PUT') {
        const { email, otp } = req.body;

        try {
            const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
            if (rows.length === 0) return res.status(404).json({ error: 'ไม่พบอีเมลนี้' });

            const user = rows[0];
            if (user.otp_code !== otp) return res.status(400).json({ error: 'รหัส OTP ไม่ถูกต้อง' });
            if (new Date() > new Date(user.otp_expires)) return res.status(400).json({ error: 'รหัส OTP หมดอายุแล้ว' });

            await db.query('UPDATE users SET is_verified = 1 WHERE email = ?', [email]);
            return res.status(200).json({ message: 'ยืนยันตัวตนสำเร็จ' });
        } catch (error) {
            console.error('[OTP] ตรวจสอบล้มเหลว:', error);
            return res.status(500).json({ error: 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์' });
        }
    } else {
        res.setHeader('Allow', ['POST', 'PUT']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}