const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const tutorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone is required'],
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
    },
    qualifications: {
      type: String,
      trim: true,
    },
    subjects: [String],
    experience: {
      type: String,
      trim: true,
    },
    teachingMode: {
      type: String,
      enum: ['Home Visit', 'Online', 'Both'],
    },
    area: { type: String, trim: true },
    pincode: { type: String, trim: true },
    isActive: {
      type: Boolean,
      default: true,
    },
    otp: {
      code: String,
      expiresAt: Date,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);
tutorSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});
tutorSchema.methods.matchPassword = async function (entered) {
  return await bcrypt.compare(entered, this.password);
};
module.exports = mongoose.model('Tutor', tutorSchema);
