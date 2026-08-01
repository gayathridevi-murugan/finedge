require('dotenv').config();
const { Product, NFCTag, SecurityTag } = require('../models');

const seedDatabase = async () => {
  try {
    console.log('🌱 Seeding database with Fashion Retail Products...');

    const products = [
      // T-SHIRTS
      {
        name: 'Premium Cotton T-Shirt',
        brand: 'UrbanWear',
        category: 'Clothing',
        subcategory: 'T-Shirts',
        description: 'Comfortable 100% cotton t-shirt perfect for everyday wear',
        price: 999,
        stock: 45,
        size: 'M',
        color: 'Black',
        material: '100% Cotton',
        care_instructions: '1. Wash in cold water\n2. Use mild detergent\n3. Hang dry in shade\n4. Iron on medium heat if needed',
        sku: 'TSHIRT-001-BLK',
        rating: 4.7,
        review_count: 156
      },
      {
        name: 'Casual Printed T-Shirt',
        brand: 'StyleLab',
        category: 'Clothing',
        subcategory: 'T-Shirts',
        description: 'Trendy printed design with modern aesthetic',
        price: 1299,
        stock: 38,
        size: 'L',
        color: 'White',
        material: 'Cotton blend',
        care_instructions: '1. Wash inside out\n2. Use cold water\n3. Do not bleach\n4. Line dry preferred',
        sku: 'TSHIRT-002-WHT',
        rating: 4.5,
        review_count: 89
      },
      // JEANS
      {
        name: 'Classic Blue Denim Jeans',
        brand: 'DenimCo',
        category: 'Clothing',
        subcategory: 'Jeans',
        description: 'Timeless blue denim jeans with perfect fit',
        price: 2499,
        stock: 32,
        size: '32',
        color: 'Navy Blue',
        material: '98% Cotton, 2% Spandex',
        care_instructions: '1. Wash separately in cold water\n2. Turn inside out\n3. Tumble dry low\n4. Avoid excessive washing',
        sku: 'JEANS-001-NVY',
        rating: 4.8,
        review_count: 342
      },
      {
        name: 'Slim Fit Black Jeans',
        brand: 'ModernFit',
        category: 'Clothing',
        subcategory: 'Jeans',
        description: 'Sleek black jeans with comfortable stretch',
        price: 2299,
        stock: 27,
        size: '34',
        color: 'Black',
        material: '97% Cotton, 3% Elastane',
        care_instructions: '1. First wash in cold water separately\n2. Dry flat\n3. Iron as needed\n4. Wash inside out',
        sku: 'JEANS-002-BLK',
        rating: 4.6,
        review_count: 218
      },
      // SHOES
      {
        name: 'White Running Sneakers',
        brand: 'RunVibe',
        category: 'Shoes',
        subcategory: 'Sneakers',
        description: 'Lightweight and breathable running shoes',
        price: 3999,
        stock: 50,
        size: '42',
        color: 'White',
        material: 'Mesh with Rubber sole',
        care_instructions: '1. Remove insoles and wash separately\n2. Use mild soap and water\n3. Air dry naturally\n4. Do not machine wash',
        sku: 'SHOES-001-WHT',
        rating: 4.9,
        review_count: 524
      },
      {
        name: 'Casual Black Slip-Ons',
        brand: 'ComfortStep',
        category: 'Shoes',
        subcategory: 'Casual Shoes',
        description: 'Versatile slip-on shoes for casual and semi-formal wear',
        price: 2799,
        stock: 41,
        size: '41',
        color: 'Black',
        material: 'Canvas with rubber sole',
        care_instructions: '1. Wipe with damp cloth\n2. Air dry\n3. Use shoe brush for cleaning\n4. Store in cool, dry place',
        sku: 'SHOES-002-BLK',
        rating: 4.4,
        review_count: 167
      },
      // HOODIES
      {
        name: 'Premium Hoodie Jacket',
        brand: 'LayerLuxe',
        category: 'Clothing',
        subcategory: 'Hoodies',
        description: 'Warm and cozy hoodie perfect for cold weather',
        price: 1999,
        stock: 28,
        size: 'M',
        color: 'Grey',
        material: '85% Cotton, 15% Polyester',
        care_instructions: '1. Wash in lukewarm water\n2. Use mild detergent\n3. Tumble dry on low\n4. Remove promptly to avoid wrinkles',
        sku: 'HOOD-001-GRY',
        rating: 4.7,
        review_count: 276
      },
      {
        name: 'Sports Hoodie',
        brand: 'AthleteFit',
        category: 'Clothing',
        subcategory: 'Hoodies',
        description: 'Lightweight sports hoodie with moisture-wicking fabric',
        price: 1799,
        stock: 35,
        size: 'L',
        color: 'Navy',
        material: 'Polyester blend with technical fabric',
        care_instructions: '1. Machine wash cold\n2. Tumble dry low\n3. Do not bleach\n4. Avoid fabric softener',
        sku: 'HOOD-002-NVY',
        rating: 4.6,
        review_count: 198
      },
      // ACCESSORIES
      {
        name: 'Cotton Baseball Cap',
        brand: 'HeadWear Pro',
        category: 'Accessories',
        subcategory: 'Caps',
        description: 'Classic baseball cap in various colors',
        price: 699,
        stock: 62,
        size: 'One Size',
        color: 'Black',
        material: '100% Cotton twill',
        care_instructions: '1. Hand wash in cool water\n2. Air dry naturally\n3. Do not bleach\n4. Reshape while damp',
        sku: 'CAP-001-BLK',
        rating: 4.5,
        review_count: 87
      },
      {
        name: 'Leather Crossbody Bag',
        brand: 'BagCraft',
        category: 'Accessories',
        subcategory: 'Bags',
        description: 'Premium leather crossbody bag for everyday use',
        price: 4299,
        stock: 19,
        size: 'Medium',
        color: 'Tan Brown',
        material: '100% Genuine Leather',
        care_instructions: '1. Clean with soft, dry cloth\n2. Use leather conditioner monthly\n3. Avoid prolonged sun exposure\n4. Store in dust bag',
        sku: 'BAG-001-TAN',
        rating: 4.9,
        review_count: 203
      },
      // SHIRTS
      {
        name: 'Formal Cotton Shirt',
        brand: 'ClassicFit',
        category: 'Clothing',
        subcategory: 'Shirts',
        description: 'Professional formal shirt for office and special occasions',
        price: 1599,
        stock: 33,
        size: 'M',
        color: 'White',
        material: '100% Cotton',
        care_instructions: '1. Dry clean or hand wash\n2. Iron while damp\n3. Use starch for crispness\n4. Store on hangers',
        sku: 'SHIRT-001-WHT',
        rating: 4.8,
        review_count: 145
      },
      // DRESSES
      {
        name: 'Summer Casual Dress',
        brand: 'DressLab',
        category: 'Clothing',
        subcategory: 'Dresses',
        description: 'Light and breezy summer dress perfect for warm days',
        price: 2199,
        stock: 24,
        size: 'S',
        color: 'Floral Print',
        material: 'Rayon blend',
        care_instructions: '1. Wash in cold water\n2. Use delicate cycle\n3. Hang dry\n4. Iron on low heat if needed',
        sku: 'DRESS-001-FLR',
        rating: 4.6,
        review_count: 132
      },
      // ACCESSORIES - SUNGLASSES
      {
        name: 'UV Protected Sunglasses',
        brand: 'VisionCare',
        category: 'Accessories',
        subcategory: 'Sunglasses',
        description: 'Stylish sunglasses with 100% UV protection',
        price: 1899,
        stock: 44,
        size: 'One Size',
        color: 'Black Frame',
        material: 'Plastic frame with polarized lenses',
        care_instructions: '1. Use microfiber cloth to clean\n2. Keep in protective case\n3. Avoid extreme heat\n4. Never place on forehead',
        sku: 'SUNGLASS-001-BLK',
        rating: 4.7,
        review_count: 256
      },
      // JACKETS
      {
        name: 'Windproof Jacket',
        brand: 'OutdoorGear',
        category: 'Clothing',
        subcategory: 'Jackets',
        description: 'Lightweight windproof jacket for outdoor activities',
        price: 2899,
        stock: 22,
        size: 'M',
        color: 'Navy',
        material: 'Nylon with fleece lining',
        care_instructions: '1. Machine wash cold\n2. Use gentle cycle\n3. Air dry completely\n4. Do not iron',
        sku: 'JACKET-001-NVY',
        rating: 4.8,
        review_count: 289
      }
    ];

    console.log('📦 Creating products...');
    const createdProducts = await Product.bulkCreate(products);
    console.log(`✅ Created ${createdProducts.length} products`);

    console.log('🏷️  Creating NFC tags...');
    const nfcTags = createdProducts.map((product, index) => ({
      tag_id: `NFC-FASHION-${String(index + 1).padStart(3, '0')}-${product.sku}`,
      product_id: product.id,
      status: 'ACTIVE',
      scan_count: 0
    }));
    await NFCTag.bulkCreate(nfcTags);
    console.log(`✅ Created ${nfcTags.length} NFC tags`);

    console.log('🔒 Creating security tags...');
    const securityTags = createdProducts.map((product, index) => ({
      tag_id: `SEC-FASHION-${String(index + 1).padStart(3, '0')}-${product.sku}`,
      product_id: product.id,
      status: 'ACTIVE'
    }));
    await SecurityTag.bulkCreate(securityTags);
    console.log(`✅ Created ${securityTags.length} security tags`);

    console.log('✅ Database seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
};

seedDatabase();
