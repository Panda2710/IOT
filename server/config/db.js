const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Bắt lỗi nếu pool gặp vấn đề (ví dụ: rớt mạng)
pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

// Xuất ra một hàm query để các file Controller tái sử dụng
module.exports = {
    query: (text, params) => pool.query(text, params),
};