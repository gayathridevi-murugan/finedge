const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GroupMember = sequelize.define('GroupMember', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  group_session_id: { type: DataTypes.UUID, allowNull: false },
  customer_id: { type: DataTypes.UUID, allowNull: false },
  items_added: { type: DataTypes.JSONB, defaultValue: [] },
  amount_owed: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  payment_status: { type: DataTypes.ENUM('PENDING', 'PAID', 'PARTIALLY_PAID'), defaultValue: 'PENDING' },
  payment_method: DataTypes.STRING
}, { timestamps: true, tableName: 'group_members' });

module.exports = GroupMember;
