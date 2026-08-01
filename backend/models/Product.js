const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  brand: DataTypes.STRING,
  category: DataTypes.STRING,
  subcategory: DataTypes.STRING,
  description: DataTypes.TEXT,
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  original_price: DataTypes.DECIMAL(10, 2),
  stock: { type: DataTypes.INTEGER, defaultValue: 0 },
  image_url: DataTypes.STRING,
  size: DataTypes.STRING,
  color: DataTypes.STRING,
  material: DataTypes.STRING,
  care_instructions: DataTypes.TEXT,
  authenticity_verified: { type: DataTypes.BOOLEAN, defaultValue: true },
  warranty_months: { type: DataTypes.INTEGER, defaultValue: 12 },
  sku: DataTypes.STRING,
  rating: { type: DataTypes.DECIMAL(3, 2), defaultValue: 4.5 },
  review_count: { type: DataTypes.INTEGER, defaultValue: 0 }
}, { timestamps: true, tableName: 'products' });

module.exports = Product;
