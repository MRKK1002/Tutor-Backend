require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./src/config/db');
const errorHandler = require('./src/middleware/errorHandler');
const { seedAdmin } = require('./src/controllers/adminController');

const app = express();

// Connect DB and seed default admin
connectDB().then(() => seedAdmin());

// Security
app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    process.env.CLIENT_URL,
  ].filter(Boolean),
  credentials: true,
}));

// Razorpay webhook needs raw body — must come BEFORE express.json()
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Dev logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',      require('./src/routes/authRoutes'));
app.use('/api/enquiries', require('./src/routes/enquiryRoutes'));
app.use('/api/payments',  require('./src/routes/paymentRoutes'));
app.use('/api/admin',     require('./src/routes/adminRoutes'));

// Health check
app.get('/api/health', (req, res) => res.json({ success: true, message: '🚀 WantedTutors API running' }));

// 404
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});
