const validator = require('validator');

/**
 * Middleware to validate login input
 */
const validateLogin = (req, res, next) => {
  const { username, password } = req.body;
  const errors = [];

  // Validate username (can be either username or email)
  if (!username) {
    errors.push('Username or email is required');
  } else if (typeof username !== 'string' || username.trim().length === 0) {
    errors.push('Username or email must be a valid string');
  }

  // Validate password
  if (!password) {
    errors.push('Password is required');
  } else if (typeof password !== 'string' || password.length === 0) {
    errors.push('Password must be a valid string');
  }

  // If there are validation errors, return them
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  // Sanitize username input
  req.body.username = username.trim();

  next();
};

module.exports = validateLogin;
