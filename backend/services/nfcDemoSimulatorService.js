const cartService = require('./cartService');
const nfcService = require('./nfcService');

class NFCDemoSimulatorService {
  // Demo scenarios with their NFC tag sequences
  SCENARIOS = {
    'successful-checkout': {
      name: 'Successful Checkout',
      description: '4 products detected and paid successfully',
      tags: ['DEMO_0001', 'DEMO_0002', 'DEMO_0003', 'DEMO_0004'],
      payAll: true,
      groupSession: false
    },
    'unpaid-item': {
      name: 'Unpaid Item Detection',
      description: '4 products scanned but only 3 paid',
      tags: ['DEMO_0001', 'DEMO_0002', 'DEMO_0003', 'DEMO_0004'],
      payAll: false,
      paidCount: 3,
      groupSession: false
    },
    'payment-failure': {
      name: 'Payment Failure Handling',
      description: '3 products with payment decline scenario',
      tags: ['DEMO_0001', 'DEMO_0002', 'DEMO_0005'],
      payAll: false,
      forcePaymentFailure: true,
      groupSession: false
    },
    'group-shopping': {
      name: 'Group Shopping',
      description: '3 people share items (6 products)',
      tags: ['DEMO_0001', 'DEMO_0002', 'DEMO_0003', 'DEMO_0004', 'DEMO_0005', 'DEMO_0006'],
      payAll: true,
      groupSession: true,
      groupMembers: 3
    }
  };

  // NFC terminal animation sequence
  generateNFCSequence(scenarioKey) {
    const scenario = this.SCENARIOS[scenarioKey];
    if (!scenario) throw new Error(`Unknown scenario: ${scenarioKey}`);

    const tagCount = scenario.tags.length;
    const steps = [];
    let stepNum = 1;

    // Step 1: Terminal initialization
    steps.push({
      step: stepNum++,
      action: 'TERMINAL_ACTIVATE',
      message: 'NFC TERMINAL ACTIVATING',
      status: 'initializing',
      duration: 800
    });

    // Step 2: Reader ready
    steps.push({
      step: stepNum++,
      action: 'READER_READY',
      message: 'NFC READER ACTIVE',
      status: 'ready',
      duration: 500
    });

    // Step 3: Start scanning
    steps.push({
      step: stepNum++,
      action: 'START_SCANNING',
      message: 'DETECTING TAGS...',
      status: 'scanning',
      duration: 500
    });

    // Steps 4 to 4+tagCount: Individual tag detections
    for (let i = 0; i < tagCount; i++) {
      steps.push({
        step: stepNum++,
        action: 'TAG_DETECTED',
        message: `${scenario.tags[i]} DETECTED`,
        tag_id: scenario.tags[i],
        detected_count: i + 1,
        status: 'detecting',
        duration: 600
      });
    }

    // Final step: Identification complete
    steps.push({
      step: stepNum++,
      action: 'IDENTIFICATION_COMPLETE',
      message: 'IDENTIFYING PRODUCTS...',
      status: 'identifying',
      duration: 800
    });

    // Products ready
    steps.push({
      step: stepNum++,
      action: 'PRODUCTS_READY',
      message: `${tagCount} PRODUCTS DETECTED`,
      status: 'complete',
      products_count: tagCount,
      scenario_info: {
        name: scenario.name,
        payAll: scenario.payAll,
        isGroupSession: scenario.groupSession
      },
      duration: 500,
      next_action: 'AUTO_TRANSITION_TO_CART'
    });

    return {
      scenario_key: scenarioKey,
      scenario_name: scenario.name,
      scenario_description: scenario.description,
      total_steps: steps.length,
      tag_sequence: scenario.tags,
      steps: steps,
      metadata: {
        total_tags: tagCount,
        pay_all_items: scenario.payAll,
        is_group_session: scenario.groupSession,
        total_demo_time_ms: steps.reduce((sum, s) => sum + (s.duration || 0), 0)
      }
    };
  }

  // Create a demo session with cart and products
  async initializeDemoSession(scenarioKey) {
    const scenario = this.SCENARIOS[scenarioKey];
    if (!scenario) throw new Error(`Unknown scenario: ${scenarioKey}`);

    try {
      // Create cart
      const cart = await cartService.createCart(null);

      // Scan all NFC tags (simulating batch scan)
      const batchResult = await nfcService.batchScanNFCTags(scenario.tags);

      if (batchResult.failed.length > 0) {
        console.warn('Some products failed to scan:', batchResult.failed);
      }

      // Add products to cart
      for (const item of batchResult.success) {
        await cartService.addItemToCart(cart.id, item.product_id, 1);
      }

      return {
        session_id: cart.id,
        cart_id: cart.id,
        scenario: scenario.name,
        tags_scanned: scenario.tags,
        products_detected: batchResult.success.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          price: item.price,
          category: item.category,
          tag_id: item.tag_id
        })),
        total_amount: batchResult.success.reduce((sum, item) => sum + parseFloat(item.price), 0),
        metadata: {
          pay_all_items: scenario.payAll,
          is_group_session: scenario.groupSession
        }
      };
    } catch (error) {
      throw new Error(`Failed to initialize demo session: ${error.message}`);
    }
  }

  // Get all available scenarios
  getAvailableScenarios() {
    return Object.entries(this.SCENARIOS).map(([key, scenario]) => ({
      key: key,
      name: scenario.name,
      description: scenario.description,
      tag_count: scenario.tags.length,
      is_group_session: scenario.groupSession
    }));
  }

  // Get scenario details
  getScenarioDetails(scenarioKey) {
    const scenario = this.SCENARIOS[scenarioKey];
    if (!scenario) throw new Error(`Unknown scenario: ${scenarioKey}`);

    return {
      key: scenarioKey,
      name: scenario.name,
      description: scenario.description,
      tags: scenario.tags,
      configuration: {
        pay_all_items: scenario.payAll,
        paid_items_count: scenario.paidCount || scenario.tags.length,
        is_group_session: scenario.groupSession,
        group_members: scenario.groupMembers || 1,
        force_payment_failure: scenario.forcePaymentFailure || false
      }
    };
  }
}

module.exports = new NFCDemoSimulatorService();
