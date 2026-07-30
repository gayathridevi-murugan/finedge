const { Customer, Loyalty, Receipt } = require('../models');
const { v4: uuidv4, validate: uuidValidate } = require('uuid');

class LoyaltyService {
  async addLoyaltyPoints(customerId, orderId, points) {
    let customer;

    // Try to find customer by UUID only if it's a valid UUID format
    if (customerId && uuidValidate(customerId)) {
      try {
        customer = await Customer.findByPk(customerId);
      } catch (error) {
        customer = null;
      }
    }

    if (!customer) {
      // Create new customer with generated UUID
      customer = await Customer.create({
        id: uuidv4(),
        name: `Customer ${customerId || 'Unknown'}`,
        email: `customer-${Date.now()}@store.local`,
        loyalty_points: points,
        loyalty_tier: 'SILVER'
      });
    } else {
      customer.loyalty_points = (customer.loyalty_points || 0) + points;
      await this.updateLoyaltyTier(customer);
      await customer.save();
    }

    // Store the actual customer ID for loyalty record
    const actualCustomerId = customer.id;

    if (orderId) {
      await Loyalty.create({
        customer_id: actualCustomerId,
        order_id: orderId,
        transaction_type: 'EARNED',
        points: points,
        description: `Points earned from order ${orderId}`
      });
    }

    return customer;
  }

  async updateLoyaltyTier(customer) {
    const points = customer.loyalty_points || 0;
    if (points >= 500) {
      customer.loyalty_tier = 'PLATINUM';
    } else if (points >= 250) {
      customer.loyalty_tier = 'GOLD';
    } else {
      customer.loyalty_tier = 'SILVER';
    }
  }

  async getLoyaltyBalance(customerId) {
    let customer = null;

    // Try to find customer by UUID only if it's a valid UUID format
    if (customerId && uuidValidate(customerId)) {
      try {
        customer = await Customer.findByPk(customerId);
      } catch (error) {
        customer = null;
      }
    }

    // If not found by ID, try finding by name pattern
    if (!customer && customerId) {
      const customers = await Customer.findAll({
        where: { name: { [require('sequelize').Op.like]: `%${customerId}%` } },
        limit: 1
      }).catch(() => []);
      if (customers.length > 0) customer = customers[0];
    }

    if (!customer) {
      // Return empty balance for non-existent customer
      return {
        customer_id: customerId,
        points: 0,
        tier: 'SILVER',
        transactions: []
      };
    }

    return {
      customer_id: customer.id,
      points: customer.loyalty_points || 0,
      tier: customer.loyalty_tier,
      transactions: await Loyalty.findAll({ where: { customer_id: customer.id } })
    };
  }
}

module.exports = new LoyaltyService();
