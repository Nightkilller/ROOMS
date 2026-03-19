const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const roomCtrl = require('../controllers/roomController');

// All routes require authentication
router.use(auth);

router.post('/create', [
    body('duration').isIn(['10m', '30m', '1h', '6h', '24h']).withMessage('Invalid duration'),
    body('name').optional().isString().isLength({ max: 60 }),
    validate,
], roomCtrl.createRoom);

router.post('/join', [
    body('code').isString().isLength({ min: 4, max: 8 }).withMessage('Invalid room code'),
    validate,
], roomCtrl.joinRoom);

router.get('/:code', roomCtrl.getRoomInfo);

router.post('/:code/leave', roomCtrl.leaveRoom);

module.exports = router;
