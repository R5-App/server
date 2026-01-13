require('dotenv').config();

module.exports = {
  secret: process.env.JWT_SECRET || 'fallback-secret-key-for-development',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d'
};
