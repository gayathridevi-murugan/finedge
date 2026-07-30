const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';
let testsPassed = 0;
let testsFailed = 0;

const test = async (name, fn) => {
  try {
    await fn();
    console.log(`✓ ${name}`);
    testsPassed++;
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(`  Error: ${error.message}`);
    testsFailed++;
  }
};

const runTests = async () => {
  console.log('\n=== Core Queue-Free Checkout API Tests ===\n');

  // Health check
  try {
    const health = await axios.get(`${API_BASE}/health`);
    console.log('✓ Backend server is running\n');
  } catch (error) {
    console.error('✗ Backend server is not running. Start with: npm run dev\n');
    process.exit(1);
  }

  // Test 1: Create cart
  let cartId;
  await test('Create new cart', async () => {
    const response = await axios.post(`${API_BASE}/cart/create`);
    if (!response.data.data.cart_id) {
      throw new Error('No cart_id returned');
    }
    cartId = response.data.data.cart_id;
    console.log(`  Cart ID: ${cartId}`);
  });

  // Test 2: Simulate NFC batch scan by creating products directly
  await test('Simulate NFC batch product detection', async () => {
    const response = await axios.post(`${API_BASE}/nfc/scan`, {
      tag_id: 'DEMO_0001'
    });
    if (!response.data.data.product.id) {
      throw new Error('No product ID returned');
    }
    if (response.data.data.product.name !== 'Organic Milk 1L') {
      throw new Error(`Wrong product name: ${response.data.data.product.name}`);
    }
  });

  // Test 3: Scan multiple products (simulate batch)
  let product2;
  await test('Scan second product (DEMO_0002)', async () => {
    const response = await axios.post(`${API_BASE}/nfc/scan`, {
      tag_id: 'DEMO_0002'
    });
    product2 = response.data.data.product;
    if (product2.name !== 'Whole Wheat Bread') {
      throw new Error(`Wrong product: ${product2.name}`);
    }
  });

  // Test 4: Scan third product
  let product3;
  await test('Scan third product (DEMO_0003)', async () => {
    const response = await axios.post(`${API_BASE}/nfc/scan`, {
      tag_id: 'DEMO_0003'
    });
    product3 = response.data.data.product;
    if (product3.name !== 'Butter 250g') {
      throw new Error(`Wrong product: ${product3.name}`);
    }
  });

  // Test 5: Get cart details (still empty because we haven't used batch add)
  await test('Get empty cart', async () => {
    const response = await axios.get(`${API_BASE}/cart/${cartId}`);
    if (response.data.data.items === undefined) {
      throw new Error('No items array in response');
    }
  });

  // Test 6: Create order from cart
  let orderId;
  await test('Create order from cart', async () => {
    const response = await axios.post(`${API_BASE}/orders/create`, {
      cart_id: cartId,
      customer_id: 'demo-customer-1'
    });
    if (!response.data.data.order.id) {
      throw new Error('No order ID returned');
    }
    orderId = response.data.data.order.id;
    console.log(`  Order ID: ${orderId}`);
  });

  // Test 7: Get order details
  await test('Get order details', async () => {
    const response = await axios.get(`${API_BASE}/orders/${orderId}`);
    if (!response.data.data.order.order_number) {
      throw new Error('No order number in response');
    }
  });

  // Test 8: Process payment
  await test('Process payment for order', async () => {
    const response = await axios.post(`${API_BASE}/payments/process`, {
      order_id: orderId,
      amount: 10.00,
      payment_method: 'CREDIT_CARD'
    });
    if (!['PENDING', 'CAPTURED', 'FAILED'].includes(response.data.data.payment.status)) {
      throw new Error(`Invalid payment status: ${response.data.data.payment.status}`);
    }
  });

  // Test 9: Get payment status
  await test('Get payment status', async () => {
    const response = await axios.get(`${API_BASE}/payments/${orderId}`);
    if (!response.data.data) {
      throw new Error('No payment data in response');
    }
  });

  // Test 10: Generate receipt
  await test('Generate receipt', async () => {
    const response = await axios.post(`${API_BASE}/receipts/generate`, {
      order_id: orderId
    });
    if (!response.data.data.receipt.receipt_number) {
      throw new Error('No receipt number returned');
    }
  });

  // Test 11: Add loyalty points
  await test('Add loyalty points', async () => {
    const response = await axios.post(`${API_BASE}/loyalty/add-points`, {
      customer_id: 'demo-customer-1',
      order_id: orderId,
      points: 10
    });
    if (!response.data.data.customer) {
      throw new Error('No customer data in response');
    }
  });

  // Test 12: Verify exit
  await test('Verify exit after payment', async () => {
    const response = await axios.post(`${API_BASE}/exit/verify`, {
      order_id: orderId
    });
    if (!['APPROVED', 'BLOCKED'].includes(response.data.data.exit_verification.exit_status)) {
      throw new Error(`Invalid exit status: ${response.data.data.exit_verification.exit_status}`);
    }
  });

  // Test 13: Get simulator demo data
  await test('Get simulator demo data', async () => {
    const response = await axios.get(`${API_BASE}/simulator/demo-data`);
    if (!response.data.data.sample_tags) {
      throw new Error('No sample_tags in simulator data');
    }
  });

  // Test 14: Get available NFC tags
  await test('Get available NFC tags', async () => {
    const response = await axios.get(`${API_BASE}/simulator/available-tags`);
    if (!response.data.data.tags) {
      throw new Error('No tags returned');
    }
  });

  // Summary
  console.log(`\n=== Test Summary ===`);
  console.log(`Passed: ${testsPassed}`);
  console.log(`Failed: ${testsFailed}`);
  console.log(`Total: ${testsPassed + testsFailed}\n`);

  if (testsFailed === 0) {
    console.log('✓ All tests passed!\n');
    process.exit(0);
  } else {
    console.log(`✗ ${testsFailed} test(s) failed\n`);
    process.exit(1);
  }
};

runTests().catch(error => {
  console.error('Test suite error:', error);
  process.exit(1);
});
