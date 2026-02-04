const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');

/**
 * Generate a temporary share code for a pet
 * @param {number} petId - Pet ID
 * @param {string} expiresIn - Expiration time (default: 24h)
 * @returns {string} Share code (JWT token)
 */
const generateShareCode = (petId, expiresIn = '24h') => {
  const payload = {
    petId: petId,
    type: 'pet_share',
    createdAt: new Date().toISOString()
  };

  return jwt.sign(payload, jwtConfig.secret, { expiresIn });
};

/**
 * Verify and decode a share code
 * @param {string} shareCode - Share code to verify
 * @returns {object|null} Decoded payload or null if invalid
 */
const verifyShareCode = (shareCode) => {
  try {
    const decoded = jwt.verify(shareCode, jwtConfig.secret);
    
    // Verify it's a pet share token
    if (decoded.type !== 'pet_share') {
      return null;
    }

    return decoded;
  } catch (error) {
    // Token expired or invalid
    return null;
  }
};

module.exports = {
  generateShareCode,
  verifyShareCode
};
