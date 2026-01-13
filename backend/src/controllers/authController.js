const User = require('../models/User');
const { hashPassword } = require('../utils/hashPassword');
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

module.exports = {
  register
};
