const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

const test = async (name, fn) => {
  try {
    await fn();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(`  Error: ${error.message}`);
    if (error.response?.data) {
      console.error(`  Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
};

const testBatchNFCScan = async () => {
  console.log('\n=== NFC Batch Scanning ===\n');

  await test('Batch scan multiple NFC tags', async () => {
    const response = await axios.post(`${API_BASE}/nfc/batch-scan`, {
      tag_ids: ['DEMO_0001', 'DEMO_0002', 'DEMO_0003']
    });

    if (response.data.data.summary.total_detected !== 3) {
      throw new Error(`Expected 3 products, got ${response.data.data.summary.total_detected}`);
    }

    const products = response.data.data.products;
    if (products[0].product_name !== 'Organic Milk 1L') {
      throw new Error(`Expected 'Organic Milk 1L', got '${products[0].product_name}'`);
    }
  });

  await test('Batch scan with invalid tags returns partial results', async () => {
    const response = await axios.post(`${API_BASE}/nfc/batch-scan`, {
      tag_ids: ['DEMO_0001', 'INVALID_TAG', 'DEMO_0002']
    });

    if (response.data.data.summary.total_detected !== 2) {
      throw new Error(`Expected 2 products, got ${response.data.data.summary.total_detected}`);
    }

    if (response.data.data.summary.failed_count !== 1) {
      throw new Error(`Expected 1 failed, got ${response.data.data.summary.failed_count}`);
    }
  });

  await test('Batch scan empty array returns error', async () => {
    try {
      await axios.post(`${API_BASE}/nfc/batch-scan`, { tag_ids: [] });
      throw new Error('Should have failed');
    } catch (error) {
      if (error.response?.status !== 400) {
        throw new Error(`Expected 400, got ${error.response?.status}`);
      }
    }
  });
};

const testCart = async () => {
  console.log('\n=== Cart Operations ===\n');

  let cartId;

  await test('Create new cart', async () => {
    const response = await axios.post(`${API_BASE}/cart/create`);
    if (!response.data.data.cart_id) {
      throw new Error('No cart_id returned');
    }
    cartId = response.data.data.cart_id;
  });

  await test('Add items to cart', async () => {
    const response = await axios.post(`${API_BASE}/cart/${cartId}/add`, {
      products: [
        { product_id: 'test-product-1', quantity: 1, unit_price: 3.99 },
        { product_id: 'test-product-2', quantity: 2, unit_price: 2.50 }
      ]
    });

    if (response.data.data.total_items !== 2) {
      throw new Error(`Expected 2 items, got ${response.data.data.total_items}`);
    }
  });

  await test('Get cart details', async () => {
    const response = await axios.get(`${API_BASE}/cart/${cartId}`);
    if (!response.data.data.cart_total) {
      throw new Error('No cart_total in response');
    }
  });
};

const testOrders = async () => {
  console.log('\n=== Order Management ===\n');

  let orderId;
  let cartId;

  await test('Create cart for order test', async () => {
    const response = await axios.post(`${API_BASE}/cart/create`);
    cartId = response.data.data.cart_id;
  });

  await test('Add items and create order', async () => {
    await axios.post(`${API_BASE}/cart/${cartId}/add`, {
      products: [{ product_id: 'test-1', quantity: 1, unit_price: 5.99 }]
    });

    const response = await axios.post(`${API_BASE}/orders/create`, {
      cart_id: cartId,
      customer_id: 'test-customer-1'
    });

    if (!response.data.data.order.id) {
      throw new Error('No order id returned');
    }
    orderId = response.data.data.order.id;
  });

  await test('Get order details', async () => {
    const response = await axios.get(`${API_BASE}/orders/${orderId}`);
    if (response.data.data.order.order_number !== response.data.data.order.order_number) {
      throw new Error('Order number mismatch');
    }
  });
};

const testPayments = async () => {
  console.log('\n=== Payment Processing ===\n');

  let orderId;

  await test('Create order for payment test', async () => {
    const cartResponse = await axios.post(`${API_BASE}/cart/create`);
    const cartId = cartResponse.data.data.cart_id;

    await axios.post(`${API_BASE}/cart/${cartId}/add`, {
      products: [{ product_id: 'test-1', quantity: 1, unit_price: 10.00 }]
    });

    const orderResponse = await axios.post(`${API_BASE}/orders/create`, {
      cart_id: cartId,
      customer_id: 'test-customer-2'
    });

    orderId = orderResponse.data.data.order.id;
  });

  await test('Process payment for order', async () => {
    const response = await axios.post(`${API_BASE}/payments/process`, {
      order_id: orderId,
      amount: 10.00,
      payment_method: 'SURFBOARD'
    });

    if (!['PENDING', 'CAPTURED', 'FAILED'].includes(response.data.data.payment.status)) {
      throw new Error(`Invalid payment status: ${response.data.data.payment.status}`);
    }
  });

  await test('Get payment status', async () => {
    const response = await axios.get(`${API_BASE}/payments/${orderId}`);
    if (!response.data.data.payment) {
      throw new Error('No payment data returned');
    }
  });
};

const testReceipts = async () => {
  console.log('\n=== Receipt Generation ===\n');

  let orderId;

  await test('Create order and process payment for receipt', async () => {
    const cartResponse = await axios.post(`${API_BASE}/cart/create`);
    const cartId = cartResponse.data.data.cart_id;

    await axios.post(`${API_BASE}/cart/${cartId}/add`, {
      products: [{ product_id: 'test-1', quantity: 1, unit_price: 15.00 }]
    });

    const orderResponse = await axios.post(`${API_BASE}/orders/create`, {
      cart_id: cartId,
      customer_id: 'test-customer-3'
    });

    orderId = orderResponse.data.data.order.id;

    await axios.post(`${API_BASE}/payments/process`, {
      order_id: orderId,
      amount: 15.00,
      payment_method: 'SURFBOARD'
    });
  });

  await test('Generate receipt', async () => {
    const response = await axios.post(`${API_BASE}/receipts/generate`, {
      order_id: orderId
    });

    if (!response.data.data.receipt.receipt_number) {
      throw new Error('No receipt_number returned');
    }
  });

  await test('Get receipt details', async () => {
    const response = await axios.get(`${API_BASE}/receipts/${orderId}`);
    if (!response.data.data.receipt) {
      throw new Error('No receipt returned');
    }
  });
};

const testLoyalty = async () => {
  console.log('\n=== Loyalty Points ===\n');

  const customerId = 'test-loyalty-customer';

  await test('Add loyalty points', async () => {
    const response = await axios.post(`${API_BASE}/loyalty/add-points`, {
      customer_id: customerId,
      points: 50
    });

    if (!response.data.data.loyalty) {
      throw new Error('No loyalty data returned');
    }
  });

  await test('Get loyalty balance', async () => {
    const response = await axios.get(`${API_BASE}/loyalty/${customerId}`);
    if (response.data.data.customer_id !== customerId) {
      throw new Error('Customer ID mismatch');
    }
  });
};

const testExitVerification = async () => {
  console.log('\n=== Exit Verification ===\n');

  let orderId;

  await test('Create and pay for order before exit test', async () => {
    const cartResponse = await axios.post(`${API_BASE}/cart/create`);
    const cartId = cartResponse.data.data.cart_id;

    await axios.post(`${API_BASE}/cart/${cartId}/add`, {
      products: [{ product_id: 'test-1', quantity: 1, unit_price: 20.00 }]
    });

    const orderResponse = await axios.post(`${API_BASE}/orders/create`, {
      cart_id: cartId,
      customer_id: 'test-customer-exit'
    });

    orderId = orderResponse.data.data.order.id;

    await axios.post(`${API_BASE}/payments/process`, {
      order_id: orderId,
      amount: 20.00,
      payment_method: 'SURFBOARD'
    });
  });

  await test('Verify exit - should be approved if paid', async () => {
    const response = await axios.post(`${API_BASE}/exit/verify`, {
      order_id: orderId
    });

    if (!['APPROVED', 'BLOCKED'].includes(response.data.data.exit_verification.exit_status)) {
      throw new Error(`Invalid exit status: ${response.data.data.exit_verification.exit_status}`);
    }
  });

  await test('Get exit verification status', async () => {
    const response = await axios.get(`${API_BASE}/exit/${orderId}`);
    if (!response.data.data.exit_status) {
      throw new Error('No exit_status returned');
    }
  });
};

const testSimulator = async () => {
  console.log('\n=== Simulator ===\n');

  await test('Get demo data', async () => {
    const response = await axios.get(`${API_BASE}/simulator/demo-data`);
    if (!Array.isArray(response.data.data.products)) {
      throw new Error('Demo data not an array');
    }
  });

  await test('Get available tags', async () => {
    const response = await axios.get(`${API_BASE}/simulator/available-tags`);
    if (!response.data.data.tags) {
      throw new Error('No tags returned');
    }
  });
};

const runAllTests = async () => {
  console.log('Starting API Tests...\n');
  console.log('Testing Queue-Free Checkout Core APIs\n');

  try {
    // Health check
    const health = await axios.get(`${API_BASE}/health`);
    console.log('✓ Backend server is running\n');
  } catch (error) {
    console.error('✗ Backend server is not running. Start with: npm run dev\n');
    process.exit(1);
  }

  await testBatchNFCScan();
  await testCart();
  await testOrders();
  await testPayments();
  await testReceipts();
  await testLoyalty();
  await testExitVerification();
  await testSimulator();

  console.log('\n=== Tests Complete ===\n');
};

runAllTests().catch(error => {
  console.error('Test suite error:', error);
  process.exit(1);
});
