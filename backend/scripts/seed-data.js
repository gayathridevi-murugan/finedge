require('dotenv').config();
const { Product, NFCTag, SecurityTag } = require('../models');

const seedDatabase = async () => {
  try {
    console.log('🌱 Seeding database...');

    const products = [
      { name: 'Organic Milk 1L', category: 'Dairy', description: 'Fresh organic milk', price: 3.99, stock: 50 },
      { name: 'Whole Wheat Bread', category: 'Bakery', description: 'Fresh bread', price: 2.50, stock: 30 },
      { name: 'Butter 250g', category: 'Dairy', description: 'Unsalted butter', price: 4.50, stock: 25 },
      { name: 'Apple Juice 500ml', category: 'Beverages', description: 'Pure apple juice', price: 2.99, stock: 40 },
      { name: 'Cheddar Cheese', category: 'Dairy', description: 'Aged cheddar', price: 5.99, stock: 20 },
      { name: 'Eggs (12 pack)', category: 'Dairy', description: 'Free-range eggs', price: 3.49, stock: 35 },
      { name: 'Greek Yogurt 500g', category: 'Dairy', description: 'Creamy yogurt', price: 4.29, stock: 28 },
      { name: 'Tomato Soup', category: 'Pantry', description: 'Canned soup', price: 1.99, stock: 60 }
    ];

    console.log('📦 Creating products...');
    const createdProducts = await Product.bulkCreate(products);

    console.log('🏷️  Creating NFC tags...');
    const nfcTags = createdProducts.map((product, index) => ({
      tag_id: `NFC_${String(index + 1).padStart(4, '0')}_${product.id.slice(0, 8)}`,
      product_id: product.id,
      status: 'ACTIVE',
      scan_count: 0
    }));
    await NFCTag.bulkCreate(nfcTags);

    console.log('🔒 Creating security tags...');
    const securityTags = createdProducts.map((product, index) => ({
      tag_id: `SEC_${String(index + 1).padStart(4, '0')}_${product.id.slice(0, 8)}`,
      product_id: product.id,
      status: 'ACTIVE'
    }));
    await SecurityTag.bulkCreate(securityTags);

    console.log('✅ Database seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
};

seedDatabase();
