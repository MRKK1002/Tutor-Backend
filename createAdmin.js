/**
 * Run this once to create the admin account:
 * node createAdmin.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  name:               String,
  email:              { type: String, unique: true },
  password:           String,
  role:               { type: String, default: 'admin' },
  contactAccessFee:   { type: Number, default: 10000 },
  termsAndConditions: { type: String, default: 'This fee is non-refundable.' },
}, { timestamps: true });

const Admin = mongoose.model('Admin', adminSchema);

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Remove existing admin
    await Admin.deleteMany({ email: 'admin@wantedtutors.com' });

    const hashed = await bcrypt.hash('Admin@123', 10);

    await Admin.create({
      name:    'Super Admin',
      email:   'admin@wantedtutors.com',
      password: hashed,
      contactAccessFee: 10000,
    });

    console.log('');
    console.log('✅ Admin created successfully!');
    console.log('   Email:    admin@wantedtutors.com');
    console.log('   Password: Admin@123');
    console.log('   URL:      http://localhost:3000/admin/login');
    console.log('');

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();
