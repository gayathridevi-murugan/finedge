const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Cart = sequelize.define('Cart', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  customer_id: { type: DataTypes.UUID, allowNull: true },
  session_id: { type: DataTypes.STRING(100), unique: 'cart_session_id_unique', allowNull: true },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'COMPLETED', 'ABANDONED'),
    defaultValue: 'ACTIVE'
  },
  total_amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  expires_at: DataTypes.DATE
}, { timestamps: true, tableName: 'carts' });

module.exports = Cart;
