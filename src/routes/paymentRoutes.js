const router = require('express').Router();
const { initiatePayment, verifyPayment, webhook, getMyPayments, adminGetPayments, adminGetAccessLog } = require('../controllers/paymentController');
const { protect, tutorOnly, adminOnly } = require('../middleware/auth');

// TUTOR
router.post('/initiate', protect, tutorOnly, initiatePayment);
router.post('/verify', protect, tutorOnly, verifyPayment);
router.get('/my-history', protect, tutorOnly, getMyPayments);

// WEBHOOK — no auth (Razorpay calls this)
router.post('/webhook', webhook);

// ADMIN
router.get('/admin/transactions', protect, adminOnly, adminGetPayments);
router.get('/admin/access-log', protect, adminOnly, adminGetAccessLog);

module.exports = router;
