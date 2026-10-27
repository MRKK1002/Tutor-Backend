const mongoose = require('mongoose');

const contactAccessSchema = new mongoose.Schema(
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
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      required: true,
    },
    accessGrantedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// One tutor can unlock one enquiry only once
contactAccessSchema.index({ tutor: 1, enquiry: 1 }, { unique: true });

module.exports = mongoose.model('ContactAccess', contactAccessSchema);
