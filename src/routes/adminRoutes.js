const router = require('express').Router();
const { getDashboard, getTutors, updateTutorStatus, getSettings, updateSettings } = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/dashboard', protect, adminOnly, getDashboard);
router.get('/tutors', protect, adminOnly, getTutors);
router.put('/tutors/:id/status', protect, adminOnly, updateTutorStatus);
router.get('/settings', protect, adminOnly, getSettings);
router.put('/settings', protect, adminOnly, updateSettings);

module.exports = router;
