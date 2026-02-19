const jwt = require('jsonwebtoken');
const User = require('../models/User');

const getJwtSecret = () => {
    return process.env.JWT_SECRET || 'dev_secret_change_me';
};

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Explicitly handle "null" or "undefined" strings from frontend
            if (!token || token === 'null' || token === 'undefined') {
                return res.status(401).json({ error: 'Not authorized, no valid token provided' });
            }


            // Verify token
            try {
                const decoded = jwt.verify(token, getJwtSecret());
                // Get user from the token
                req.user = await User.findById(decoded.sub).select('-passwordHash');

                if (!req.user) {
                    return res.status(401).json({ error: 'Not authorized, user not found' });
                }

                next();
            } catch (jwtError) {
                console.error(`JWT Verification Error: ${jwtError.message}`);
                console.error(`Received Token: "${token}"`);

                if (jwtError.message === 'jwt malformed') {
                    return res.status(401).json({ error: 'Not authorized, token is malformed' });
                }
                throw jwtError; // Re-throw for outer catch block
            }

        } catch (error) {
            console.error(error);
            return res.status(401).json({ error: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ error: 'Not authorized, no token' });
    }
};

module.exports = { protect };
