const pool = require('../config/database');

class User {
  /**
   * Create a new user
   * @param {object} userData - User data
   * @returns {Promise<object>} Created user
   */
  static async create({ email, username, name, passwordHash }) {
    const query = `
      INSERT INTO users (email, username, name, password_hash)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, username, name, created_at
    `;
    
    try {
      const result = await pool.query(query, [email, username, name, passwordHash]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find user by email for registration uniqueness check
   * @param {string} email - User email
   * @returns {Promise<object|null>} User object or null
   */
  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    
    try {
      const result = await pool.query(query, [email]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find user by username for registration uniqueness check
   * @param {string} username - Username
   * @returns {Promise<object|null>} User object or null
   */
  static async findByUsername(username) {
    const query = 'SELECT * FROM users WHERE username = $1';
    
    try {
      const result = await pool.query(query, [username]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find user by ID
   * @param {string} id - User ID (UUID)
   * @returns {Promise<object|null>} User object or null
   */
  static async findById(id) {
    const query = 'SELECT id, email, username, name, created_at, last_activity FROM users WHERE id = $1';
    
    try {
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find user by ID with password hash (for authentication)
   * @param {string} id - User ID (UUID)
   * @returns {Promise<object|null>} User object with password_hash or null
   */
  static async findByIdWithPassword(id) {
    const query = 'SELECT id, email, username, name, password_hash, created_at, last_activity FROM users WHERE id = $1';
    
    try {
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update user's last activity timestamp
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  static async updateLastActivity(userId) {
    const query = 'UPDATE users SET last_activity = NOW() WHERE id = $1';
    
    try {
      await pool.query(query, [userId]);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete user by ID
   * @param {string} userId - User ID (UUID)
   * @returns {Promise<boolean>} True if user was deleted
   */
  static async deleteById(userId) {
    const query = 'DELETE FROM users WHERE id = $1 RETURNING id';
    
    try {
      const result = await pool.query(query, [userId]);
      return result.rowCount > 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update user's email
   * @param {string} userId - User ID (UUID)
   * @param {string} newEmail - New email address
   * @returns {Promise<object>} Updated user
   */
  static async updateEmail(userId, newEmail) {
    const query = `
      UPDATE users 
      SET email = $1 
      WHERE id = $2 
      RETURNING id, email, username, name, created_at
    `;
    
    try {
      const result = await pool.query(query, [newEmail, userId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update user's password
   * @param {string} userId - User ID (UUID)
   * @param {string} newPasswordHash - New password hash
   * @returns {Promise<object>} Updated user
   */
  static async updatePassword(userId, newPasswordHash) {
    const query = `
      UPDATE users 
      SET password_hash = $1 
      WHERE id = $2 
      RETURNING id, email, username, name, created_at
    `;
    
    try {
      const result = await pool.query(query, [newPasswordHash, userId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  
  /**
   * Get all sub-users for a parent account
   * @param {string} parentUserId - Parent user UUID
   * @returns {Promise<array>} Array of sub-users
   */
  static async getSubUsers(parentUserId) {
    const query = `
      SELECT DISTINCT u.id, u.email, u.username, u.name, u.created_at, u.last_activity, 
             su.role, su.created_at as linked_at
      FROM users u
      INNER JOIN pet_users su ON u.id = su.user_id
      LEFT JOIN pets p ON su.pet_id = p.id
      WHERE (su.owner_id = $1 OR p.owner_id = $1)
      ORDER BY su.created_at DESC
    `;
    
    try {
      const result = await pool.query(query, [parentUserId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get parent user ID for a sub-user
   * @param {string} subUserId - Sub-user UUID
   * @returns {Promise<object|null>} Parent user info or null
   */
  static async getParentUser(subUserId) {
    const query = `
      SELECT u.id, u.email, u.username, u.name, su.role
      FROM users u
      INNER JOIN pet_users su ON u.id = su.owner_id
      WHERE su.user_id = $1
    `;
    
    try {
      const result = await pool.query(query, [subUserId]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if a user is a sub-user
   * @param {string} userId - User UUID
   * @returns {Promise<boolean>} True if user is a sub-user
   */
  static async isSubUser(userId) {
    const query = 'SELECT 1 FROM pet_users WHERE user_id = $1';
    
    try {
      const result = await pool.query(query, [userId]);
      return result.rowCount > 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Remove a sub-user relationship (only unlinks the sub-user, keeps the user account)
   * @param {string} subUserId - Sub-user UUID to unlink
   * @returns {Promise<boolean>} True if sub-user relationship was removed
   */
  static async removeSubUser(subUserId) {
    const query = 'DELETE FROM pet_users WHERE user_id = $1 RETURNING user_id as sub_user_id';
    
    try {
      const result = await pool.query(query, [subUserId]);
      return result.rowCount > 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if a user has admin permissions
   * @param {string} userId - User UUID
   * @returns {Promise<boolean>} True if user is an admin
   */
  static async isAdmin(userId) {
    const query = 'SELECT admin_perms FROM users WHERE id = $1';
    
    try {
      const result = await pool.query(query, [userId]);
      return result.rows[0] && result.rows[0].admin_perms > 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update the role of a sub-user
   * @param {string} subUserId - Sub-user UUID
   * @param {string} newRole - New role value
   * @returns {Promise<object>} Updated sub-user info
   */
  static async updateSubUserRole(subUserId, newRole) {
    const query = `
      UPDATE pet_users
      SET role = $1
      WHERE user_id = $2
      RETURNING owner_id as parent_user_id, user_id as sub_user_id, role
    `;
    
    try {
      const result = await pool.query(query, [newRole, subUserId]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = User;
