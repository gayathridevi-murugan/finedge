const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GroupMember = sequelize.define('GroupMember', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  group_session_id: { type: DataTypes.UUID, allowNull: false },
  member_name: { type: DataTypes.STRING(255), allowNull: true },
  customer_id: { type: DataTypes.UUID, allowNull: true },
  assigned_products: { type: DataTypes.JSONB, defaultValue: [] },
  status: { type: DataTypes.STRING(50), defaultValue: 'PENDING' },
  payment_status: { type: DataTypes.ENUM('PENDING', 'PAID', 'UNPAID'), defaultValue: 'UNPAID' },
  surfboard_payment_id: { type: DataTypes.STRING(255), allowNull: true }
}, { timestamps: true, tableName: 'group_members' });

module.exports = GroupMember;
