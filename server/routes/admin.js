const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const ac = require('../controllers/adminController');
const ec = require('../controllers/exportController');

const router = express.Router();

router.use(auth, admin);

router.get('/stats', ac.getStats);
router.get('/charts', ac.getChartData);
router.get('/users', ac.getUsers);
router.get('/users/:userId', ac.getUserDetail);
router.post('/users/:userId/lock', ac.lockUser);
router.post('/users/:userId/unlock', ac.unlockUser);
router.post('/users/:userId/force-logout', ac.forceLogout);
router.delete('/users/:userId', ac.deleteUser);
router.post('/users/:userId/notes', [
    body('note').trim().notEmpty().withMessage('Note is required.'),
], validate, ac.addNote);
router.get('/audit-log', ac.getAuditLog);

// Exports
router.get('/export/pdf', ec.exportPDF);
router.get('/export/csv', ec.exportCSV);

// Room management
router.get('/rooms/stats', ac.getRoomStats);
router.get('/rooms', ac.getActiveRooms);
router.post('/rooms/:code/terminate', ac.terminateRoom);

module.exports = router;
