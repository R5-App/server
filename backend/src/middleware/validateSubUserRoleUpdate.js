const validator = require('validator');

/**
 * Middleware to validate sub-user role update input
 */
const validateSubUserRoleUpdate = (req, res, next) => {
  const { role } = req.body;
  const { subUserId } = req.params;
  const errors = [];

  // Validate sub-user ID (must be UUID)
  if (!subUserId) {
    errors.push('Sub-user ID is required');
  } else if (!validator.isUUID(subUserId)) {
    errors.push('Invalid sub-user ID format');
  }

  // Validate role (required)
  if (!role) {
    errors.push('Role is required');
  } else if (!['omistaja', 'hoitaja', 'lääkäri'].includes(role)) {
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

  // Sanitize inputs
  req.body.role = role.trim();

  next();
};

module.exports = validateSubUserRoleUpdate;
