class SimulatorService {
  async getDemoData() {
    // Return hardcoded demo data - simple and reliable
    return {
      available_tags: 8,
      sample_tags: [
        { tag_id: 'DEMO_0001', product_name: 'Organic Milk 1L', price: 3.99 },
        { tag_id: 'DEMO_0002', product_name: 'Whole Wheat Bread', price: 2.50 },
        { tag_id: 'DEMO_0003', product_name: 'Butter 250g', price: 4.50 },
        { tag_id: 'DEMO_0004', product_name: 'Apple Juice 500ml', price: 2.99 },
        { tag_id: 'DEMO_0005', product_name: 'Cheddar Cheese', price: 5.99 },
        { tag_id: 'DEMO_0006', product_name: 'Eggs (12 pack)', price: 3.49 },
        { tag_id: 'DEMO_0007', product_name: 'Greek Yogurt 500g', price: 4.29 },
        { tag_id: 'DEMO_0008', product_name: 'Tomato Soup', price: 1.99 }
      ],
      sample_customers: []
    };
  }
}

module.exports = new SimulatorService();
