const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * One row per tap.
 *
 * nfc_tags carries a lifetime scan_count and only the most recent
 * last_scanned_at, so it cannot answer "how many scans happened today" - a tag
 * tapped once today but 18 times in total still reports 18. This table records
 * each scan as its own event so per-period counts are exact.
 */
const NFCScanEvent = sequelize.define('NFCScanEvent', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  nfc_tag_id: { type: DataTypes.UUID, allowNull: true },
  product_id: { type: DataTypes.UUID, allowNull: true },
  tag_code: { type: DataTypes.STRING(255), allowNull: true },
  scanned_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
}, {
  timestamps: true,
  tableName: 'nfc_scan_events',
  indexes: [{ fields: ['scanned_at'] }]
});

module.exports = NFCScanEvent;
