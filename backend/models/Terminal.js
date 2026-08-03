const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Terminal = sequelize.define('Terminal', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  terminal_id: {
    type: DataTypes.STRING,
    unique: 'terminal_id_unique',
    allowNull: false
  },
  merchant_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'merchants',
      key: 'id'
    }
  },
  terminal_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  terminal_type: {
    type: DataTypes.ENUM('NFC_SELF_CHECKOUT', 'SMART_NFC_SHOPPING', 'KIOSK', 'MOBILE'),
    defaultValue: 'NFC_SELF_CHECKOUT'
  },
  status: {
    type: DataTypes.ENUM('OFFLINE', 'ONLINE', 'ERROR', 'MAINTENANCE'),
    defaultValue: 'ONLINE'
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true
  },
  ip_address: {
    type: DataTypes.STRING,
    allowNull: true
  },
  mac_address: {
    type: DataTypes.STRING,
    allowNull: true
  },
  surfboard_terminal_id: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: 'surfboard_terminal_id_unique',
    comment: 'Terminal ID from Surfboard API'
  },
  nfc_reader_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  security_gate_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  total_transactions: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  total_revenue: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00
  },
  last_online_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'terminals',
  timestamps: true,
  underscored: true
});

module.exports = Terminal;
