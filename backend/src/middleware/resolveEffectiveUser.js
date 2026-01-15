/**
 * Middleware to resolve the effective user ID for data access
 * Sub-users should access their parent account's data
 * Regular users access their own data
 */
const resolveEffectiveUser = async (req, res, next) => {
  try {
    // If user has a parentUserId in their token, they're a sub-user
    // Use the parent's ID for data access
    if (req.user && req.user.parentUserId) {
      req.effectiveUserId = req.user.parentUserId;
      req.isSubUser = true;
      req.subUserRole = req.user.role;
    } else {
      // Regular user accesses their own data
      req.effectiveUserId = req.user.userId;
      req.isSubUser = false;
    }

    next();
  } catch (error) {
    console.error('Resolve effective user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resolve user access'
    });
  }
};

module.exports = resolveEffectiveUser;
