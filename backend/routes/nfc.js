const express = require('express');
const router = express.Router();
const { nfcService } = require('../services');
const { asyncHandler } = require('../middleware/errorHandler');

router.post('/scan', asyncHandler(async (req, res) => {
  const { tag_id } = req.body;

  if (!tag_id) {
    return res.status(400).json({
      success: false,
      error: { message: 'tag_id is required' }
    });
  }

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
        category: product.category,
        price: parseFloat(product.price),
        description: product.description,
        stock: product.stock
      },
      scan_count: nfcTag.scan_count,
      scanned_at: nfcTag.last_scanned_at
    }
  });
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

module.exports = router;
