const jwt = require('jsonwebtoken');
require('dotenv').config();

const secretKey = process.env.JWT_SECRET_KEY;

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      nomUtilisateur: user.nomUtilisateur,
      role: user.role // Assurez-vous que le rôle est inclus ici
    },
    secretKey,
    { expiresIn: '2m' }
  );
};

const verifyToken = (token) => {
  return jwt.verify(token, secretKey);
};

module.exports = { generateToken, verifyToken };
