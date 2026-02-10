const pool = require('../config/database');

class CalendarEvent {
    /**
     * Get all calendar events for a specific pet
     * @param {number} petId - Pet ID
     * @returns {Promise<Array>} Array of calendar events
     */
    static async getByPetId(petId) {
        const query = `
            SELECT * FROM calendar_events 
            WHERE pet_id = $1
            ORDER BY created_at DESC
        `;

        try {
            const result = await pool.query(query, [petId]);
            return result.rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get all calendar events for multiple pets
     * @param {Array<number>} petIds - Array of pet IDs
     * @returns {Promise<Array>} Array of calendar events
     */
    static async getByPetIds(petIds) {
        const query = `
            SELECT ce.*, p.name as pet_name
            FROM calendar_events ce
            JOIN pets p ON ce.pet_id = p.id
            WHERE ce.pet_id = ANY($1)
            ORDER BY p.name, ce.created_at DESC
        `;

        try {
            const result = await pool.query(query, [petIds]);
            return result.rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get all calendar events for a user's pets (owned and shared)
     * @param {string} userId - User ID (UUID)
     * @returns {Promise<Array>} Array of calendar events with pet information
     */
    static async getAllByUserId(userId) {
        const query = `
            SELECT DISTINCT ce.*, p.name as pet_name, p.type as pet_type, 
                   vvt.name as type_name
            FROM calendar_events ce
            JOIN pets p ON ce.pet_id = p.id
            LEFT JOIN vet_visit_types vvt ON ce.type_id = vvt.id
            LEFT JOIN pet_users pu ON p.id = pu.pet_id
            WHERE p.owner_id = $1 OR pu.user_id = $1
            ORDER BY p.name, ce.created_at DESC
        `;

        try {
            const result = await pool.query(query, [userId]);
            return result.rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Create a new calendar event
     * @param {object} eventData - Calendar event data
     * @returns {Promise<object>} Created calendar event
     */
    static async create({ pet_id, type_id, title, description, remind_before_min }) {
        const query = `
            INSERT INTO calendar_events (pet_id, type_id, title, description, remind_before_min)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;

        try {
            const result = await pool.query(query, [pet_id, type_id, title, description, remind_before_min]);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get calendar event by ID
     * @param {number} eventId - Calendar event ID
     * @returns {Promise<object>} Calendar event object or undefined if not found
     */
    static async getById(eventId) {
        const query = `
            SELECT ce.*, p.name as pet_name, p.type as pet_type,
                   vvt.name as type_name
            FROM calendar_events ce
            JOIN pets p ON ce.pet_id = p.id
            LEFT JOIN vet_visit_types vvt ON ce.type_id = vvt.id
            WHERE ce.id = $1
        `;

        try {
            const result = await pool.query(query, [eventId]);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    /**
     * Update calendar event by ID
     * @param {number} eventId - Calendar event ID
     * @param {object} updates - Fields to update
     * @returns {Promise<object>} Updated calendar event
     */
    static async update(eventId, { type_id, title, description, remind_before_min }) {
        const query = `
            UPDATE calendar_events
            SET type_id = COALESCE($1, type_id),
                title = COALESCE($2, title),
                description = COALESCE($3, description),
                remind_before_min = COALESCE($4, remind_before_min)
            WHERE id = $5
            RETURNING *
        `;

        try {
            const result = await pool.query(query, [type_id, title, description, remind_before_min, eventId]);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    /**
     * Delete calendar event by ID
     * @param {number} eventId - Calendar event ID
     * @returns {Promise<boolean>} true if event was deleted
     */
    static async deleteById(eventId) {
        const query = 'DELETE FROM calendar_events WHERE id = $1 RETURNING id';

        try {
            const result = await pool.query(query, [eventId]);
            return result.rowCount > 0;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Check if pet owns the calendar event
     * @param {number} eventId - Calendar event ID
     * @param {number} petId - Pet ID
     * @returns {Promise<boolean>} true if pet owns the event
     */
    static async isPetOwner(eventId, petId) {
        const query = 'SELECT pet_id FROM calendar_events WHERE id = $1';

        try {
            const result = await pool.query(query, [eventId]);
            if (result.rows.length === 0) return false;
            return result.rows[0].pet_id === petId;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = CalendarEvent;
