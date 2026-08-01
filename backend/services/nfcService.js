const { Product, NFCTag, SecurityTag } = require('../models');

class NFCService {
  async scanNFCTag(tagId) {
    let nfcTag = await NFCTag.findOne({ where: { tag_id: tagId } });

    if (!nfcTag) {
      throw new Error(`NFC tag not found: ${tagId}. Please ensure the product is registered in the system.`);
    }

    nfcTag.scan_count = (nfcTag.scan_count || 0) + 1;
    nfcTag.last_scanned_at = new Date();
    await nfcTag.save();

    const product = await Product.findByPk(nfcTag.product_id);
    if (!product) {
      throw new Error(`Product not found for NFC tag: ${tagId}`);
    }

    // Ensure SecurityTag exists for this product
    const existingSecurityTag = await SecurityTag.findOne({
      where: { product_id: nfcTag.product_id }
    });

    if (!existingSecurityTag) {
      try {
        await SecurityTag.create({
          tag_id: nfcTag.tag_id,
          product_id: nfcTag.product_id,
          status: 'ACTIVE'
        });
      } catch (error) {
        // SecurityTag creation failed, but continue
      }
    }

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
