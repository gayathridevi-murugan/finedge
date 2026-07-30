const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  order_number: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  customer_id: DataTypes.UUID,
  total_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  payment_status: { type: DataTypes.ENUM('PENDING', 'PAID', 'FAILED'), defaultValue: 'PENDING' },
  security_status: { type: DataTypes.ENUM('ACTIVE', 'DEACTIVATED'), defaultValue: 'ACTIVE' },
  exit_status: { type: DataTypes.ENUM('PENDING', 'APPROVED', 'BLOCKED'), defaultValue: 'PENDING' },
  transaction_id: DataTypes.STRING
}, { timestamps: true, tableName: 'orders' });

module.exports = Order;
