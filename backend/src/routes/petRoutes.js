const express = require('express');
const router = express.Router();
const { addPet } = require('../controllers/petController');
const authenticateToken = require('../middleware/authenticateToken');

router.post('/', authenticateToken, addPet);

/**
 * @route POST /api/
 */
module.exports = router;