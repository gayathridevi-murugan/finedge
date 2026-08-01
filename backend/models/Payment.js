const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payment = sequelize.define('Payment', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  order_id: { type: DataTypes.UUID, allowNull: false },
  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  status: {
    type: DataTypes.ENUM('PENDING', 'CAPTURED', 'FAILED', 'REFUNDED'),
    defaultValue: 'PENDING'
  },
  payment_method: { type: DataTypes.STRING, defaultValue: 'CREDIT_CARD' },
  transaction_id: DataTypes.STRING,
  payment_gateway: { type: DataTypes.STRING, defaultValue: 'SURFBOARD' },
  error_message: DataTypes.STRING,
  refund_reason: DataTypes.STRING
}, { timestamps: true, tableName: 'payments' });

module.exports = Payment;
