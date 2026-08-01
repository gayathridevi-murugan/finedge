const express = require('express');
const router = express.Router();
const { Product } = require('../models');
const { authenticateToken } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');
const { Op } = require('sequelize');

// Get all products with pagination and filtering
router.get('/', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, category, search } = req.query;
  const offset = (page - 1) * limit;

  const where = {};
  if (category) where.category = category;
  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } }
    ];
  }

  const { count, rows } = await Product.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['createdAt', 'DESC']]
  });

  res.json({
    success: true,
    data: {
      products: rows.map(p => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        category: p.category,
        subcategory: p.subcategory,
        description: p.description,
        price: parseFloat(p.price),
        original_price: p.original_price ? parseFloat(p.original_price) : null,
        stock: p.stock,
        size: p.size,
        color: p.color,
        material: p.material,
        rating: p.rating,
        review_count: p.review_count,
        image_url: p.image_url
      })),
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    }
  });
}));

// Get product by ID
router.get('/:product_id', asyncHandler(async (req, res) => {
  const { product_id } = req.params;
  const product = await Product.findByPk(product_id);

  if (!product) {
    return res.status(404).json({
      success: false,
      error: { message: 'Product not found' }
    });
  }

  res.json({
    success: true,
    data: {
      product: {
        id: product.id,
        name: product.name,
        brand: product.brand,
        category: product.category,
        subcategory: product.subcategory,
        description: product.description,
        price: parseFloat(product.price),
        original_price: product.original_price ? parseFloat(product.original_price) : null,
        stock: product.stock,
        size: product.size,
        color: product.color,
        material: product.material,
        care_instructions: product.care_instructions,
        authenticity_verified: product.authenticity_verified,
        warranty_months: product.warranty_months,
        rating: product.rating,
        review_count: product.review_count,
        sku: product.sku,
        image_url: product.image_url
      }
    }
  });
}));

// Create product (admin only - requires auth)
router.post('/', authenticateToken, asyncHandler(async (req, res) => {
  const { name, category, description, price, stock, image_url } = req.body;

  if (!name || !price) {
    return res.status(400).json({
      success: false,
      error: { message: 'name and price are required' }
    });
  }

  const product = await Product.create({
    name,
    category: category || 'General',
    description: description || '',
    price: parseFloat(price),
    stock: stock || 0,
    image_url: image_url || null
  });

  res.status(201).json({
    success: true,
    data: {
      message: 'Product created successfully',
      product: {
        id: product.id,
        name: product.name,
        category: product.category,
        price: parseFloat(product.price),
        stock: product.stock
      }
    }
  });
}));

// Update product (admin only)
router.put('/:product_id', authenticateToken, asyncHandler(async (req, res) => {
  const { product_id } = req.params;
  const { name, category, description, price, stock, image_url } = req.body;

  const product = await Product.findByPk(product_id);
  if (!product) {
    return res.status(404).json({
      success: false,
      error: { message: 'Product not found' }
    });
  }

  if (name) product.name = name;
  if (category) product.category = category;
  if (description) product.description = description;
  if (price) product.price = parseFloat(price);
  if (stock !== undefined) product.stock = stock;
  if (image_url) product.image_url = image_url;

  await product.save();

  res.json({
    success: true,
    data: {
      message: 'Product updated successfully',
      product: {
        id: product.id,
        name: product.name,
        category: product.category,
        price: parseFloat(product.price),
        stock: product.stock
      }
    }
  });
}));

// Delete product (admin only)
router.delete('/:product_id', authenticateToken, asyncHandler(async (req, res) => {
  const { product_id } = req.params;

  const product = await Product.findByPk(product_id);
  if (!product) {
    return res.status(404).json({
      success: false,
      error: { message: 'Product not found' }
    });
  }

  await product.destroy();

  res.json({
    success: true,
    data: {
      message: 'Product deleted successfully',
      product_id: product_id
    }
  });
}));

// Search products
router.get('/search', asyncHandler(async (req, res) => {
  const { q, category } = req.query;

  if (!q) {
    return res.status(400).json({
      success: false,
      error: { message: 'Search query required' }
    });
  }

  const where = {
    [Op.or]: [
      { name: { [Op.iLike]: `%${q}%` } },
      { description: { [Op.iLike]: `%${q}%` } }
    ]
  };

  if (category) where.category = category;

  const products = await Product.findAll({
    where,
    limit: 20
  });

  res.json({
    success: true,
    data: {
      query: q,
      products: products.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        price: parseFloat(p.price),
        stock: p.stock
      })),
      total: products.length
    }
  });
}));

module.exports = router;
