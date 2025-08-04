const jwt = require('jsonwebtoken');

// Assurez-vous que le secret JWT est cohérent
const JWT_SECRET = process.env.JWT_SECRET || 'gaming-center-secret-key-2024';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '8h';

const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
};

const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

module.exports = {
  JWT_SECRET,
  JWT_EXPIRY,
  generateToken,
  verifyToken
};