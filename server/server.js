const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./config/db');
const connectMQTT = require('./config/mqtt');
const app = express();

connectMQTT();
app.use(cors()); 
app.use(express.json()); 

//Connection testing
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

// --- IMPORT ROUTES ---
const authRoutes = require('./routes/authRoutes');
const deviceRoutes = require('./routes/deviceRoutes');
const metricRoutes = require('./routes/metricRoutes');

// --- MOUNT ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/metrics', metricRoutes);

//Booting
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});