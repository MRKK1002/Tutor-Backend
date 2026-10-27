const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema(
  {
    // ── Parent / contact info (PRIVATE — never sent to tutors) ─────────────
    parentName: { type: String, required: true, trim: true },
    parentPhone: { type: String, required: true, trim: true },
    parentEmail: { type: String, trim: true },

    // ── Student info (PUBLIC — visible to tutors) ──────────────────────────
    studentName: { type: String, required: true, trim: true },
    class: { type: String, required: true, trim: true },
    board: {
      type: String,
      required: true,
      enum: ['CBSE', 'ICSE', 'State Board', 'IB', 'IGCSE', 'Other'],
    },
    subjects: { type: [String], required: true },
    preferredTutor: {
      type: String,
      enum: ['Male', 'Female', 'Anyone'],
      required: true,
    },
    area: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    budgetPerMonth: { type: Number, required: true },
    preferredTimings: { type: String, trim: true },
    comments: { type: String, trim: true },

    // ── Admin workflow ──────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'closed'],
      default: 'pending',
    },
    adminNote: { type: String, trim: true },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    reviewedAt: Date,

    // Access fee snapshot at time of approval
    accessFee: { type: Number, default: 10000 },
  },
  { timestamps: true }
);

// Index for fast tutor listing queries
enquirySchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Enquiry', enquirySchema);
