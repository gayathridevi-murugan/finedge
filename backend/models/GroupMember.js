const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GroupMember = sequelize.define('GroupMember', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  group_session_id: { type: DataTypes.UUID, allowNull: false },
  member_number: { type: DataTypes.INTEGER, allowNull: false },
  member_name: { type: DataTypes.STRING(255), allowNull: true },
  customer_id: { type: DataTypes.UUID, allowNull: true },
  cart_id: { type: DataTypes.UUID, allowNull: true },
  order_id: { type: DataTypes.UUID, allowNull: true },
  assigned_products: { type: DataTypes.JSONB, defaultValue: [] },
  status: { type: DataTypes.STRING(50), defaultValue: 'PENDING' },
  payment_status: { type: DataTypes.ENUM('PENDING', 'PAID', 'UNPAID'), defaultValue: 'UNPAID' },
  payment_amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  surfboard_payment_id: { type: DataTypes.STRING(255), allowNull: true }
}, { timestamps: true, tableName: 'group_members' });

module.exports = GroupMember;
