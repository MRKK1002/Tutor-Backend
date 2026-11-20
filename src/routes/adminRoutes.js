const router = require('express').Router();
const { getDashboard, getTutors, updateTutorStatus, getSettings, updateSettings, getHeroContent, updateHeroContent } = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/dashboard',          protect, adminOnly, getDashboard);
router.get('/tutors',             protect, adminOnly, getTutors);
router.put('/tutors/:id/status',  protect, adminOnly, updateTutorStatus);
router.get('/settings',           protect, adminOnly, getSettings);
router.put('/settings',           protect, adminOnly, updateSettings);

// Hero CMS — GET is public, PUT is admin only
router.get('/hero',               getHeroContent);
router.put('/hero',               protect, adminOnly, updateHeroContent);

module.exports = router;
