const express = require('express');
const router = express.Router();

//Register new account
router.post('/register', (req, res) => {
    // Testing
    res.status(201).json({
        message: 'Đã nhận request Đăng ký',
        data_received: req.body 
    });
});

//Login
router.post('/login', (req, res) => {
    //Testing
    res.status(200).json({
        message: 'Đã nhận request Đăng nhập',
        token: 'mock_jwt_token_12345'
    });
});

module.exports = router;