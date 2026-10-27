const crypto = require('crypto');
const Razorpay = require('razorpay');
const Payment = require('../models/Payment');
const ContactAccess = require('../models/ContactAccess');
const Enquiry = require('../models/Enquiry');
const Admin = require('../models/Admin');

const getRazorpay = () =>
  new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

// @desc    Initiate payment — create Razorpay order
// @route   POST /api/payments/initiate
// @access  Private (tutor)
const initiatePayment = async (req, res) => {
  const { enquiryId } = req.body;

  const enquiry = await Enquiry.findOne({ _id: enquiryId, status: 'approved' });
  if (!enquiry) {
    return res.status(404).json({ success: false, message: 'Listing not found or not active' });
  }

  // Block if already paid
  const alreadyAccess = await ContactAccess.findOne({ tutor: req.user._id, enquiry: enquiryId });
  if (alreadyAccess) {
    return res.status(400).json({ success: false, message: 'You already have access to this contact' });
  }

  const admin = await Admin.findOne();
  const amount = admin?.contactAccessFee || parseInt(process.env.CONTACT_ACCESS_FEE || 10000);

  const razorpay = getRazorpay();
  const order = await razorpay.orders.create({
    amount,
    currency: 'INR',
    receipt: `rcpt_${Date.now()}`,
    notes: { tutorId: req.user._id.toString(), enquiryId },
  });

  const payment = await Payment.create({
    tutor: req.user._id,
    enquiry: enquiryId,
    amount,
    razorpayOrderId: order.id,
    status: 'initiated',
  });

  res.status(200).json({
    success: true,
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    paymentId: payment._id,
    razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    termsAndConditions: admin?.termsAndConditions || 'This fee is non-refundable.',
  });
};

// @desc    Verify payment after Razorpay success callback
// @route   POST /api/payments/verify
// @access  Private (tutor)
const verifyPayment = async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentId } = req.body;

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !paymentId) {
    return res.status(400).json({ success: false, message: 'All payment fields are required' });
  }

  // Verify HMAC signature
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  if (expected !== razorpaySignature) {
    await Payment.findByIdAndUpdate(paymentId, { status: 'failed', failureReason: 'Signature mismatch' });
    return res.status(400).json({ success: false, message: 'Payment verification failed. Please contact support.' });
  }

  // Mark payment successful
  const payment = await Payment.findByIdAndUpdate(
    paymentId,
    { razorpayPaymentId, razorpaySignature, status: 'successful', isVerified: true },
    { new: true }
  );

  if (!payment) {
    return res.status(404).json({ success: false, message: 'Payment record not found' });
  }

  // Unlock contact access
  await ContactAccess.findOneAndUpdate(
    { tutor: req.user._id, enquiry: payment.enquiry },
    { tutor: req.user._id, enquiry: payment.enquiry, payment: payment._id, accessGrantedAt: new Date() },
    { upsert: true, new: true }
  );

  res.status(200).json({
    success: true,
    message: 'Payment successful! Contact details are now unlocked.',
  });
};

// @desc    Razorpay webhook (server-side backup verification)
// @route   POST /api/payments/webhook
// @access  Public (Razorpay servers only)
const webhook = async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const sig = req.headers['x-razorpay-signature'];

  if (secret && sig) {
    const expected = crypto.createHmac('sha256', secret).update(JSON.stringify(req.body)).digest('hex');
    if (expected !== sig) {
      return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
    }
  }

  const { event, payload } = req.body;
  const entity = payload?.payment?.entity;

  if (event === 'payment.captured' && entity) {
    const payment = await Payment.findOneAndUpdate(
      { razorpayOrderId: entity.order_id },
      { razorpayPaymentId: entity.id, status: 'successful', isVerified: true, gatewayResponse: entity },
      { new: true }
    );
    if (payment) {
      await ContactAccess.findOneAndUpdate(
        { tutor: payment.tutor, enquiry: payment.enquiry },
        { tutor: payment.tutor, enquiry: payment.enquiry, payment: payment._id, accessGrantedAt: new Date() },
        { upsert: true }
      );
    }
  }

  if (event === 'payment.failed' && entity) {
    await Payment.findOneAndUpdate(
      { razorpayOrderId: entity.order_id },
      { status: 'failed', failureReason: entity.error_description, gatewayResponse: entity }
    );
  }

  res.status(200).json({ success: true });
};

// @desc    Get tutor's payment history
// @route   GET /api/payments/my-history
// @access  Private (tutor)
const getMyPayments = async (req, res) => {
  const payments = await Payment.find({ tutor: req.user._id })
    .populate('enquiry', 'studentName class board area status')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, count: payments.length, payments });
};

// @desc    Admin — all transactions
// @route   GET /api/admin/payments
// @access  Private (admin)
const adminGetPayments = async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const payments = await Payment.find(filter)
    .populate('tutor', 'name phone')
    .populate('enquiry', 'studentName class board area')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Payment.countDocuments(filter);

  res.status(200).json({ success: true, count: payments.length, total, payments });
};

// @desc    Admin — contact access log
// @route   GET /api/admin/access-log
// @access  Private (admin)
const adminGetAccessLog = async (req, res) => {
  const logs = await ContactAccess.find()
    .populate('tutor', 'name phone')
    .populate('enquiry', 'studentName class board area')
    .populate('payment', 'amount status')
    .sort({ accessGrantedAt: -1 });

  res.status(200).json({ success: true, count: logs.length, logs });
};

module.exports = { initiatePayment, verifyPayment, webhook, getMyPayments, adminGetPayments, adminGetAccessLog };
