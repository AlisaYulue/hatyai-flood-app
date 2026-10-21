// // lib/db.js
// import mysql from 'mysql2/promise';

// // ใช้ pool ตัวเดียวตลอดอายุโปรเซส
// // ตอน next dev ทุกครั้งที่เซฟไฟล์ โมดูลจะถูกโหลดใหม่ ถ้าสร้าง pool ใหม่ทุกครั้ง
// // connection เก่าจะค้างสะสมจนเต็ม max_connections (Too many connections)
// // จึงเก็บ pool ไว้ที่ globalThis เพื่อให้โหลดซ้ำแล้วยังใช้ตัวเดิม
// const globalForDb = globalThis;

// const pool =
//     globalForDb.__mysqlPool ||
//     mysql.createPool({
//         host: 'localhost',
//         user: 'root', // เปลี่ยนตาม XAMPP/MySQL Workbench
//         password: '', // ใส่รหัสผ่าน MYSQL
//         database: 'hatyai_flood_db',
//         waitForConnections: true,
//         connectionLimit: 10,
//         queueLimit: 0,
//     });

// if (process.env.NODE_ENV !== 'production') globalForDb.__mysqlPool = pool;

// // helper function ที่ API routes เรียกใช้ผ่าน named import { query }
// // คืนค่าเป็น [rows, fields] เหมือน pool.query ปกติของ mysql2
// export async function query(sql, params) {
//     return pool.query(sql, params);
// }

// export default pool;