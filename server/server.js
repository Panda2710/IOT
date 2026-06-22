const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./config/db');

const app = express();

app.use(cors()); 
app.use(express.json()); 

// --- ROUTE KIỂM TRA HỆ THỐNG ---
// Khi bạn truy cập http://localhost:5000/, nó sẽ ping thẳng vào Supabase
app.get('/', async (req, res) => {
    try {
        const result = await db.query('SELECT NOW() AS current_time');
        res.status(200).json({
            status: 'success',
            message: 'Server is running & Database connected!',
            db_time: result.rows[0].current_time
        });
    } catch (error) {
        console.error('Database connection failed:', error);
        res.status(500).json({
            status: 'error',
            message: 'Database connection failed',
            details: error.message
        });
    }
});

// TODO: Sau này ta sẽ import các routes (auth, devices, metrics) vào đây
// Ví dụ: app.use('/api/auth', require('./routes/authRoutes'));

// --- KHỞI ĐỘNG SERVER ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});