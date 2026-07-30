const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Loyalty = sequelize.define('Loyalty', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  customer_id: { type: DataTypes.UUID, allowNull: false },
  order_id: DataTypes.UUID,
  transaction_type: { type: DataTypes.ENUM('EARNED', 'REDEEMED'), allowNull: false },
  points: { type: DataTypes.INTEGER, allowNull: false },
  description: DataTypes.STRING
}, { timestamps: true, tableName: 'loyalty_transactions' });

module.exports = Loyalty;
