const { Product, NFCTag } = require('../models');

const DEMO_PRODUCTS = {
  'DEMO_0001': { name: 'Organic Milk 1L', price: 3.99, category: 'Dairy' },
  'DEMO_0002': { name: 'Whole Wheat Bread', price: 2.50, category: 'Bakery' },
  'DEMO_0003': { name: 'Butter 250g', price: 4.50, category: 'Dairy' },
  'DEMO_0004': { name: 'Apple Juice 500ml', price: 2.99, category: 'Beverages' },
  'DEMO_0005': { name: 'Cheddar Cheese', price: 5.99, category: 'Dairy' },
  'DEMO_0006': { name: 'Eggs (12 pack)', price: 3.49, category: 'Dairy' },
  'DEMO_0007': { name: 'Greek Yogurt 500g', price: 4.29, category: 'Dairy' },
  'DEMO_0008': { name: 'Tomato Soup', price: 1.99, category: 'Pantry' }
};

class NFCService {
  async scanNFCTag(tagId) {
    let nfcTag = await NFCTag.findOne({ where: { tag_id: tagId } });

    if (!nfcTag) {
      if (!DEMO_PRODUCTS[tagId]) {
        throw new Error(`NFC tag not found: ${tagId}`);
      }

      const product = await Product.create({
        name: DEMO_PRODUCTS[tagId].name,
        category: DEMO_PRODUCTS[tagId].category,
        price: DEMO_PRODUCTS[tagId].price,
        stock: 100
      });

      nfcTag = await NFCTag.create({
        tag_id: tagId,
        product_id: product.id,
        status: 'ACTIVE',
        scan_count: 1
      });

      return { nfcTag, product };
    }

    nfcTag.scan_count = (nfcTag.scan_count || 0) + 1;
    nfcTag.last_scanned_at = new Date();
    await nfcTag.save();

    const product = await Product.findByPk(nfcTag.product_id);
    return { nfcTag, product };
  }

  async batchScanNFCTags(tagIds) {
    if (!Array.isArray(tagIds) || tagIds.length === 0) {
      throw new Error('tagIds must be a non-empty array');
    }

    const results = [];
    const errors = [];

    for (const tagId of tagIds) {
      try {
        const { nfcTag, product } = await this.scanNFCTag(tagId);
        results.push({
          tag_id: tagId,
          product_id: product.id,
          product_name: product.name,
          price: product.price,
          category: product.category,
          nfc_tag_id: nfcTag.id,
          scan_count: nfcTag.scan_count
        });
      } catch (error) {
        errors.push({ tag_id: tagId, error: error.message });
      }
    }

    return {
      success: results,
      failed: errors,
      total_detected: results.length,
      total_scanned: tagIds.length
    };
  }

  async getNFCTag(tagId) {
    return await NFCTag.findOne({ where: { tag_id: tagId } });
  }

  async validateNFCTag(tagId) {
    const nfcTag = await NFCTag.findOne({ where: { tag_id: tagId } });
    return nfcTag && nfcTag.status === 'ACTIVE';
  }

  async getProductByNFCTag(tagId) {
    const nfcTag = await NFCTag.findOne({ where: { tag_id: tagId } });
    if (!nfcTag) return null;
    return await Product.findByPk(nfcTag.product_id);
  }
}

module.exports = new NFCService();
