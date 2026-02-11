const CalendarEvent = require('../models/CalendarEvent');
const Pet = require('../models/Pet');
const User = require('../models/User');
const pool = require('../config/database');

/**
 * Helper function to check if user has permission to modify pet data
 * @param {string} userId - Current user ID
 * @param {string} petOwnerId - Pet owner ID
 * @returns {Promise<boolean>} true if user has permission
 */
const hasPermissionForPet = async (userId, petOwnerId) => {
    // Direct owner has permission
    if (userId === petOwnerId) {
        return true;
    }

    // Check if user is a sub-user with 'omistaja' role
    const parentUser = await User.getParentUser(userId);
    if (parentUser && parentUser.id === petOwnerId && parentUser.role === 'omistaja') {
        return true;
    }

    return false;
};

/**
 * Get all calendar events for the authenticated user's pets
 * @route GET /api/calendar-events
 */
const getUserPetCalendarEvents = async (req, res) => {
    try {
        // Use effectiveUserId for sub-user support (set by resolveEffectiveUser middleware)
        const userId = req.effectiveUserId || req.user.userId;

        const calendarEvents = await CalendarEvent.getAllByUserId(userId);

        // Group calendar events by pet
        const groupedByPet = calendarEvents.reduce((acc, event) => {
            const petId = event.pet_id;
            
            if (!acc[petId]) {
                acc[petId] = {
                    pet_id: petId,
                    pet_name: event.pet_name,
                    pet_type: event.pet_type,
                    calendar_events: []
                };
            }
            
            // Add calendar event without pet info (since it's now in the parent object)
            acc[petId].calendar_events.push({
                id: event.id,
                type_id: event.type_id,
                type_name: event.type_name || 'Unknown',
                title: event.title,
                description: event.description,
                date: event.date,
                time: event.time,
                remind_before_min: event.remind_before_min,
                created_at: event.created_at
            });
            
            return acc;
        }, {});

        // Convert object to array
        const result = Object.values(groupedByPet);

        res.status(200).json({
            success: true,
            message: 'Calendar events retrieved successfully',
            data: result,
            total_pets: result.length,
            total_events: calendarEvents.length
        });
    } catch (error) {
        console.error('Get calendar events error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve calendar events'
        });
    }
};

/**
 * Get calendar events for a specific pet
 * @route GET /api/calendar-events/pet/:petId
 */
const getPetCalendarEvents = async (req, res) => {
    try {
        const userId = req.effectiveUserId || req.user.userId;
        const { petId } = req.params;

        // Verify pet exists and user has access
        const pet = await Pet.getById(petId);
        if (!pet) {
            return res.status(404).json({
                success: false,
                message: 'Pet not found'
            });
        }

        // Check if user has access to this pet
        const hasAccess = await Pet.userHasAccess(petId, userId);
        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this pet'
            });
        }

        const calendarEvents = await CalendarEvent.getByPetId(petId);

        res.status(200).json({
            success: true,
            message: 'Calendar events retrieved successfully',
            data: calendarEvents,
            count: calendarEvents.length,
            pet: {
                id: pet.id,
                name: pet.name,
                type: pet.type
            }
        });
    } catch (error) {
        console.error('Get pet calendar events error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve calendar events'
        });
    }
};

/**
 * Get a single calendar event by ID
 * @route GET /api/calendar-events/:eventId
 */
const getCalendarEventById = async (req, res) => {
    try {
        const userId = req.effectiveUserId || req.user.userId;
        const { eventId } = req.params;

        const calendarEvent = await CalendarEvent.getById(eventId);

        if (!calendarEvent) {
            return res.status(404).json({
                success: false,
                message: 'Calendar event not found'
            });
        }

        // Check if user has access to this pet
        const hasAccess = await Pet.userHasAccess(calendarEvent.pet_id, userId);
        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this calendar event'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Calendar event retrieved successfully',
            data: calendarEvent
        });
    } catch (error) {
        console.error('Get calendar event by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve calendar event'
        });
    }
};

/**
 * Create a new calendar event
 * @route POST /api/calendar-events
 */
const createCalendarEvent = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { pet_id, type_id, title, description, date, time, remind_before_min } = req.body;

        // Validate required fields
        if (!pet_id) {
            return res.status(400).json({
                success: false,
                message: 'Pet ID is required'
            });
        }

        if (!title) {
            return res.status(400).json({
                success: false,
                message: 'Title is required'
            });
        }

        if (!date) {
            return res.status(400).json({
                success: false,
                message: 'Date is required'
            });
        }

        if (!time) {
            return res.status(400).json({
                success: false,
                message: 'Time is required'
            });
        }

        // Verify pet exists
        const pet = await Pet.getById(pet_id);
        if (!pet) {
            return res.status(404).json({
                success: false,
                message: 'Pet not found'
            });
        }

        // Check if user has permission to add calendar events for this pet
        const hasPermission = await Pet.userHasAccess(pet_id, userId);
        if (!hasPermission) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to add calendar events for this pet'
            });
        }

        const newEvent = await CalendarEvent.create({
            pet_id,
            type_id,
            title,
            description,
            date,
            time,
            remind_before_min
        });

        res.status(201).json({
            success: true,
            message: 'Calendar event created successfully',
            data: newEvent
        });
    } catch (error) {
        console.error('Create calendar event error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create calendar event'
        });
    }
};

/**
 * Update a calendar event
 * @route PUT /api/calendar-events/:eventId
 */
const updateCalendarEvent = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { eventId } = req.params;
        const { type_id, title, description, date, time, remind_before_min } = req.body;

        // Get the existing event
        const existingEvent = await CalendarEvent.getById(eventId);
        if (!existingEvent) {
            return res.status(404).json({
                success: false,
                message: 'Calendar event not found'
            });
        }

        // Get pet to check ownership
        const pet = await Pet.getById(existingEvent.pet_id);
        if (!pet) {
            return res.status(404).json({
                success: false,
                message: 'Pet not found'
            });
        }

        // Check if user has permission to update this event
        const hasPermission = await Pet.userHasAccess(pet.id, userId);
        if (!hasPermission) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to update this calendar event'
            });
        }

        const updatedEvent = await CalendarEvent.update(eventId, {
            type_id,
            title,
            description,
            date,
            time,
            remind_before_min
        });

        res.status(200).json({
            success: true,
            message: 'Calendar event updated successfully',
            data: updatedEvent
        });
    } catch (error) {
        console.error('Update calendar event error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update calendar event'
        });
    }
};

/**
 * Delete a calendar event
 * @route DELETE /api/calendar-events/:eventId
 */
const deleteCalendarEvent = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { eventId } = req.params;

        // Get the existing event
        const existingEvent = await CalendarEvent.getById(eventId);
        if (!existingEvent) {
            return res.status(404).json({
                success: false,
                message: 'Calendar event not found'
            });
        }

        // Get pet to check ownership
        const pet = await Pet.getById(existingEvent.pet_id);
        if (!pet) {
            return res.status(404).json({
                success: false,
                message: 'Pet not found'
            });
        }

        // Check if user has permission to delete this event
        const hasPermission = await hasPermissionForPet(userId, pet.owner_id);
        if (!hasPermission) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to delete this calendar event'
            });
        }

        const deleted = await CalendarEvent.deleteById(eventId);

        if (deleted) {
            res.status(200).json({
                success: true,
                message: 'Calendar event deleted successfully'
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Calendar event not found'
            });
        }
    } catch (error) {
        console.error('Delete calendar event error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete calendar event'
        });
    }
};

module.exports = {
    getUserPetCalendarEvents,
    getPetCalendarEvents,
    getCalendarEventById,
    createCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent
};
