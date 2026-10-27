/**
 * Seed sample approved listings so tutors can see them.
 * Run: node seedListings.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Enquiry  = require('./src/models/Enquiry');
const Admin    = require('./src/models/Admin');

const sampleListings = [
  {
    parentName:     'Priya Sharma',
    parentPhone:    '9876543210',
    parentEmail:    'priya@example.com',
    studentName:    'Arjun Sharma',
    class:          '8th',
    board:          'CBSE',
    subjects:       ['Mathematics', 'Science'],
    preferredTutor: 'Female',
    area:           'Whitefield',
    pincode:        '560066',
    budgetPerMonth: 5000,
    preferredTimings: 'Evening 5–7 PM',
    comments:       'Need a patient tutor. Weekends preferred.',
    status:         'approved',
    accessFee:      10000,
  },
  {
    parentName:     'Rajesh Kumar',
    parentPhone:    '9845123456',
    parentEmail:    'rajesh@example.com',
    studentName:    'Sneha Kumar',
    class:          '10th',
    board:          'State Board',
    subjects:       ['Science', 'Mathematics'],
    preferredTutor: 'Anyone',
    area:           'Koramangala',
    pincode:        '560034',
    budgetPerMonth: 6000,
    preferredTimings: 'Morning 8–10 AM',
    comments:       'Board exam preparation required.',
    status:         'approved',
    accessFee:      10000,
  },
  {
    parentName:     'Meena Reddy',
    parentPhone:    '9731234567',
    parentEmail:    'meena@example.com',
    studentName:    'Vikram Reddy',
    class:          '5th',
    board:          'CBSE',
    subjects:       ['Mathematics', 'English', 'Science'],
    preferredTutor: 'Female',
    area:           'Indiranagar',
    pincode:        '560038',
    budgetPerMonth: 4000,
    preferredTimings: 'Evening 4–6 PM',
    comments:       'All subjects needed. Home tuition preferred.',
    status:         'approved',
    accessFee:      10000,
  },
  {
    parentName:     'Suresh Nair',
    parentPhone:    '9901234567',
    parentEmail:    'suresh@example.com',
    studentName:    'Aditya Nair',
    class:          '12th',
    board:          'CBSE',
    subjects:       ['Physics', 'Mathematics'],
    preferredTutor: 'Male',
    area:           'HSR Layout',
    pincode:        '560102',
    budgetPerMonth: 7000,
    preferredTimings: 'Evening 6–8 PM',
    comments:       'JEE preparation. Need experienced tutor.',
    status:         'approved',
    accessFee:      10000,
  },
  {
    parentName:     'Anita Singh',
    parentPhone:    '9812345678',
    parentEmail:    'anita@example.com',
    studentName:    'Riya Singh',
    class:          '6th',
    board:          'ICSE',
    subjects:       ['English', 'Hindi', 'Mathematics'],
    preferredTutor: 'Female',
    area:           'Marathahalli',
    pincode:        '560037',
    budgetPerMonth: 4500,
    preferredTimings: 'Weekend mornings',
    comments:       'Looking for a tutor who can engage well with kids.',
    status:         'approved',
    accessFee:      10000,
  },
  {
    parentName:     'Venkat Rao',
    parentPhone:    '9756789012',
    parentEmail:    'venkat@example.com',
    studentName:    'Akash Rao',
    class:          '9th',
    board:          'CBSE',
    subjects:       ['Mathematics', 'Physics', 'Chemistry'],
    preferredTutor: 'Anyone',
    area:           'Electronic City',
    pincode:        '560100',
    budgetPerMonth: 5500,
    preferredTimings: 'Evening 5–7 PM',
    comments:       'Science stream preparation for 10th.',
    status:         'approved',
    accessFee:      10000,
  },
  {
    parentName:     'Kavita Joshi',
    parentPhone:    '9632145678',
    parentEmail:    'kavita@example.com',
    studentName:    'Tanvi Joshi',
    class:          '3rd',
    board:          'CBSE',
    subjects:       ['English', 'Mathematics'],
    preferredTutor: 'Female',
    area:           'Jayanagar',
    pincode:        '560041',
    budgetPerMonth: 3000,
    preferredTimings: 'Evening 4–5 PM',
    comments:       'Basic concepts strengthening needed.',
    status:         'approved',
    accessFee:      10000,
  },
  {
    parentName:     'Mohan Das',
    parentPhone:    '9523456789',
    parentEmail:    'mohan@example.com',
    studentName:    'Rahul Das',
    class:          '11th',
    board:          'CBSE',
    subjects:       ['Accountancy', 'Economics'],
    preferredTutor: 'Anyone',
    area:           'BTM Layout',
    pincode:        '560076',
    budgetPerMonth: 6500,
    preferredTimings: 'Morning 7–9 AM',
    comments:       'Commerce stream. Need experienced teacher.',
    status:         'approved',
    accessFee:      10000,
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Get admin id for reviewedBy field
    const admin = await Admin.findOne({ email: 'admin@wantedtutors.com' });

    // Clear existing sample listings (only approved ones without real parent data)
    await Enquiry.deleteMany({ status: 'approved' });
    console.log('🗑️  Cleared existing approved listings');

    // Add reviewedBy and reviewedAt
    const listings = sampleListings.map(l => ({
      ...l,
      reviewedBy: admin?._id,
      reviewedAt: new Date(),
    }));

    await Enquiry.insertMany(listings);
    console.log(`✅ Inserted ${listings.length} sample approved listings`);

    console.log('');
    console.log('Now tutors can browse listings at:');
    console.log('  http://localhost:3000/tutor/listings');
    console.log('');

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
