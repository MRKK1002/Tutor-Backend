const Admin = require('../models/Admin');
const Tutor = require('../models/Tutor');
const Enquiry = require('../models/Enquiry');
const Payment = require('../models/Payment');
const ContactAccess = require('../models/ContactAccess');

// @desc    Dashboard stats
// @route   GET /api/admin/dashboard
// @access  Private (admin)
const getDashboard = async (req, res) => {
  const [
    totalEnquiries, pendingEnquiries, approvedEnquiries, closedEnquiries,
    totalTutors, activeTutors,
    revenueData, recentEnquiries,
  ] = await Promise.all([
    Enquiry.countDocuments(),
    Enquiry.countDocuments({ status: 'pending' }),
    Enquiry.countDocuments({ status: 'approved' }),
    Enquiry.countDocuments({ status: 'closed' }),
    Tutor.countDocuments(),
    Tutor.countDocuments({ isActive: true }),
    Payment.aggregate([{ $match: { status: 'successful' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    Enquiry.find({ status: 'pending' }).sort({ createdAt: -1 }).limit(5),
  ]);

  res.status(200).json({
    success: true,
    stats: {
      totalEnquiries, pendingEnquiries, approvedEnquiries, closedEnquiries,
      totalTutors, activeTutors,
      totalRevenue: (revenueData[0]?.total || 0) / 100, // convert paise to rupees
    },
    recentPendingEnquiries: recentEnquiries,
  });
};

// @desc    Get all tutors
// @route   GET /api/admin/tutors
// @access  Private (admin)
const getTutors = async (req, res) => {
  const { page = 1, limit = 20, isActive } = req.query;
  const filter = {};
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const tutors = await Tutor.find(filter).select('-password -otp').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit));
  const total = await Tutor.countDocuments(filter);

  res.status(200).json({ success: true, count: tutors.length, total, tutors });
};

// @desc    Activate / deactivate a tutor
// @route   PUT /api/admin/tutors/:id/status
// @access  Private (admin)
const updateTutorStatus = async (req, res) => {
  const tutor = await Tutor.findByIdAndUpdate(
    req.params.id,
    { isActive: req.body.isActive },
    { new: true }
  ).select('-password -otp');

  if (!tutor) return res.status(404).json({ success: false, message: 'Tutor not found' });

  res.status(200).json({ success: true, message: `Tutor ${req.body.isActive ? 'activated' : 'deactivated'}`, tutor });
};

// @desc    Get / update admin settings (fee + T&C)
// @route   GET /api/admin/settings
// @access  Private (admin)
const getSettings = async (req, res) => {
  const admin = await Admin.findById(req.user._id).select('contactAccessFee termsAndConditions');
  res.status(200).json({ success: true, settings: admin });
};

// @desc    Update settings
// @route   PUT /api/admin/settings
// @access  Private (admin)
const updateSettings = async (req, res) => {
  const { contactAccessFee, termsAndConditions } = req.body;
  const updates = {};
  if (contactAccessFee !== undefined) updates.contactAccessFee = contactAccessFee;
  if (termsAndConditions) updates.termsAndConditions = termsAndConditions;

  const admin = await Admin.findByIdAndUpdate(req.user._id, updates, { new: true }).select('contactAccessFee termsAndConditions');
  res.status(200).json({ success: true, message: 'Settings updated', settings: admin });
};

const seedAdmin = async () => {
  const exists = await Admin.findOne({ email: '123#gmail.com' });
  if (!exists) {
    const bcrypt = require('bcryptjs');
    const hashed = await bcrypt.hash('123', 10);
    await Admin.create({
      name: 'Super Admin',
      email: '123#gmail.com',
      password: hashed,
      contactAccessFee: 10000,
    });
    console.log('✅ Default admin created — email: 123#gmail.com | password: 123');
  }
};

module.exports = { getDashboard, getTutors, updateTutorStatus, getSettings, updateSettings, seedAdmin };
