const validator = require('validator');

/**
 * Middleware to validate sub-user registration input
 */
const validateSubUserRegistration = (req, res, next) => {
  const { email, username, password, name, role } = req.body;
  const { parentUserId } = req.params;
  const errors = [];

  // Validate parent user ID (must be UUID)
  if (!parentUserId) {
    errors.push('Parent user ID is required');
  } else if (!validator.isUUID(parentUserId)) {
    errors.push('Invalid parent user ID format');
  }

  // Validate email
  if (!email) {
    errors.push('Email is required');
  } else if (!validator.isEmail(email)) {
    errors.push('Invalid email format');
  }

  // Validate username
  if (!username) {
    errors.push('Username is required');
  } else if (username.length < 3) {
    errors.push('Username must be at least 3 characters long');
  } else if (username.length > 30) {
    errors.push('Username must not exceed 30 characters');
  } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    errors.push('Username can only contain letters, numbers, and underscores');
  }

  // Validate password
  if (!password) {
    errors.push('Password is required');
  } else if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  } else if (password.length > 128) {
    errors.push('Password must not exceed 128 characters');
  } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one uppercase letter, one lowercase letter, and one number');
  }

  // Validate name (optional)
  if (name && name.length > 100) {
    errors.push('Name must not exceed 100 characters');
  }

  // Validate role (optional, defaults to 'hoitaja')
  if (role && !['Omistaja', 'Hoitaja'].includes(role)) {
    errors.push('Role must be either "Omistaja" or "Hoitaja"');
  }

  // If there are validation errors, return them
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  // Sanitize inputs
  req.body.email = validator.normalizeEmail(email);
  req.body.username = username.trim();
  if (name) {
    req.body.name = name.trim();
  }
  req.body.role = role || 'hoitaja';

  next();
};

module.exports = validateSubUserRegistration;
