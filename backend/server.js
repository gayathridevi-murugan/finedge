require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { sequelize } = require('./models');
const { errorHandler } = require('./middleware/errorHandler');

// Import routes
const cartRoutes = require('./routes/cart');
const nfcRoutes = require('./routes/nfc');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payments');
const receiptRoutes = require('./routes/receipts');
const loyaltyRoutes = require('./routes/loyalty');
const exitRoutes = require('./routes/exit');
const simulatorRoutes = require('./routes/simulator');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Queue-Free Checkout Backend is running',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/cart', cartRoutes);
app.use('/api/nfc', nfcRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/exit', exitRoutes);
app.use('/api/simulator', simulatorRoutes);

// Error handler
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    console.log('🔄 Syncing database...');
    await sequelize.sync({ force: false, alter: true });
    console.log('✅ Database synchronized');

    app.listen(PORT, () => {
      console.log(`🚀 Queue-Free Checkout Backend running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;
