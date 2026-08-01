const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GroupSession = sequelize.define('GroupSession', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  group_name: { type: DataTypes.STRING(255), allowNull: true },
  total_members: { type: DataTypes.INTEGER, defaultValue: 1 },
  status: { type: DataTypes.STRING(50), defaultValue: 'ACTIVE' },
  order_id: { type: DataTypes.UUID, allowNull: true },
  total_amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  split_status: { type: DataTypes.ENUM('PENDING', 'PARTIALLY_PAID', 'FULLY_PAID'), defaultValue: 'PENDING' }
}, { timestamps: true, tableName: 'group_sessions' });

module.exports = GroupSession;
