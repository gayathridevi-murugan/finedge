const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GroupSession = sequelize.define('GroupSession', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  session_code: { type: DataTypes.STRING(50), unique: true, allowNull: false },
  leader_customer_id: { type: DataTypes.UUID, allowNull: false },
  order_id: DataTypes.UUID,
  member_count: { type: DataTypes.INTEGER, defaultValue: 1 },
  total_amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  split_status: { type: DataTypes.ENUM('PENDING', 'PARTIALLY_PAID', 'FULLY_PAID'), defaultValue: 'PENDING' }
}, { timestamps: true, tableName: 'group_sessions' });

module.exports = GroupSession;
