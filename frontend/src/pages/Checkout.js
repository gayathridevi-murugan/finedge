import React, { useState } from 'react';
import {
  simulatorService, nfcService, cartService, orderService,
  paymentService, receiptService, loyaltyService, exitService
} from '../services/api';
import { useCheckoutStore } from '../store/checkoutStore';
import '../styles/Checkout.css';

export default function Checkout({ onCheckoutComplete, onBack }) {
  const [step, setStep] = useState('cart');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const {
    cartId, setCartId, cartItems, setCartItems, cartTotal, setCartTotal,
    orderId, setOrderId, orderNumber, setOrderNumber, setPaymentStatus,
    setLoyaltyPoints, setExitStatus, setGateStatus
  } = useCheckoutStore();

  const startCheckout = async () => {
    try {
      setError(null);
      setLoading(true);

      // Create cart
      const cartRes = await cartService.createCart();
      const newCartId = cartRes.data.data.cart_id;
      setCartId(newCartId);

      // Load demo products
      const demoRes = await simulatorService.getDemoData();
      const products = demoRes.data.data.sample_tags.slice(0, 2);

      // Scan and add items
      let total = 0;
      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        const nfcRes = await nfcService.scan(product.tag_id);
        const productId = nfcRes.data.data.product.id;

        const qty = i === 0 ? 2 : 1;
        const addRes = await cartService.addItem(newCartId, productId, qty);
        total = addRes.data.data.total_amount;
      }

      const cart = await cartService.getCart(newCartId);
      setCartItems(cart.data.data.items);
      setCartTotal(total);
      setSuccess('Items added to cart!');
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const completeCheckout = async () => {
    try {
      setError(null);
      setLoading(true);

      // Create order
      const orderRes = await orderService.create(cartId);
      const newOrderId = orderRes.data.data.order.id;
      const newOrderNum = orderRes.data.data.order.order_number;
      setOrderId(newOrderId);
      setOrderNumber(newOrderNum);

      // Process payment
      const payRes = await paymentService.process(newOrderId, cartTotal, 'CREDIT_CARD');
      setPaymentStatus(payRes.data.data.payment.status);

      // Generate receipt
      const recRes = await receiptService.generate(newOrderId);
      const points = recRes.data.data.receipt.loyalty_points_earned;
      setLoyaltyPoints(points);

      // Add loyalty points
      try {
        await loyaltyService.addPoints('guest-customer', newOrderId, points);
      } catch (e) {
        console.log('Loyalty points skipped');
      }

      // Verify exit
      const exitRes = await exitService.verify(newOrderId);
      setExitStatus(exitRes.data.data.exit_verification.exit_status);
      setGateStatus(exitRes.data.data.exit_verification.gate_status);

      setSuccess('Checkout complete!');
      setTimeout(onCheckoutComplete, 1500);
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout">
      <div className="header">
        <button className="btn-back" onClick={onBack}>Back</button>
        <h1>Shopping Checkout</h1>
      </div>

      <div className="main-content">
        {step === 'cart' && (
          <div className="section">
            <h2>Shopping Cart</h2>
            {cartItems.length === 0 ? (
              <>
                <p>No items in cart</p>
                <button className="btn btn-primary" onClick={startCheckout} disabled={loading}>
                  {loading ? 'Loading...' : 'Start Shopping'}
                </button>
              </>
            ) : (
              <>
                <table className="cart-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cartItems.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.product_name}</td>
                        <td>{item.quantity}</td>
                        <td>${item.unit_price?.toFixed(2) || '0.00'}</td>
                        <td>${item.subtotal?.toFixed(2) || '0.00'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="summary">
                  <strong>Total: ${cartTotal?.toFixed(2) || '0.00'}</strong>
                  <button className="btn btn-primary" onClick={completeCheckout} disabled={loading}>
                    {loading ? 'Processing...' : 'Complete Checkout'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
      </div>
    </div>
  );
}
