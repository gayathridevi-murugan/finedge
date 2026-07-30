const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NFCTag = sequelize.define('NFCTag', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tag_id: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  product_id: { type: DataTypes.UUID, allowNull: false },
  status: { type: DataTypes.ENUM('ACTIVE', 'INACTIVE'), defaultValue: 'ACTIVE' },
  scan_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  last_scanned_at: DataTypes.DATE,
  encoding_type: DataTypes.STRING,
  memory_size: DataTypes.INTEGER
}, { timestamps: true, tableName: 'nfc_tags' });

module.exports = NFCTag;
