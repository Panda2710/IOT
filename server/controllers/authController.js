const bcrypt = require('bcrypt');
const JWT = require('jsonwebtoken');
const db = require('../config/db');

//Register
const register = async (req, res) => {
    const { username, password, email } = req.body || {};

    if (!username || !password || !email) {
        return res.status(400).json({ error: 'Missing fields' });
    }
    
    try {
        const hashed = await bcrypt.hash(password, 10);
        
        const result = await db.query(
            'INSERT INTO users(username, password_hash, email) VALUES($1, $2, $3) RETURNING user_id, username, email, created_at',
            [username, hashed, email]
        );
        
        res.status(201).json({ user: result.rows[0] });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Username or email already exists' });
        }
        res.status(500).json({ error: 'Server error' });
    }
};

//Login
const login = async (req, res) => {
    const { username, password } = req.body || {};

    if (!username || !password) {
        return res.status(400).json({ message: 'Missing fields' });
    }

    try {
        const result = await db.query(
            'SELECT user_id, username, password_hash, email FROM users WHERE username = $1',
            [username]
        );
        
        const user = result.rows[0];
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });
        
        const ok = await bcrypt.compare(password, user.password_hash);
        if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
        
        const token = JWT.sign(
            { user_id: user.user_id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        res.json({ 
            ok: true, 
            token,
            user: {
                user_id: user.user_id,
                username: user.username,
                email: user.email,
            },
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = { register, login };