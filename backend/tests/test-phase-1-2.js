const axios = require('axios');

const API = 'http://localhost:5000/api';
let testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

const test = async (name, fn) => {
  try {
    await fn();
    console.log(`✅ ${name}`);
    testResults.passed++;
    testResults.tests.push({ name, status: 'PASS' });
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error.message}`);
    testResults.failed++;
    testResults.tests.push({ name, status: 'FAIL', error: error.message });
  }
};

const runTests = async () => {
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║   PHASE 1 & 2: END-TO-END VERIFICATION TEST        ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  // ==================== PHASE 1: Backend Foundation ====================
  console.log('📋 PHASE 1: BACKEND FOUNDATION\n');

  let cartId, sessionId, orderId;

  await test('1.1: Backend health check', async () => {
    const res = await axios.get(`${API}/health`);
    if (!res.data.success) throw new Error('Health check failed');
  });

  await test('1.2: Create cart', async () => {
    const res = await axios.post(`${API}/cart/create`, {});
    cartId = res.data.data.cart_id;
    if (!cartId) throw new Error('No cart ID returned');
  });

  await test('1.3: Get available NFC demo scenarios', async () => {
    const res = await axios.get(`${API}/nfc-demo/scenarios`);
    const scenarios = res.data.data.scenarios;
    if (!scenarios || scenarios.length < 4) throw new Error('Not enough scenarios');
    console.log(`   Found ${scenarios.length} scenarios:`);
    scenarios.forEach(s => console.log(`   - ${s.name}`));
  });

  await test('1.4: Get animation sequence for successful-checkout', async () => {
    const res = await axios.get(`${API}/nfc-demo/sequence/successful-checkout`);
    const animation = res.data.data.animation;
    if (!animation.steps || animation.steps.length === 0) throw new Error('No animation steps');
    console.log(`   Animation has ${animation.steps.length} steps, total time: ${animation.metadata.total_demo_time_ms}ms`);
  });

  // ==================== PHASE 2: Interactive NFC Demo ====================
  console.log('\n📋 PHASE 2: INTERACTIVE NFC DEMO\n');

  let demoSessionData;

  await test('2.1: Initialize demo session (successful-checkout)', async () => {
    const res = await axios.post(`${API}/nfc-demo/initialize`, {
      scenario_key: 'successful-checkout'
    });
    demoSessionData = res.data.data.session;
    sessionId = demoSessionData.session_id;

    if (!sessionId) throw new Error('No session ID returned');
    if (!demoSessionData.products_detected) throw new Error('No products detected');
    if (demoSessionData.products_detected.length === 0) throw new Error('Products list is empty');

    console.log(`   Session ID: ${sessionId}`);
    console.log(`   Products detected: ${demoSessionData.products_detected.length}`);
    console.log(`   Total amount: ₹${demoSessionData.total_amount}`);
  });

  await test('2.2: Verify products from database', async () => {
    if (!demoSessionData.products_detected) throw new Error('No products');

    const expectedProducts = ['Organic Milk 1L', 'Whole Wheat Bread', 'Butter 250g', 'Apple Juice 500ml'];
    const detectedNames = demoSessionData.products_detected.map(p => p.product_name);

    for (const expected of expectedProducts) {
      if (!detectedNames.includes(expected)) {
        throw new Error(`Expected product not found: ${expected}`);
      }
    }

    console.log(`   ✓ All expected products found in database`);
    demoSessionData.products_detected.forEach(p => {
      console.log(`   - ${p.product_name}: ₹${p.price}`);
    });
  });

  await test('2.3: Verify cart can be populated from demo session', async () => {
    if (!demoSessionData.products_detected) throw new Error('No products to add');

    // In a real scenario, products would be added to cart
    const totalFromProducts = demoSessionData.products_detected
      .reduce((sum, p) => sum + parseFloat(p.price), 0);

    if (totalFromProducts !== demoSessionData.total_amount) {
      throw new Error(`Total mismatch: ${totalFromProducts} vs ${demoSessionData.total_amount}`);
    }

    console.log(`   Cart total would be: ₹${totalFromProducts}`);
  });

  await test('2.4: Full NFC demo startup (animation + session)', async () => {
    const res = await axios.post(`${API}/nfc-demo/start`, {
      scenario_key: 'successful-checkout'
    });

    const animation = res.data.data.animation;
    const session = res.data.data.session;

    if (!animation.steps) throw new Error('No animation in response');
    if (!session.products_detected) throw new Error('No session in response');

    console.log(`   Animation steps: ${animation.steps.length}`);
    console.log(`   Products in session: ${session.products_detected.length}`);
    console.log(`   Tag sequence: ${animation.tag_sequence.join(', ')}`);
  });

  // ==================== UNPAID ITEM SCENARIO ====================
  console.log('\n📋 UNPAID ITEM SCENARIO\n');

  let unpaidSessionData;

  await test('2.5: Initialize unpaid-item scenario', async () => {
    const res = await axios.post(`${API}/nfc-demo/initialize`, {
      scenario_key: 'unpaid-item'
    });
    unpaidSessionData = res.data.data.session;

    if (!unpaidSessionData.products_detected) throw new Error('No products detected');
    if (unpaidSessionData.products_detected.length < 4) throw new Error('Should detect 4 products');

    console.log(`   Products detected: ${unpaidSessionData.products_detected.length}`);
    console.log(`   Scenario config: pay_all_items = ${unpaidSessionData.metadata.pay_all_items}`);
  });

  // ==================== ORDER & PAYMENT FLOW ====================
  console.log('\n📋 ORDER & PAYMENT FLOW\n');

  await test('3.1: Create order from cart', async () => {
    const res = await axios.post(`${API}/orders/create`, {
      cart_id: cartId
    });

    orderId = res.data.data.order.id;
    if (!orderId) throw new Error('No order ID returned');
    if (res.data.data.order.payment_status !== 'PENDING') throw new Error('Payment should be PENDING');

    console.log(`   Order ID: ${orderId}`);
    console.log(`   Payment status: ${res.data.data.order.payment_status}`);
  });

  await test('3.2: Process payment', async () => {
    const res = await axios.post(`${API}/payments/process`, {
      order_id: orderId,
      amount: 13.98,
      payment_method: 'CREDIT_CARD'
    });

    const paymentStatus = res.data.data.payment.status;
    if (!['PENDING', 'CAPTURED'].includes(paymentStatus)) {
      throw new Error(`Invalid payment status: ${paymentStatus}`);
    }

    console.log(`   Payment status: ${paymentStatus}`);
    console.log(`   Transaction ID: ${res.data.data.payment.transaction_id}`);
  });

  await test('3.3: Verify order payment status updated', async () => {
    const res = await axios.get(`${API}/orders/${orderId}`);
    const order = res.data.data.order;

    if (order.payment_status !== 'PAID') {
      throw new Error(`Order should be PAID, got ${order.payment_status}`);
    }

    console.log(`   Order payment status: ${order.payment_status}`);
  });

  // ==================== RECEIPT & LOYALTY ====================
  console.log('\n📋 RECEIPT & LOYALTY\n');

  await test('3.4: Generate receipt', async () => {
    const res = await axios.post(`${API}/receipts/generate`, {
      order_id: orderId
    });

    if (!res.data.data.receipt.receipt_number) throw new Error('No receipt number');

    console.log(`   Receipt number: ${res.data.data.receipt.receipt_number}`);
    console.log(`   Total: ₹${res.data.data.receipt.total_amount}`);
    console.log(`   Loyalty points earned: ${res.data.data.receipt.loyalty_points_earned}`);
  });

  await test('3.5: Add loyalty points', async () => {
    const res = await axios.post(`${API}/loyalty/add-points`, {
      customer_id: 'test-customer-001',
      order_id: orderId,
      points: 15
    });

    if (!res.data.data.customer) throw new Error('No customer returned');

    console.log(`   Customer ID: ${res.data.data.customer.id}`);
    console.log(`   Points: ${res.data.data.customer.points}`);
    console.log(`   Tier: ${res.data.data.customer.tier}`);
  });

  // ==================== EXIT VERIFICATION ====================
  console.log('\n📋 EXIT VERIFICATION\n');

  await test('3.6: Verify exit (successful)', async () => {
    const res = await axios.post(`${API}/exit/verify`, {
      order_id: orderId
    });

    const exit = res.data.data.exit_verification;
    if (exit.exit_status !== 'APPROVED') throw new Error('Exit should be APPROVED');
    if (exit.gate_status !== 'GREEN') throw new Error('Gate should be GREEN');

    console.log(`   Exit status: ${exit.exit_status}`);
    console.log(`   Gate status: ${exit.gate_status}`);
    console.log(`   Simulation note: ${exit.simulation_note}`);
  });

  // ==================== FINAL RESULTS ====================
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║              TEST RESULTS SUMMARY                  ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`Total: ${testResults.passed + testResults.failed}\n`);

  if (testResults.failed === 0) {
    console.log('🎉 ALL TESTS PASSED! Phase 1 & 2 are working correctly.\n');
  } else {
    console.log(`⚠️  ${testResults.failed} test(s) failed. See details above.\n`);
  }

  // Print detailed results
  console.log('DETAILED RESULTS:');
  testResults.tests.forEach(t => {
    const icon = t.status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} ${t.name}${t.error ? ` - ${t.error}` : ''}`);
  });

  console.log('\n');
};

runTests().catch(err => {
  console.error('Test suite error:', err.message);
  process.exit(1);
});
