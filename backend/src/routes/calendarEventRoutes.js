const express = require('express');
const router = express.Router();
const { 
    getUserPetCalendarEvents, 
    getPetCalendarEvents,
    getCalendarEventById,
    createCalendarEvent, 
    updateCalendarEvent, 
    deleteCalendarEvent 
} = require('../controllers/calendarEventController');
const authenticateToken = require('../middleware/authenticateToken');
const resolveEffectiveUser = require('../middleware/resolveEffectiveUser');

/**
 * @route GET /api/calendar-events
 * @desc Get all calendar events for the authenticated user's pets
 * @access Private (all sub-users can view)
 */
router.get('/', authenticateToken, resolveEffectiveUser, getUserPetCalendarEvents);

/**
 * @route GET /api/calendar-events/pet/:petId
 * @desc Get calendar events for a specific pet
 * @access Private (pet owner and sub-users with access)
 */
router.get('/pet/:petId', authenticateToken, resolveEffectiveUser, getPetCalendarEvents);

/**
 * @route GET /api/calendar-events/:eventId
 * @desc Get a single calendar event by ID
 * @access Private (pet owner and sub-users with access)
 */
router.get('/:eventId', authenticateToken, resolveEffectiveUser, getCalendarEventById);

/**
 * @route POST /api/calendar-events
 * @desc Create a new calendar event
 * @access Private (only pet owner and sub-users with 'omistaja' role)
 */
router.post('/', authenticateToken, createCalendarEvent);

/**
 * @route PUT /api/calendar-events/:eventId
 * @desc Update a calendar event
 * @access Private (only pet owner and sub-users with 'omistaja' role)
 */
router.put('/:eventId', authenticateToken, updateCalendarEvent);

/**
 * @route DELETE /api/calendar-events/:eventId
 * @desc Delete a calendar event
 * @access Private (only pet owner and sub-users with 'omistaja' role)
 */
router.delete('/:eventId', authenticateToken, deleteCalendarEvent);

module.exports = router;
