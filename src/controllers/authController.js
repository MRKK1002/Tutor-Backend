const Tutor = require('../models/Tutor');
const Admin = require('../models/Admin');
const generateToken = require('../utils/generateToken');

// ─────────────────────────────────────────────────────────────────────────────
// TUTOR AUTH
// ─────────────────────────────────────────────────────────────────────────────

// @desc    Register tutor
// @route   POST /api/auth/tutor/register
// @access  Public
const tutorRegister = async (req, res) => {
  const { name, phone, email, password, gender, qualifications, subjects, experience, teachingMode, area, pincode } = req.body;

  if (!name || !phone || !password) {
    return res.status(400).json({ success: false, message: 'Name, phone and password are required' });
  }

  const existing = await Tutor.findOne({ phone });
  if (existing) {
    return res.status(400).json({ success: false, message: 'Phone number already registered' });
  }

  const tutor = await Tutor.create({
    name, phone, email, password,
    gender, qualifications,
    subjects: subjects || [],
    experience, teachingMode,
    area, pincode,
  });

  const token = generateToken(tutor._id, 'tutor');

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    token,
    tutor: {
      _id: tutor._id,
      name: tutor.name,
      phone: tutor.phone,
      email: tutor.email,
      gender: tutor.gender,
      subjects: tutor.subjects,
    },
  });
};

// @desc    Login tutor
// @route   POST /api/auth/tutor/login
// @access  Public
const tutorLogin = async (req, res) => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    return res.status(400).json({ success: false, message: 'Phone and password are required' });
  }

  const tutor = await Tutor.findOne({ phone }).select('+password');
  if (!tutor) {
    return res.status(401).json({ success: false, message: 'Invalid phone or password' });
  }

  if (!tutor.isActive) {
    return res.status(401).json({ success: false, message: 'Your account has been deactivated' });
  }

  const isMatch = await tutor.matchPassword(password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid phone or password' });
  }

  const token = generateToken(tutor._id, 'tutor');

  res.status(200).json({
    success: true,
    message: 'Login successful',
    token,
    tutor: {
      _id: tutor._id,
      name: tutor.name,
      phone: tutor.phone,
      email: tutor.email,
      gender: tutor.gender,
      subjects: tutor.subjects,
    },
  });
};

// @desc    Get tutor profile
// @route   GET /api/auth/tutor/me
// @access  Private (tutor)
const getTutorProfile = async (req, res) => {
  const tutor = await Tutor.findById(req.user._id).select('-password -otp');
  res.status(200).json({ success: true, tutor });
};

// @desc    Update tutor profile
// @route   PUT /api/auth/tutor/me
// @access  Private (tutor)
const updateTutorProfile = async (req, res) => {
  const allowed = ['name', 'email', 'gender', 'qualifications', 'subjects', 'experience', 'teachingMode', 'area', 'pincode'];
  const updates = {};
  allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  const tutor = await Tutor.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password -otp');
  res.status(200).json({ success: true, message: 'Profile updated', tutor });
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN AUTH
// ─────────────────────────────────────────────────────────────────────────────

// @desc    Admin login
// @route   POST /api/auth/admin/login
// @access  Public
const adminLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  const admin = await Admin.findOne({ email }).select('+password');
  if (!admin) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const isMatch = await admin.matchPassword(password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const token = generateToken(admin._id, 'admin');

  res.status(200).json({
    success: true,
    message: 'Admin login successful',
    token,
    admin: { _id: admin._id, name: admin.name, email: admin.email },
  });
};

module.exports = { tutorRegister, tutorLogin, getTutorProfile, updateTutorProfile, adminLogin };
