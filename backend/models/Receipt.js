const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Receipt = sequelize.define('Receipt', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  order_id: { type: DataTypes.UUID, allowNull: false },
  receipt_number: { type: DataTypes.STRING(50), unique: true },
  customer_id: DataTypes.UUID,
  subtotal: { type: DataTypes.DECIMAL(10, 2) },
  tax: { type: DataTypes.DECIMAL(10, 2) },
  total_amount: { type: DataTypes.DECIMAL(10, 2) },
  loyalty_points_earned: { type: DataTypes.INTEGER, defaultValue: 0 },
  format: { type: DataTypes.STRING, defaultValue: 'DIGITAL' }
}, { timestamps: true, tableName: 'receipts' });

module.exports = Receipt;
