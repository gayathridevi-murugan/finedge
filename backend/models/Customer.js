const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Customer = sequelize.define('Customer', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, unique: true },
  phone: DataTypes.STRING,
  loyalty_points: { type: DataTypes.INTEGER, defaultValue: 0 },
  loyalty_tier: { type: DataTypes.ENUM('SILVER', 'GOLD', 'PLATINUM'), defaultValue: 'SILVER' }
}, { timestamps: true, tableName: 'customers' });

module.exports = Customer;
