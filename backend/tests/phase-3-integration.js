const axios = require('axios');

const API = 'http://localhost:5000/api';

const test = async (name, fn) => {
  try {
    await fn();
    console.log(`✅ ${name}`);
    return { name, status: 'PASS' };
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   ${error.message}`);
    return { name, status: 'FAIL', error: error.message };
  }
};

const runTests = async () => {
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║        PHASE 3: COMPLETE CHECKOUT FLOW TEST        ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  const results = [];

  // ==================== SCENARIO 1: SUCCESSFUL CHECKOUT ====================
  console.log('📋 SCENARIO 1: SUCCESSFUL CHECKOUT\n');

  let successSession, successOrder, successPayment;

  results.push(await test('1.1: Start NFC demo (successful-checkout)', async () => {
    const res = await axios.post(`${API}/nfc-demo/start`, { scenario_key: 'successful-checkout' });
    successSession = res.data.data.session;
    if (successSession.products_detected.length !== 4) throw new Error('Should detect 4 products');
    if (successSession.total_amount !== 13.98) throw new Error(`Total should be 13.98, got ${successSession.total_amount}`);
    console.log(`   Session: 4 products, ₹${successSession.total_amount}`);
  }));

  results.push(await test('1.2: Create order from demo session', async () => {
    const res = await axios.post(`${API}/orders/create`, { cart_id: successSession.session_id });
    successOrder = res.data.data.order;
    if (successOrder.payment_status !== 'PENDING') throw new Error('Should be PENDING');
    console.log(`   Order ID: ${successOrder.id}`);
  }));

  results.push(await test('1.3: Process payment for successful checkout', async () => {
    const finalTotal = 13.98 * 1.1; // With tax
    const res = await axios.post(`${API}/payments/process`, {
      order_id: successOrder.id,
      amount: finalTotal,
      payment_method: 'CREDIT_CARD'
    });
    successPayment = res.data.data.payment;
    if (successPayment.status !== 'CAPTURED') throw new Error('Payment should be CAPTURED');
    console.log(`   Payment: ${successPayment.status}`);
  }));

  results.push(await test('1.4: Verify order payment status updated to PAID', async () => {
    const res = await axios.get(`${API}/orders/${successOrder.id}`);
    const order = res.data.data.order;
    if (order.payment_status !== 'PAID') throw new Error(`Should be PAID, got ${order.payment_status}`);
    console.log(`   Order status: ${order.payment_status}`);
  }));

  results.push(await test('1.5: Generate receipt', async () => {
    const res = await axios.post(`${API}/receipts/generate`, { order_id: successOrder.id });
    if (!res.data.data.receipt.receipt_number) throw new Error('No receipt');
    console.log(`   Receipt: ${res.data.data.receipt.receipt_number}`);
  }));

  results.push(await test('1.6: Award loyalty points', async () => {
    const points = 13; // Floor of 13.98
    const res = await axios.post(`${API}/loyalty/add-points`, {
      customer_id: 'success-customer',
      order_id: successOrder.id,
      points: points
    });
    if (!res.data.data.customer.id) throw new Error('No customer');
    console.log(`   Loyalty: +${points} points`);
  }));

  results.push(await test('1.7: Verify exit (should be APPROVED)', async () => {
    const res = await axios.post(`${API}/exit/verify`, { order_id: successOrder.id });
    const exit = res.data.data.exit_verification;
    if (exit.exit_status !== 'APPROVED') throw new Error(`Should be APPROVED, got ${exit.exit_status}`);
    if (exit.gate_status !== 'GREEN') throw new Error(`Gate should be GREEN, got ${exit.gate_status}`);
    console.log(`   Exit: ${exit.exit_status} (${exit.gate_status} gate)`);
  }));

  // ==================== SCENARIO 2: UNPAID ITEM ====================
  console.log('\n📋 SCENARIO 2: UNPAID ITEM DETECTION\n');

  let unpaidSession, unpaidOrder, unpaidPayment;
  let unpaidScenarioSuccess = false;
  let unpaidAttempts = 0;

  // Retry entire scenario if payment fails (90% success rate)
  while (!unpaidScenarioSuccess && unpaidAttempts < 3) {
    unpaidAttempts++;

    results.push(await test(`2.1: Start NFC demo (unpaid-item) [Attempt ${unpaidAttempts}]`, async () => {
      const res = await axios.post(`${API}/nfc-demo/start`, { scenario_key: 'unpaid-item' });
      unpaidSession = res.data.data.session;
      if (unpaidSession.products_detected.length !== 4) throw new Error('Should detect 4 products');
      console.log(`   Session: 4 products, ₹${unpaidSession.total_amount}`);
    }));

    results.push(await test(`2.2: Create order from demo session [Attempt ${unpaidAttempts}]`, async () => {
      const res = await axios.post(`${API}/orders/create`, { cart_id: unpaidSession.session_id });
      unpaidOrder = res.data.data.order;
      console.log(`   Order ID: ${unpaidOrder.id}`);
    }));

    results.push(await test(`2.3: Process payment for unpaid-item scenario [Attempt ${unpaidAttempts}]`, async () => {
      const finalTotal = unpaidSession.total_amount * 1.1; // With tax
      const res = await axios.post(`${API}/payments/process`, {
        order_id: unpaidOrder.id,
        amount: finalTotal,
        payment_method: 'CREDIT_CARD'
      });
      unpaidPayment = res.data.data.payment;
      if (unpaidPayment.status !== 'CAPTURED') {
        throw new Error(`Payment not captured, got ${unpaidPayment.status}. Will retry scenario.`);
      }
      console.log(`   Payment: ${unpaidPayment.status}`);
      unpaidScenarioSuccess = true; // Only set true if payment succeeds
    }));

    if (!unpaidScenarioSuccess && unpaidAttempts < 3) continue; // Retry if payment failed
  }

  if (!unpaidScenarioSuccess) {
    console.log('\n⚠️  Unpaid-item scenario failed due to payment failures. Continuing with exit tests based on last attempt...\n');
  }

  results.push(await test(`2.4: Setup unpaid-item scenario (3 paid, 1 unpaid)`, async () => {
    try {
      const res = await axios.post(`${API}/demo/unpaid-item-setup`, {
        orderId: unpaidOrder.id,
        paid_item_count: 3
      });
      if (!res.data.data.order) throw new Error('No order in response');
      if (res.data.data.order.unpaid_items !== 1) {
        console.log(`   Response:`, JSON.stringify(res.data.data.order, null, 2));
        throw new Error(`Should have 1 unpaid item, got ${res.data.data.order.unpaid_items}`);
      }
      console.log(`   Setup: ${res.data.data.order.paid_items} paid, ${res.data.data.order.unpaid_items} unpaid`);

      // Debug: Check actual security tag statuses in database
      const debugRes = await axios.get(`${API}/debug/order/${unpaidOrder.id}/security-tags`);
      const items = debugRes.data.data.items_with_tags;
      console.log(`   Security tags:`);
      items.forEach((item, idx) => {
        console.log(`   Item ${idx + 1}: ${item.security_tag_status}`);
      });
    } catch (error) {
      if (error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      throw error;
    }
  }));

  results.push(await test('2.5: Verify exit (should be BLOCKED with unpaid item)', async () => {
    const res = await axios.post(`${API}/exit/verify`, { order_id: unpaidOrder.id });
    const exit = res.data.data.exit_verification;
    if (exit.exit_status !== 'BLOCKED') throw new Error(`Should be BLOCKED, got ${exit.exit_status}`);
    if (exit.gate_status !== 'RED') throw new Error(`Gate should be RED, got ${exit.gate_status}`);
    console.log(`   Exit: ${exit.exit_status} (${exit.gate_status} gate)`);
  }));

  results.push(await test('2.6: Verify unpaid item is identified', async () => {
    const res = await axios.post(`${API}/exit/verify`, { order_id: unpaidOrder.id });
    const exit = res.data.data.exit_verification;
    const unpaidItems = exit.unpaid_items || [];
    if (unpaidItems.length === 0) throw new Error('Should have unpaid items');
    console.log(`   Unpaid items found:`);
    unpaidItems.forEach(item => console.log(`   - ${item.product_name} (₹${item.price})`));
  }));

  // ==================== RESULTS ====================
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║              TEST RESULTS SUMMARY                  ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const total = results.length;

  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Total: ${total}\n`);

  if (failed === 0) {
    console.log('🎉 ALL PHASE 3 TESTS PASSED!\n');
    console.log('✅ Successful Checkout Flow Works:');
    console.log('   - NFC demo detected 4 products');
    console.log('   - Order created successfully');
    console.log('   - Payment processed');
    console.log('   - Exit APPROVED (GREEN gate)\n');

    console.log('✅ Unpaid Item Security Flow Works:');
    console.log('   - NFC demo detected 4 products');
    console.log('   - Payment processed');
    console.log('   - 1 item marked as unpaid');
    console.log('   - Exit BLOCKED (RED gate)');
    console.log('   - Exact unpaid item identified\n');
  } else {
    console.log(`⚠️  ${failed} test(s) failed\n`);
  }

  return { passed, failed, total, results };
};

runTests().catch(err => {
  console.error('Test suite error:', err.message);
  process.exit(1);
});
