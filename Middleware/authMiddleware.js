const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const { userSignupModel, karmikaSignupModel } = require('../Models/Models');

const secret = process.env.JWT_SECRET;
if (!secret) {
  console.error('JWT_SECRET is not set in environment');
  process.exit(1);
}

const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ status: 'fail', message: 'No token provided' });
    }

    let decoded;
    try {
      decoded = await promisify(jwt.verify)(token, secret);
    } catch (e) {
      return res.status(401).json({ status: 'fail', message: 'Invalid or expired token' });
    }

    const existingUser = await userSignupModel.findById(decoded.id);
    const existingKarmika = await karmikaSignupModel.findById(decoded.id);
    const currentUser = existingUser ? existingUser : existingKarmika;

    if (!currentUser) {
      return res.status(404).json({ status: 'fail', message: 'User no longer exists' });
    }

    req.user = currentUser;
    next();
  } catch (err) {
    console.error('Auth middleware error', err);
    res.status(500).json({ status: 'error', message: 'Auth error' });
  }
};

module.exports = { protect };