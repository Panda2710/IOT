const JWT = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    // Standard format should be: "Bearer <token>"
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
            error: 'Access denied!' 
        });
    }

    // Split the 'Bearer' header to get the <token>
    const token = authHeader.split(' ')[1];

    try {
        const decoded = JWT.verify(token, process.env.JWT_SECRET);
        req.user = decoded; 
        next(); 
    } catch (err) {
        return res.status(403).json({ 
            error: 'Access denied!' 
        });
    }
};

module.exports = verifyToken;