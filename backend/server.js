require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { sequelize } = require('./models');
const { errorHandler } = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const productsRoutes = require('./routes/products');
const customersRoutes = require('./routes/customers');
const cartRoutes = require('./routes/cart');
const nfcRoutes = require('./routes/nfc');
const nfcDemoRoutes = require('./routes/nfc-demo');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payments');
const receiptRoutes = require('./routes/receipts');
const loyaltyRoutes = require('./routes/loyalty');
const exitRoutes = require('./routes/exit');
const simulatorRoutes = require('./routes/simulator');
const demoCheckoutRoutes = require('./routes/demo-checkout');
const debugRoutes = require('./routes/debug');
const operationsRoutes = require('./routes/operations');
const merchantRoutes = require('./routes/merchants');
const terminalRoutes = require('./routes/terminals');
const demoPaymentRoutes = require('./routes/demo-payment');
const dashboardRoutes = require('./routes/dashboard');
const groupShoppingRoutes = require('./routes/group-shopping');

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
    message: 'SELF CHECKOUT Backend is running',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/nfc', nfcRoutes);
app.use('/api/nfc-demo', nfcDemoRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/exit', exitRoutes);
app.use('/api/simulator', simulatorRoutes);
app.use('/api/demo', demoCheckoutRoutes);
app.use('/api/debug', debugRoutes);
app.use('/api/operations', operationsRoutes);
app.use('/api/merchants', merchantRoutes);
app.use('/api/terminals', terminalRoutes);
app.use('/api/demo-payment', demoPaymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/group-shopping', groupShoppingRoutes);

// Error handler
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    console.log('🔄 Syncing database...');
    await sequelize.sync({ force: false, alter: false });
    console.log('✅ Database synchronized');

    app.listen(PORT, () => {
      console.log(`🚀 SELF CHECKOUT Backend running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;
