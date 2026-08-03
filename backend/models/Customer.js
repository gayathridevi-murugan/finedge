const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Customer = sequelize.define('Customer', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, unique: 'customer_email_unique', allowNull: false },
  password_hash: DataTypes.STRING,
  phone: DataTypes.STRING,
  address: DataTypes.STRING,
  loyalty_points: { type: DataTypes.INTEGER, defaultValue: 0 },
  tier: { type: DataTypes.ENUM('SILVER', 'GOLD', 'PLATINUM'), defaultValue: 'SILVER' },
  total_spent: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 }
}, { timestamps: true, tableName: 'customers' });

module.exports = Customer;
