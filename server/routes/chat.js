const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { body, query } = require('express-validator');
const validate = require('../middleware/validate');
const chatCtrl = require('../controllers/chatController');

// All chat routes require authentication
router.use(auth);


// Create or get existing DM
router.post('/dm', [
    body('userId').isMongoId().withMessage('Invalid user ID'),
    validate,
], chatCtrl.createOrGetDM);

// Create group chat
router.post('/group', [
    body('name').optional().isString().isLength({ max: 100 }),
    body('participantIds').isArray({ min: 1 }).withMessage('At least 1 participant required'),
    body('participantIds.*').isMongoId().withMessage('Invalid participant ID'),
    validate,
], chatCtrl.createGroup);

// Get all my chats
router.get('/', chatCtrl.getMyChats);

// Get messages for a chat room (paginated)
router.get('/:roomId/messages', chatCtrl.getMessages);

// Search users to start a new chat
router.get('/users/search', [
    query('q').isString().isLength({ min: 2 }).withMessage('Search query too short'),
    validate,
], chatCtrl.searchUsers);

module.exports = router;
