const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Customer } = require('../models');
const { v4: uuidv4 } = require('uuid');

class AuthService {
  constructor() {
    if (!process.env.JWT_SECRET) {
      throw new Error('FATAL: JWT_SECRET environment variable is not set');
    }
    this.jwtSecret = process.env.JWT_SECRET;
  }

  generateToken(customerId) {
    return jwt.sign(
      { customer_id: customerId },
      this.jwtSecret,
      { expiresIn: '24h' }
    );
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  async registerCustomer(email, password, name) {
    try {
      // Check if customer already exists
      const existingCustomer = await Customer.findOne({ where: { email } });
      if (existingCustomer) {
        throw new Error('Email already registered');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create customer
      const customer = await Customer.create({
        id: uuidv4(),
        email,
        password_hash: hashedPassword,
        name,
        tier: 'SILVER',
        total_spent: 0
      });

      const token = this.generateToken(customer.id);

      return {
        customer: {
          id: customer.id,
          email: customer.email,
          name: customer.name,
          tier: customer.tier
        },
        token
      };
    } catch (error) {
      throw new Error(`Registration failed: ${error.message}`);
    }
  }

  async loginCustomer(email, password) {
    try {
      const customer = await Customer.findOne({ where: { email } });
      if (!customer) {
        throw new Error('Customer not found');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, customer.password_hash || '');
      if (!isPasswordValid) {
        throw new Error('Invalid password');
      }

      const token = this.generateToken(customer.id);

      return {
        customer: {
          id: customer.id,
          email: customer.email,
          name: customer.name,
          tier: customer.tier
        },
        token
      };
    } catch (error) {
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  async getCustomerProfile(customerId) {
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    return {
      id: customer.id,
      email: customer.email,
      name: customer.name,
      tier: customer.tier,
      total_spent: parseFloat(customer.total_spent),
      created_at: customer.createdAt
    };
  }

  async updateCustomerProfile(customerId, data) {
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    // Only allow updating specific fields
    if (data.name) customer.name = data.name;
    if (data.phone) customer.phone = data.phone;
    if (data.address) customer.address = data.address;

    await customer.save();

    return {
      id: customer.id,
      email: customer.email,
      name: customer.name,
      tier: customer.tier
    };
  }
}

module.exports = new AuthService();
