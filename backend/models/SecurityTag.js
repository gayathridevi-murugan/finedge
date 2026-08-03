const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SecurityTag = sequelize.define('SecurityTag', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tag_id: { type: DataTypes.STRING(100), allowNull: false, unique: 'security_tag_id_unique' },
  product_id: { type: DataTypes.UUID, allowNull: false },
  status: { type: DataTypes.ENUM('ACTIVE', 'DEACTIVATED'), defaultValue: 'ACTIVE' },
  tag_type: DataTypes.STRING
}, { timestamps: true, tableName: 'security_tags' });

module.exports = SecurityTag;
