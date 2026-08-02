const express = require('express');
const router = express.Router();
const { SecurityTag, Order, OrderItem, Product, NFCTag, Cart, CartItem, Payment, Receipt, ExitVerification, sequelize } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');

// Debug endpoint to check security tag statuses for an order
router.get('/order/:order_id/security-tags', asyncHandler(async (req, res) => {
  const { order_id } = req.params;

  const order = await Order.findByPk(order_id, {
    include: [{ model: OrderItem, as: 'items' }]
  });

  if (!order) {
    return res.status(404).json({
      success: false,
      error: { message: 'Order not found' }
    });
  }

  const itemsWithTags = [];
  for (const item of order.items || []) {
    const tag = await SecurityTag.findOne({
      where: { product_id: item.product_id }
    });

    itemsWithTags.push({
      product_id: item.product_id,
      security_tag_id: tag?.id,
      security_tag_status: tag?.status || 'NO_TAG'
    });
  }

  res.json({
    success: true,
    data: {
      order_id: order.id,
      order_payment_status: order.payment_status,
      items_count: order.items?.length || 0,
      items_with_tags: itemsWithTags
    }
  });
}));

// Reset demo - clear all data and reseed
router.post('/reset-demo', asyncHandler(async (req, res) => {
  try {
    console.log('🔄 Starting demo reset...');

    // Delete all data without truncate (respects foreign keys)
    await ExitVerification.destroy({ where: {} });
    await CartItem.destroy({ where: {} });
    await Cart.destroy({ where: {} });
    await OrderItem.destroy({ where: {} });
    await Order.destroy({ where: {} });
    await Payment.destroy({ where: {} });
    await Receipt.destroy({ where: {} });
    await NFCTag.destroy({ where: {} });
    await SecurityTag.destroy({ where: {} });
    await Product.destroy({ where: {} });

    console.log('🗑️  Cleared all tables');

    // Reseed products
    const products = [
      { name: 'Premium Cotton T-Shirt', brand: 'UrbanWear', category: 'Clothing', subcategory: 'T-Shirts', description: 'Comfortable 100% cotton t-shirt', price: 999, stock: 45, size: 'M', color: 'Black', material: '100% Cotton', sku: 'TSHIRT-001-BLK', rating: 4.7, review_count: 156 },
      { name: 'Slim Fit Black Jeans', brand: 'ModernFit', category: 'Clothing', subcategory: 'Jeans', description: 'Sleek black jeans with comfortable stretch', price: 2299, stock: 27, size: '34', color: 'Black', material: '97% Cotton, 3% Elastane', sku: 'JEANS-002-BLK', rating: 4.6, review_count: 218 },
      { name: 'UV Protected Sunglasses', brand: 'VisionCare', category: 'Accessories', subcategory: 'Sunglasses', description: 'Stylish sunglasses with 100% UV protection', price: 1899, stock: 44, size: 'One Size', color: 'Black Frame', material: 'Plastic frame', sku: 'SUNGLASS-001-BLK', rating: 4.7, review_count: 256 },
      { name: 'Cotton Baseball Cap', brand: 'ClassyWear', category: 'Accessories', subcategory: 'Hats', description: 'Classic cotton baseball cap', price: 699, stock: 60, size: 'One Size', color: 'Black', material: '100% Cotton twill', sku: 'CAP-001-BLK', rating: 4.5, review_count: 87 },
      { name: 'Leather Crossbody Bag', brand: 'BagCraft', category: 'Accessories', subcategory: 'Bags', description: 'Premium leather crossbody bag', price: 4299, stock: 19, size: 'Medium', color: 'Tan Brown', material: '100% Genuine Leather', sku: 'BAG-001-TAN', rating: 4.9, review_count: 203 },
      { name: 'Windproof Jacket', brand: 'OutdoorGear', category: 'Clothing', subcategory: 'Jackets', description: 'Lightweight windproof jacket', price: 2899, stock: 22, size: 'M', color: 'Navy', material: 'Nylon with fleece lining', sku: 'JACKET-001-NVY', rating: 4.8, review_count: 289 }
    ];

    const createdProducts = await Product.bulkCreate(products);
    console.log(`📦 Created ${createdProducts.length} products`);

    // Reseed NFC tags
    const nfcTags = createdProducts.map((product, index) => ({
      tag_id: `NFC-DEMO-${String(index + 1).padStart(3, '0')}-${product.sku}`,
      product_id: product.id,
      status: 'ACTIVE',
      scan_count: 0
    }));
    await NFCTag.bulkCreate(nfcTags);
    console.log(`🏷️  Created ${nfcTags.length} NFC tags`);

    // Reseed security tags
    const securityTags = createdProducts.map((product, index) => ({
      tag_id: `SEC-DEMO-${String(index + 1).padStart(3, '0')}-${product.sku}`,
      product_id: product.id,
      status: 'ACTIVE'
    }));
    await SecurityTag.bulkCreate(securityTags);
    console.log(`🔒 Created ${securityTags.length} security tags`);

    res.json({
      success: true,
      message: 'Demo reset successfully',
      data: {
        products_created: createdProducts.length,
        nfc_tags_created: nfcTags.length,
        security_tags_created: securityTags.length
      }
    });
  } catch (error) {
    console.error('❌ Reset failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}));

// Simulate a complete transaction with NFC scans and exit verification
router.post('/simulate-transaction', asyncHandler(async (req, res) => {
  try {
    console.log('📊 Simulating complete transaction...');

    const { nfcService } = require('../services');
    const { exitSecurityService } = require('../services');

    // Get available NFC tags
    const availableTags = await NFCTag.findAll({ limit: 3 });

    if (availableTags.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No NFC tags available. Run reset-demo first.'
      });
    }

    // Simulate NFC scans
    const scannedProducts = [];
    for (const tag of availableTags) {
      try {
        const { nfcTag, product } = await nfcService.scanNFCTag(tag.tag_id);
        scannedProducts.push(product);
        console.log(`✓ Scanned: ${product.name}`);
      } catch (error) {
        console.warn(`⚠ Failed to scan ${tag.tag_id}:`, error.message);
      }
    }

    // Create order
    const order = await Order.create({
      order_number: `ORD-${Date.now()}`,
      payment_status: 'PAID',
      total_amount: scannedProducts.reduce((sum, p) => sum + parseFloat(p.price), 0),
      delivery_status: 'PENDING'
    });

    // Add items to order
    for (const product of scannedProducts) {
      const itemPrice = parseFloat(product.price);
      const itemTotal = itemPrice;
      const itemTax = itemTotal * 0.1;
      await OrderItem.create({
        order_id: order.id,
        product_id: product.id,
        quantity: 1,
        unit_price: itemPrice,
        subtotal: itemTotal,
        tax_amount: itemTax,
        total_price: itemTotal + itemTax
      });
    }

    // Create payment record
    await Payment.create({
      order_id: order.id,
      amount: order.total_amount,
      status: 'CAPTURED',
      payment_method: 'CREDIT_CARD',
      transaction_id: `TXN-${Date.now()}`
    });

    // Create exit verification
    const exitVerification = await ExitVerification.create({
      order_id: order.id,
      exit_status: 'APPROVED',
      gate_status: 'GREEN',
      unpaid_items: JSON.stringify([])
    });

    console.log('✅ Transaction simulated successfully');

    res.json({
      success: true,
      message: 'Complete transaction simulated',
      data: {
        order_id: order.id,
        order_number: order.order_number,
        products_scanned: scannedProducts.length,
        total_amount: order.total_amount,
        payment_status: 'PAID',
        exit_status: 'APPROVED',
        metrics_updated: {
          productsScanned: availableTags.length,
          ordersCreated: 1,
          exitEventRecorded: true
        }
      }
    });
  } catch (error) {
    console.error('❌ Simulation failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}));

module.exports = router;
