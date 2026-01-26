const User = require('../models/User');
const { hashPassword, comparePassword } = require('../utils/hashPassword');
const { generateToken } = require('../utils/generateToken');

/**
 * Register a new user
 * @route POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { email, username, password, name } = req.body;

    // Check if user with email already exists
    const existingUserByEmail = await User.findByEmail(email);
    if (existingUserByEmail) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Check if user with username already exists
    const existingUserByUsername = await User.findByUsername(username);
    if (existingUserByUsername) {
      return res.status(409).json({
        success: false,
        message: 'Username already taken'
      });
    }

    // Hash the password
    const passwordHash = await hashPassword(password);

    // Create new user
    const newUser = await User.create({
      email,
      username,
      name: name || null,
      passwordHash
    });

    // Generate JWT token
    const token = generateToken({
      userId: newUser.id,
      email: newUser.email,
      username: newUser.username
    });

    // Return success response with user data and token
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          username: newUser.username,
          name: newUser.name,
          createdAt: newUser.created_at
        },
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);

    // Handle database constraint errors
    if (error.code === '23505') {
      if (error.constraint === 'users_email_key') {
        return res.status(409).json({
          success: false,
          message: 'Email already registered'
        });
      }
      if (error.constraint === 'users_username_key') {
        return res.status(409).json({
          success: false,
          message: 'Username already taken'
        });
      }
    }

    // Generic error response
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again later.'
    });
  }
};

/**
 * Update user's password
 * @route PUT /api/auth/password
 */
const updatePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const requestingUserId = req.user.userId;

    // Validate inputs
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Old password and new password are required'
      });
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long'
      });
    }

    // Get user with password hash
    const user = await User.findByIdWithPassword(requestingUserId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify old password
    const isOldPasswordValid = await comparePassword(oldPassword, user.password_hash);
    if (!isOldPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Check if new password is same as old password
    if (oldPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password'
      });
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    const updatedUser = await User.updatePassword(requestingUserId, newPasswordHash);

    if (!updatedUser) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update password'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
      data: {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          username: updatedUser.username,
          name: updatedUser.name,
          createdAt: updatedUser.created_at
        }
      }
    });
  } catch (error) {
    console.error('Password update error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to update password. Please try again later.'
    });
  }
};

/**
 * Update user's email
 * @route PUT /api/auth/email
 */
const updateEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const requestingUserId = req.user.userId;

    // Validate email
    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Check if email is already in use by another user
    const existingUser = await User.findByEmail(email);
    if (existingUser && existingUser.id !== requestingUserId) {
      return res.status(409).json({
        success: false,
        message: 'Email already in use'
      });
    }

    // Update the user's email
    const updatedUser = await User.updateEmail(requestingUserId, email);

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate new token with updated email
    const token = generateToken({
      userId: updatedUser.id,
      email: updatedUser.email,
      username: updatedUser.username
    });

    res.status(200).json({
      success: true,
      message: 'Email updated successfully',
      data: {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          username: updatedUser.username,
          name: updatedUser.name,
          createdAt: updatedUser.created_at
        },
        token
      }
    });
  } catch (error) {
    console.error('Email update error:', error);

    // Handle database constraint errors
    if (error.code === '23505' && error.constraint === 'users_email_key') {
      return res.status(409).json({
        success: false,
        message: 'Email already in use'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update email. Please try again later.'
    });
  }
};

/**
 * Login user
 * @route POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if username is email or username
    let user;
    if (username.includes('@')) {
      user = await User.findByEmail(username);
    } else {
      user = await User.findByUsername(username);
    }

    // User not found
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last activity
    await User.updateLastActivity(user.id);

    // Check if user is a sub-user and get parent info
    const parentInfo = await User.getParentUser(user.id);

    // Generate JWT token with sub-user info if applicable
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      username: user.username
    };

    if (parentInfo) {
      tokenPayload.parentUserId = parentInfo.id;
      tokenPayload.role = parentInfo.role;
    }

    const token = generateToken(tokenPayload);

    // Return success response
    const userData = {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      createdAt: user.created_at,
      lastActivity: user.last_activity
    };

    if (parentInfo) {
      userData.parentUserId = parentInfo.id;
      userData.role = parentInfo.role;
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: userData,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);

    // Generic error response
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again later.'
    });
  }
};

/**
 * Logout user
 * @route POST /api/auth/logout
 */
const logout = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Update last activity on logout
    await User.updateLastActivity(userId);

    // Return success response
    // Note: Client should remove the JWT token from storage
    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);

    res.status(500).json({
      success: false,
      message: 'Logout failed. Please try again later.'
    });
  }
};

/**
 * Delete user account
 * @route DELETE /api/auth/account/:userId
 */
const deleteAccount = async (req, res) => {
  try {
    const { userId } = req.params;
    const { password } = req.body;
    const requestingUserId = req.user.userId;

    // Check if user is deleting their own account
    // userId from params is string, requestingUserId is from JWT
    if (userId !== String(requestingUserId)) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own account'
      });
    }

    // Validate password is provided
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to delete your account'
      });
    }

    // Check if user exists and get password hash
    const user = await User.findByIdWithPassword(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password'
      });
    }

    // Check if user is a parent account with sub-users
    const subUsers = await User.getSubUsers(userId);
    if (subUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete account with active sub-users. Please delete all sub-users first.',
        data: {
          subUsersCount: subUsers.length
        }
      });
    }

    // Delete the user (cascade will handle sub_users table cleanup)
    const deleted = await User.deleteById(userId);

    if (deleted) {
      return res.status(200).json({
        success: true,
        message: 'Account deleted successfully'
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete account'
      });
    }
  } catch (error) {
    console.error('Delete account error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to delete account. Please try again later.'
    });
  }
};

/**
 * Register a sub-user for an existing account
 * @route POST /api/auth/sub-user/:parentUserId
 */
const registerSubUser = async (req, res) => {
  try {
    const { email, username, password, name, role } = req.body;
    const { parentUserId } = req.params;

    // Verify parent user exists
    const parentUser = await User.findById(parentUserId);
    if (!parentUser) {
      return res.status(404).json({
        success: false,
        message: 'Parent account not found'
      });
    }

    // Check if authenticated user has permission to create sub-users for this parent account
    // (Only the parent user or existing admin sub-users can create new sub-users)
    if (req.user && req.user.userId !== parentUserId) {
      const parentInfo = await User.getParentUser(req.user.userId);
      if (!parentInfo || parentInfo.id !== parentUserId || parentInfo.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to create sub-users for this account'
        });
      }
    }

    // Check if user with email already exists
    const existingUserByEmail = await User.findByEmail(email);
    if (existingUserByEmail) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Check if user with username already exists
    const existingUserByUsername = await User.findByUsername(username);
    if (existingUserByUsername) {
      return res.status(409).json({
        success: false,
        message: 'Username already taken'
      });
    }

    // Hash the password
    const passwordHash = await hashPassword(password);

    // Create new sub-user with link to parent account
    const newSubUser = await User.createSubUser({
      email,
      username,
      name: name || null,
      passwordHash
    }, parentUserId, role);

    // Generate JWT token for the sub-user
    const token = generateToken({
      userId: newSubUser.id,
      email: newSubUser.email,
      username: newSubUser.username,
      parentUserId: newSubUser.parentUserId,
      role: newSubUser.role
    });

    // Return success response with sub-user data and token
    res.status(201).json({
      success: true,
      message: 'Sub-user registered successfully',
      data: {
        user: {
          id: newSubUser.id,
          email: newSubUser.email,
          username: newSubUser.username,
          name: newSubUser.name,
          createdAt: newSubUser.created_at,
          parentUserId: newSubUser.parentUserId,
          role: newSubUser.role
        },
        token
      }
    });
  } catch (error) {
    console.error('Sub-user registration error:', error);

    // Handle database constraint errors
    if (error.code === '23505') {
      if (error.constraint === 'users_email_key') {
        return res.status(409).json({
          success: false,
          message: 'Email already registered'
        });
      }
      if (error.constraint === 'users_username_key') {
        return res.status(409).json({
          success: false,
          message: 'Username already taken'
        });
      }
      if (error.constraint === 'sub_users_sub_user_id_key') {
        return res.status(409).json({
          success: false,
          message: 'User is already a sub-user of another account'
        });
      }
    }

    // Foreign key constraint error
    if (error.code === '23503') {
      return res.status(404).json({
        success: false,
        message: 'Parent account not found'
      });
    }

    // Generic error response
    res.status(500).json({
      success: false,
      message: 'Sub-user registration failed. Please try again later.'
    });
  }
};

/**
 * Get all sub-users for the authenticated user's account
 * @route GET /api/auth/sub-users
 */
const getSubUsers = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get all sub-users for this parent account
    const subUsers = await User.getSubUsers(userId);

    res.status(200).json({
      success: true,
      data: {
        subUsers,
        count: subUsers.length
      }
    });
  } catch (error) {
    console.error('Get sub-users error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve sub-users'
    });
  }
};

/**
 * Remove a sub-user
 * @route DELETE /api/auth/sub-user/:subUserId
 * @access Private - Sub-user themselves, parent account owner, or admin
 */
const removeSubUser = async (req, res) => {
  try {
    const { subUserId } = req.params;
    const requestingUserId = req.user.userId;

    // Check if the sub-user exists
    const subUser = await User.findById(subUserId);
    if (!subUser) {
      return res.status(404).json({
        success: false,
        message: 'Sub-user not found'
      });
    }

    // Verify that the user is actually a sub-user
    const isSubUser = await User.isSubUser(subUserId);
    if (!isSubUser) {
      return res.status(400).json({
        success: false,
        message: 'User is not a sub-user'
      });
    }

    // Check authorization: sub-user themselves, parent account, or admin
    let isAuthorized = false;

    // Case 1: Sub-user is removing themselves
    if (subUserId === requestingUserId) {
      isAuthorized = true;
    }

    // Case 2: Parent account is removing their sub-user
    if (!isAuthorized) {
      const parentInfo = await User.getParentUser(subUserId);
      if (parentInfo && parentInfo.id === requestingUserId) {
        isAuthorized = true;
      }
    }

    // Case 3: Admin user is removing the sub-user
    if (!isAuthorized) {
      const isAdmin = await User.isAdmin(requestingUserId);
      if (isAdmin) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to remove this sub-user'
      });
    }

    // Remove the sub-user linking (keeps the user account intact)
    const removed = await User.removeSubUser(subUserId);

    if (removed) {
      return res.status(200).json({
        success: true,
        message: 'Sub-user linking removed successfully. The user account remains active.'
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to remove sub-user linking'
      });
    }
  } catch (error) {
    console.error('Remove sub-user error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to remove sub-user. Please try again later.'
    });
  }
};

/**
 * Update the role of a sub-user
 * @route PUT /api/auth/sub-user/:subUserId/role
 */
const updateSubUserRole = async (req, res) => {
  try {
    const { subUserId } = req.params;
    const { role } = req.body;
    const requestingUserId = req.user.userId;

    // Verify sub-user exists
    const subUser = await User.findById(subUserId);
    if (!subUser) {
      return res.status(404).json({
        success: false,
        message: 'Sub-user not found'
      });
    }

    // Verify the user is actually a sub-user
    const isSubUser = await User.isSubUser(subUserId);
    if (!isSubUser) {
      return res.status(400).json({
        success: false,
        message: 'User is not a sub-user'
      });
    }

    // Check if requesting user is the parent of this sub-user
    const parentInfo = await User.getParentUser(subUserId);
    if (!parentInfo || parentInfo.id !== requestingUserId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this sub-user\'s role'
      });
    }

    // Update the sub-user role
    const updatedSubUser = await User.updateSubUserRole(subUserId, role);

    if (!updatedSubUser) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update sub-user role'
      });
    }

    // Get full user details
    const updatedUserDetails = await User.findById(subUserId);

    res.status(200).json({
      success: true,
      message: 'Sub-user role updated successfully',
      data: {
        user: {
          id: updatedUserDetails.id,
          email: updatedUserDetails.email,
          username: updatedUserDetails.username,
          name: updatedUserDetails.name,
          role: updatedSubUser.role,
          parentUserId: updatedSubUser.parent_user_id
        }
      }
    });
  } catch (error) {
    console.error('Update sub-user role error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to update sub-user role. Please try again later.'
    });
  }
};

module.exports = {
  register,
  login,
  logout,
  deleteAccount,
  updateEmail,
  updatePassword,
  registerSubUser,
  getSubUsers,
  removeSubUser,
  updateSubUserRole
};
