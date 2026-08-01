const { Cart, CartItem, Product } = require('../models');

class CartService {
  async createCart(customerId = null) {
    const cart = await Cart.create({
      customer_id: customerId,
      status: 'ACTIVE',
      total_amount: 0
    });
    return cart;
  }

  async addItemToCart(cartId, productId, quantity = 1) {
    const cart = await Cart.findByPk(cartId);
    if (!cart) throw new Error(`Cart not found: ${cartId}`);

    const product = await Product.findByPk(productId);
    if (!product) throw new Error(`Product not found: ${productId}`);

    let cartItem = await CartItem.findOne({
      where: { cart_id: cartId, product_id: productId }
    });

    const unitPrice = parseFloat(product.price);
    if (cartItem) {
      cartItem.quantity += quantity;
      cartItem.subtotal = parseFloat((unitPrice * cartItem.quantity).toFixed(2));
      await cartItem.save();
    } else {
      cartItem = await CartItem.create({
        cart_id: cartId,
        product_id: productId,
        quantity,
        unit_price: unitPrice,
        subtotal: parseFloat((unitPrice * quantity).toFixed(2))
      });
    }

    await this.updateCartTotal(cartId);
    return await this.getCart(cartId);
  }

  async removeItemFromCart(cartId, productId) {
    await CartItem.destroy({
      where: { cart_id: cartId, product_id: productId }
    });
    await this.updateCartTotal(cartId);
    return await this.getCart(cartId);
  }

  async updateItemQuantity(cartId, productId, quantity) {
    const cartItem = await CartItem.findOne({
      where: { cart_id: cartId, product_id: productId }
    });
    if (!cartItem) throw new Error(`Item not found in cart`);

    cartItem.quantity = quantity;
    cartItem.subtotal = parseFloat((cartItem.unit_price * quantity).toFixed(2));
    await cartItem.save();
    await this.updateCartTotal(cartId);
    return await this.getCart(cartId);
  }

  async getCart(cartId) {
    const cart = await Cart.findByPk(cartId, {
      include: [{
        association: 'items',
        include: [{ association: 'product' }]
      }]
    });
    if (!cart) throw new Error(`Cart not found: ${cartId}`);
    return cart;
  }

  async clearCart(cartId) {
    await CartItem.destroy({ where: { cart_id: cartId } });
    const cart = await Cart.findByPk(cartId);
    cart.total_amount = 0;
    await cart.save();
    return cart;
  }

  async deleteCart(cartId) {
    await CartItem.destroy({ where: { cart_id: cartId } });
    await Cart.destroy({ where: { id: cartId } });
  }

  async updateCartTotal(cartId) {
    const items = await CartItem.findAll({ where: { cart_id: cartId } });
    const total = parseFloat(items.reduce((sum, item) => sum + parseFloat(item.subtotal), 0).toFixed(2));
    await Cart.update({ total_amount: total }, { where: { id: cartId } });
  }
}

module.exports = new CartService();
