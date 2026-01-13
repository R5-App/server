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

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      username: user.username
    });

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          name: user.name,
          createdAt: user.created_at,
          lastActivity: user.last_activity
        },
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
 * Delete user account
 * @route DELETE /api/auth/account/:userId
 */
const deleteAccount = async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user.userId;

    // Check if user is deleting their own account or is admin
    // For now, only allow users to delete their own account
    if (userId !== requestingUserId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own account'
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete the user
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

module.exports = {
  register,
  login,
  deleteAccount
};
