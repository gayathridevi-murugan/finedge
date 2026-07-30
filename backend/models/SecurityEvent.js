const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SecurityEvent = sequelize.define('SecurityEvent', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  order_id: { type: DataTypes.UUID, allowNull: false },
  event_type: { type: DataTypes.STRING, allowNull: false },
  status: DataTypes.STRING,
  description: DataTypes.TEXT,
  triggered_by: DataTypes.STRING
}, { timestamps: true, tableName: 'security_events' });

module.exports = SecurityEvent;
