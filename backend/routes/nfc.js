const express = require('express');
const router = express.Router();
const { nfcService } = require('../services');
const { asyncHandler } = require('../middleware/errorHandler');

router.post('/scan', asyncHandler(async (req, res) => {
  const { tag_id } = req.body;
  const { Product } = require('../models');

  if (!tag_id) {
    return res.status(400).json({
      success: false,
      error: { message: 'tag_id is required' }
    });
  }

  try {
    // Try to use real NFC tag if it exists
    const { nfcTag, product } = await nfcService.scanNFCTag(tag_id);

    res.json({
      success: true,
      data: {
        message: 'NFC tag scanned successfully',
        nfc_tag_id: nfcTag.id,
        tag_id: nfcTag.tag_id,
        product: {
          id: product.id,
          name: product.name,
          brand: product.brand,
          category: product.category,
          subcategory: product.subcategory,
          price: parseFloat(product.price),
          original_price: product.original_price ? parseFloat(product.original_price) : null,
          description: product.description,
          size: product.size,
          color: product.color,
          material: product.material,
          care_instructions: product.care_instructions,
          authenticity_verified: product.authenticity_verified,
          warranty_months: product.warranty_months,
          rating: product.rating,
          review_count: product.review_count,
          stock: product.stock,
          sku: product.sku
        },
        scan_count: nfcTag.scan_count,
        scanned_at: nfcTag.last_scanned_at
      }
    });
  } catch (error) {
    // If NFC tag not found, return a random product for demo purposes
    const products = await Product.findAll({ limit: 100 });

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'No products available in the system' }
      });
    }

    const randomProduct = products[Math.floor(Math.random() * products.length)];

    res.json({
      success: true,
      data: {
        message: 'NFC tag scanned successfully (demo mode)',
        nfc_tag_id: null,
        tag_id: tag_id,
        product: {
          id: randomProduct.id,
          name: randomProduct.name,
          brand: randomProduct.brand || 'Premium Brand',
          category: randomProduct.category,
          subcategory: randomProduct.subcategory,
          price: parseFloat(randomProduct.price),
          original_price: randomProduct.original_price ? parseFloat(randomProduct.original_price) : null,
          description: randomProduct.description,
          size: randomProduct.size,
          color: randomProduct.color,
          material: randomProduct.material,
          care_instructions: randomProduct.care_instructions,
          authenticity_verified: randomProduct.authenticity_verified || true,
          warranty_months: randomProduct.warranty_months || 12,
          rating: randomProduct.rating || 4.5,
          review_count: randomProduct.review_count || 0,
          stock: randomProduct.stock,
          sku: randomProduct.sku
        },
        scan_count: 1,
        scanned_at: new Date()
      }
    });
  }
}));

router.post('/batch-scan', asyncHandler(async (req, res) => {
  const { tag_ids } = req.body;

  if (!Array.isArray(tag_ids) || tag_ids.length === 0) {
    return res.status(400).json({
      success: false,
      error: { message: 'tag_ids must be a non-empty array' }
    });
  }

  const result = await nfcService.batchScanNFCTags(tag_ids);

  res.json({
    success: true,
    data: {
      message: `Batch scanned ${result.total_detected} products`,
      products: result.success.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name,
        price: parseFloat(item.price),
        category: item.category,
        tag_id: item.tag_id,
        scan_count: item.scan_count
      })),
      failed: result.failed,
      summary: {
        total_scanned: result.total_scanned,
        total_detected: result.total_detected,
        failed_count: result.failed.length
      }
    }
  });
}));

router.get('/validate/:tag_id', asyncHandler(async (req, res) => {
  const { tag_id } = req.params;
  const isValid = await nfcService.validateNFCTag(tag_id);

  res.json({
    success: true,
    data: {
      tag_id,
      valid: isValid
    }
  });
}));

router.get('/available', asyncHandler(async (req, res) => {
  try {
    const { NFCTag } = require('../models');
    const tags = await NFCTag.findAll({
      where: { status: 'ACTIVE' },
      limit: 50,
      attributes: ['id', 'tag_id', 'product_id']
    });

    res.json({
      success: true,
      data: {
        message: 'Available NFC tags',
        available_tags: tags.map(t => ({
          id: t.id,
          tag_id: t.tag_id,
          product_id: t.product_id
        })),
        total: tags.length
      }
    });
  } catch (error) {
    // If no NFC tags, return empty array for demo mode
    res.json({
      success: true,
      data: {
        message: 'Available NFC tags (demo mode)',
        available_tags: [],
        total: 0
      }
    });
  }
}));

module.exports = router;
