const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, minlength: 3, select: false },
    role: { type: String, default: 'admin' },
    // Configurable settings
    contactAccessFee: { type: Number, default: 10000 }, // in paise
    termsAndConditions: {
      type: String,
      default:
        'By proceeding with the payment, you agree that this fee is non-refundable. Contact details are for tutoring purposes only and must not be misused.',
    },
  },
  { timestamps: true }
);

// Hash password before saving — Mongoose 9 style (no next())
adminSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

adminSchema.methods.matchPassword = async function (entered) {
  return await bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('Admin', adminSchema);
