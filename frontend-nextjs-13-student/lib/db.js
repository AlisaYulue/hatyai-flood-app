// lib/db.js
import mysql from 'mysql2/promise';

const globalForDb = globalThis;

const pool =
    globalForDb.__mysqlPool ||
    mysql.createPool(process.env.DATABASE_URL); // ดึง URL จากไฟล์ .env.local

if (process.env.NODE_ENV !== 'production') globalForDb.__mysqlPool = pool;

export async function query(sql, params) {
    return pool.query(sql, params);
}

export default pool;