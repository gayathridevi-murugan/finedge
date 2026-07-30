const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ExitVerification = sequelize.define('ExitVerification', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  order_id: { type: DataTypes.UUID, allowNull: false },
  exit_status: { type: DataTypes.ENUM('PENDING', 'APPROVED', 'BLOCKED'), defaultValue: 'PENDING' },
  gate_status: { type: DataTypes.ENUM('GREEN', 'RED', 'YELLOW'), defaultValue: 'RED' },
  simulation_note: { type: DataTypes.STRING, defaultValue: 'Software simulation - not physical gate' },
  unpaid_items: { type: DataTypes.JSONB, defaultValue: [] },
  security_tag_statuses: { type: DataTypes.JSONB, defaultValue: {} }
}, { timestamps: true, tableName: 'exit_verifications' });

module.exports = ExitVerification;
