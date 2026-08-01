const express = require('express');
const router = express.Router();
const { cartService } = require('../services');
const { asyncHandler } = require('../middleware/errorHandler');

router.post('/create', asyncHandler(async (req, res) => {
  const { customer_id } = req.body;
  const cart = await cartService.createCart(customer_id || null);

  res.status(201).json({
    success: true,
    data: {
      message: 'Cart created successfully',
      cart_id: cart.id,
      customer_id: cart.customer_id,
      items: [],
      total_amount: 0
    }
  });
}));

router.get('/:cart_id', asyncHandler(async (req, res) => {
  const { cart_id } = req.params;
  const cart = await cartService.getCart(cart_id);

  res.json({
    success: true,
    data: {
      id: cart.id,
      customer_id: cart.customer_id,
      items: cart.items,
      total_amount: cart.total_amount,
      item_count: cart.items.length
    }
  });
}));

router.post('/:cart_id/add', asyncHandler(async (req, res) => {
  const { cart_id } = req.params;
  const { products } = req.body;

  if (!cart_id || !products || !Array.isArray(products)) {
    return res.status(400).json({
      success: false,
      error: { message: 'cart_id and products array are required' }
    });
  }

  let updatedCart;
  for (const product of products) {
    updatedCart = await cartService.addItemToCart(
      cart_id,
      product.product_id,
      product.quantity || 1
    );
  }

  res.json({
    success: true,
    data: {
      message: 'Items added to cart',
      cart_id: updatedCart.id,
      items: updatedCart.items,
      total_amount: updatedCart.total_amount,
      total_items: updatedCart.items.length
    }
  });
}));

router.post('/add', asyncHandler(async (req, res) => {
  const { cart_id, product_id, quantity } = req.body;

  if (!cart_id || !product_id) {
    return res.status(400).json({
      success: false,
      error: { message: 'cart_id and product_id are required' }
    });
  }

  const updatedCart = await cartService.addItemToCart(cart_id, product_id, quantity || 1);

  res.json({
    success: true,
    data: {
      message: 'Item added to cart',
      cart_id: updatedCart.id,
      items: updatedCart.items,
      total_amount: updatedCart.total_amount,
      item_count: updatedCart.items.length
    }
  });
}));

router.post('/remove', asyncHandler(async (req, res) => {
  const { cart_id, product_id } = req.body;

  if (!cart_id || !product_id) {
    return res.status(400).json({
      success: false,
      error: { message: 'cart_id and product_id are required' }
    });
  }

  const updatedCart = await cartService.removeItemFromCart(cart_id, product_id);

  res.json({
    success: true,
    data: {
      message: 'Item removed from cart',
      cart_id: updatedCart.id,
      items: updatedCart.items,
      total_amount: updatedCart.total_amount
    }
  });
}));

module.exports = router;
