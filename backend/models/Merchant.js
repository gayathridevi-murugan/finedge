const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Merchant = sequelize.define('Merchant', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  merchant_id: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  business_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  business_type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  business_email: {
    type: DataTypes.STRING,
    allowNull: true
  },
  business_phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  owner_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  owner_email: {
    type: DataTypes.STRING,
    allowNull: true
  },
  owner_phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED', 'ACTIVE'),
    defaultValue: 'PENDING'
  },
  surfboard_merchant_id: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
    comment: 'Merchant ID from Surfboard API'
  },
  surfboard_status: {
    type: DataTypes.ENUM('NOT_REGISTERED', 'REGISTERED', 'VERIFIED', 'ACTIVE'),
    defaultValue: 'NOT_REGISTERED'
  },
  bank_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  account_holder: {
    type: DataTypes.STRING,
    allowNull: true
  },
  account_number_last4: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Last 4 digits of account number for security'
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
  tableName: 'merchants',
  timestamps: true,
  underscored: true
});

module.exports = Merchant;
