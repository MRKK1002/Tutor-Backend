const router = require('express').Router();
const {
  submitEnquiry, getListings, getListingDetail, getContactDetails,
  adminGetEnquiries, adminUpdateStatus, adminEditEnquiry,
} = require('../controllers/enquiryController');
const { protect, tutorOnly, adminOnly } = require('../middleware/auth');

// ── PUBLIC ────────────────────────────────────────────────────────────────────
router.post('/submit', submitEnquiry);

// ── ADMIN (must come BEFORE /:id to avoid route conflicts) ───────────────────
router.get('/admin/all',          protect, adminOnly, adminGetEnquiries);
router.get('/admin/:id',          protect, adminOnly, async (req, res) => {
  // inline admin get single enquiry
  const Enquiry = require('../models/Enquiry');
  const enquiry = await Enquiry.findById(req.params.id);
  if (!enquiry) return res.status(404).json({ success: false, message: 'Enquiry not found' });
  res.status(200).json({ success: true, enquiry });
});
router.put('/admin/:id/status',   protect, adminOnly, adminUpdateStatus);
router.put('/admin/:id',          protect, adminOnly, adminEditEnquiry);

// ── TUTOR (after admin routes) ────────────────────────────────────────────────
router.get('/',              protect, tutorOnly, getListings);
router.get('/:id/contact',   protect, tutorOnly, getContactDetails);
router.get('/:id',           protect, tutorOnly, getListingDetail);

module.exports = router;
