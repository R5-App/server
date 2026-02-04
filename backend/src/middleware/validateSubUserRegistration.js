const validator = require('validator');

/**
 * Middleware to validate sub-user linking input
 */
const validateSubUserRegistration = (req, res, next) => {
  const { subUserId, role } = req.body;
  const { parentUserId } = req.params;
  const errors = [];

  // Validate parent user ID (must be UUID)
  if (!parentUserId) {
    errors.push('Parent user ID is required');
  } else if (!validator.isUUID(parentUserId)) {
    errors.push('Invalid parent user ID format');
  }

  // Validate sub-user ID (must be UUID)
  if (!subUserId) {
    errors.push('Sub-user ID is required');
  } else if (!validator.isUUID(subUserId)) {
    errors.push('Invalid sub-user ID format');
  }

  // Validate role (optional, defaults to 'hoitaja')
  if (role && !['omistaja', 'hoitaja', 'lääkäri'].includes(role)) {
    errors.push('Role must be one of: "omistaja", "hoitaja", or "lääkäri"');
  }

  // If there are validation errors, return them
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  // Set default role if not provided
  req.body.role = role || 'hoitaja';

  next();
};

module.exports = validateSubUserRegistration;
