const Enquiry = require('../models/Enquiry');
const ContactAccess = require('../models/ContactAccess');
const Admin = require('../models/Admin');

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC — Parent submits enquiry (NO login required)
// ─────────────────────────────────────────────────────────────────────────────

// @desc    Parent submits a tutor requirement
// @route   POST /api/enquiries/submit
// @access  Public
const submitEnquiry = async (req, res) => {
  const {
    parentName, parentPhone, parentEmail,
    studentName, class: studentClass, board,
    subjects, preferredTutor, area, pincode,
    budgetPerMonth, preferredTimings, comments,
  } = req.body;

  // Basic required field check
  if (!parentName || !parentPhone || !studentName || !studentClass || !board || !subjects || !preferredTutor || !area || !pincode || !budgetPerMonth) {
    return res.status(400).json({ success: false, message: 'Please fill all required fields' });
  }

  // Get current access fee from admin settings
  const admin = await Admin.findOne();
  const accessFee = admin?.contactAccessFee || parseInt(process.env.CONTACT_ACCESS_FEE || 10000);

  const enquiry = await Enquiry.create({
    parentName, parentPhone, parentEmail,
    studentName, class: studentClass, board,
    subjects: Array.isArray(subjects) ? subjects : [subjects],
    preferredTutor, area, pincode,
    budgetPerMonth, preferredTimings, comments,
    status: 'pending',
    accessFee,
  });

  res.status(201).json({
    success: true,
    message: 'Your tutor requirement has been submitted successfully! We will review and publish it shortly.',
    enquiryId: enquiry._id,
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// TUTOR — Browse approved listings (contact details hidden)
// ─────────────────────────────────────────────────────────────────────────────

// @desc    Get all approved enquiries (NO contact info)
// @route   GET /api/enquiries
// @access  Private (tutor)
const getListings = async (req, res) => {
  const { board, pincode, subject, page = 1, limit = 12 } = req.query;

  const filter = { status: 'approved' };
  if (board) filter.board = board;
  if (pincode) filter.pincode = pincode;
  if (subject) filter.subjects = { $in: [subject] };

  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Get live access fee from admin settings
  const admin = await Admin.findOne().select('contactAccessFee');
  const liveAccessFee = admin?.contactAccessFee || parseInt(process.env.CONTACT_ACCESS_FEE || 10000);

  const enquiries = await Enquiry.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .select('studentName class board subjects preferredTutor area pincode budgetPerMonth preferredTimings comments createdAt');

  const total = await Enquiry.countDocuments(filter);

  // Check which enquiries this tutor has already unlocked
  const enquiryIds = enquiries.map((e) => e._id);
  const myAccess = await ContactAccess.find({
    tutor: req.user._id,
    enquiry: { $in: enquiryIds },
  }).select('enquiry');

  const unlockedIds = new Set(myAccess.map((a) => a.enquiry.toString()));

  const listingsWithAccess = enquiries.map((e) => ({
    ...e.toObject(),
    hasAccess: unlockedIds.has(e._id.toString()),
    accessFee: liveAccessFee, // always use live admin fee
  }));

  res.status(200).json({
    success: true,
    count: enquiries.length,
    total,
    pages: Math.ceil(total / parseInt(limit)),
    currentPage: parseInt(page),
    enquiries: listingsWithAccess,
  });
};

// @desc    Get single listing detail (NO contact info)
// @route   GET /api/enquiries/:id
// @access  Private (tutor)
const getListingDetail = async (req, res) => {
  const enquiry = await Enquiry.findOne({ _id: req.params.id, status: 'approved' })
    .select('studentName class board subjects preferredTutor area pincode budgetPerMonth preferredTimings comments createdAt');

  if (!enquiry) {
    return res.status(404).json({ success: false, message: 'Listing not found' });
  }

  // Check access
  const access = await ContactAccess.findOne({ tutor: req.user._id, enquiry: enquiry._id });

  // Always fetch live fee from admin
  const admin = await Admin.findOne().select('termsAndConditions contactAccessFee');
  const liveAccessFee = admin?.contactAccessFee || parseInt(process.env.CONTACT_ACCESS_FEE || 10000);

  res.status(200).json({
    success: true,
    enquiry: { ...enquiry.toObject(), hasAccess: !!access },
    termsAndConditions: admin?.termsAndConditions,
    accessFee: liveAccessFee,
  });
};

// @desc    Get contact details — ONLY after verified payment (server-enforced)
// @route   GET /api/enquiries/:id/contact
// @access  Private (tutor)
const getContactDetails = async (req, res) => {
  // Server-side check — never trust frontend
  const access = await ContactAccess.findOne({
    tutor: req.user._id,
    enquiry: req.params.id,
  }).populate('payment', 'status isVerified');

  if (!access) {
    return res.status(403).json({ success: false, message: 'Access denied. Please complete payment first.' });
  }

  if (!access.payment?.isVerified || access.payment?.status !== 'successful') {
    return res.status(403).json({ success: false, message: 'Payment not verified. Contact details are locked.' });
  }

  const enquiry = await Enquiry.findById(req.params.id)
    .select('parentName parentPhone parentEmail studentName class board subjects area');

  if (!enquiry) {
    return res.status(404).json({ success: false, message: 'Enquiry not found' });
  }

  res.status(200).json({
    success: true,
    contact: {
      parentName: enquiry.parentName,
      parentPhone: enquiry.parentPhone,
      parentEmail: enquiry.parentEmail,
      studentName: enquiry.studentName,
    },
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — Manage enquiries
// ─────────────────────────────────────────────────────────────────────────────

// @desc    Admin gets all enquiries with status filter
// @route   GET /api/admin/enquiries
// @access  Private (admin)
const adminGetEnquiries = async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const enquiries = await Enquiry.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit));
  const total = await Enquiry.countDocuments(filter);

  res.status(200).json({
    success: true,
    count: enquiries.length,
    total,
    pages: Math.ceil(total / parseInt(limit)),
    currentPage: parseInt(page),
    enquiries,
  });
};

// @desc    Admin approves / rejects / closes an enquiry
// @route   PUT /api/admin/enquiries/:id/status
// @access  Private (admin)
const adminUpdateStatus = async (req, res) => {
  const { status, adminNote } = req.body;

  if (!['approved', 'rejected', 'closed', 'pending'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }

  const enquiry = await Enquiry.findByIdAndUpdate(
    req.params.id,
    { status, adminNote, reviewedBy: req.user._id, reviewedAt: new Date() },
    { new: true }
  );

  if (!enquiry) return res.status(404).json({ success: false, message: 'Enquiry not found' });

  res.status(200).json({ success: true, message: `Enquiry ${status}`, enquiry });
};

// @desc    Admin edits enquiry
// @route   PUT /api/admin/enquiries/:id
// @access  Private (admin)
const adminEditEnquiry = async (req, res) => {
  const allowed = ['studentName', 'class', 'board', 'subjects', 'preferredTutor', 'area', 'pincode', 'budgetPerMonth', 'preferredTimings', 'comments'];
  const updates = {};
  allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  const enquiry = await Enquiry.findByIdAndUpdate(req.params.id, updates, { new: true });
  if (!enquiry) return res.status(404).json({ success: false, message: 'Enquiry not found' });

  res.status(200).json({ success: true, message: 'Enquiry updated', enquiry });
};

module.exports = {
  submitEnquiry,
  getListings,
  getListingDetail,
  getContactDetails,
  adminGetEnquiries,
  adminUpdateStatus,
  adminEditEnquiry,
};
