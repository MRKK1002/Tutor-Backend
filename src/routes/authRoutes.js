const router = require('express').Router();
const { tutorRegister, tutorLogin, getTutorProfile, updateTutorProfile, adminLogin } = require('../controllers/authController');
const { protect, tutorOnly } = require('../middleware/auth');

// Tutor auth
router.post('/tutor/register', tutorRegister);
router.post('/tutor/login', tutorLogin);
router.get('/tutor/me', protect, tutorOnly, getTutorProfile);
router.put('/tutor/me', protect, tutorOnly, updateTutorProfile);

// Admin auth
router.post('/admin/login', adminLogin);

module.exports = router;
