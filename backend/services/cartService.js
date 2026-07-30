const { v4: uuidv4 } = require('uuid');
const { Product } = require('../models');

class CartService {
  constructor() {
    this.carts = new Map();
  }

  createCart(customerId = null) {
    const cartId = uuidv4();
    this.carts.set(cartId, {
      id: cartId,
      customer_id: customerId,
      items: [],
      total_amount: 0,
      created_at: new Date(),
      updated_at: new Date()
    });
    return this.carts.get(cartId);
  }

  async addItemToCart(cartId, productId, quantity = 1) {
    const cart = this.carts.get(cartId);
    if (!cart) throw new Error(`Cart not found: ${cartId}`);

    const product = await Product.findByPk(productId);
    if (!product) throw new Error(`Product not found: ${productId}`);

    const existingItem = cart.items.find(item => item.product_id === productId);
    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.subtotal = parseFloat((existingItem.unit_price * existingItem.quantity).toFixed(2));
    } else {
      cart.items.push({
        product_id: productId,
        product_name: product.name,
        unit_price: parseFloat(product.price),
        quantity,
        subtotal: parseFloat((parseFloat(product.price) * quantity).toFixed(2))
      });
    }

    cart.total_amount = parseFloat(cart.items.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2));
    cart.updated_at = new Date();
    return cart;
  }

  removeItemFromCart(cartId, productId) {
    const cart = this.carts.get(cartId);
    if (!cart) throw new Error(`Cart not found: ${cartId}`);

    cart.items = cart.items.filter(item => item.product_id !== productId);
    cart.total_amount = parseFloat(cart.items.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2));
    cart.updated_at = new Date();
    return cart;
  }

  updateItemQuantity(cartId, productId, quantity) {
    const cart = this.carts.get(cartId);
    if (!cart) throw new Error(`Cart not found: ${cartId}`);

    const item = cart.items.find(i => i.product_id === productId);
    if (!item) throw new Error(`Item not found in cart`);

    item.quantity = quantity;
    item.subtotal = parseFloat((item.unit_price * quantity).toFixed(2));
    cart.total_amount = parseFloat(cart.items.reduce((sum, i) => sum + i.subtotal, 0).toFixed(2));
    cart.updated_at = new Date();
    return cart;
  }

  getCart(cartId) {
    const cart = this.carts.get(cartId);
    if (!cart) throw new Error(`Cart not found: ${cartId}`);
    return cart;
  }

  clearCart(cartId) {
    const cart = this.carts.get(cartId);
    if (!cart) throw new Error(`Cart not found: ${cartId}`);
    cart.items = [];
    cart.total_amount = 0;
    cart.updated_at = new Date();
    return cart;
  }

  deleteCart(cartId) {
    this.carts.delete(cartId);
  }
}

module.exports = new CartService();
