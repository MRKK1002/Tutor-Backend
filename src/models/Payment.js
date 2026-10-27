const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    tutor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tutor',
      required: true,
    },
    enquiry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Enquiry',
      required: true,
    },
    amount: { type: Number, required: true }, // in paise
    currency: { type: String, default: 'INR' },

    // Razorpay fields
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },

    status: {
      type: String,
      enum: ['initiated', 'pending', 'successful', 'failed', 'cancelled'],
      default: 'initiated',
    },
    isVerified: { type: Boolean, default: false },
    failureReason: { type: String },
    gatewayResponse: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
