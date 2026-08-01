import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Cart functions
export const createCart = () => apiClient.post('/cart/create', {});

export const addItemToCart = (cartId, productId, quantity) =>
  apiClient.post('/cart/add', { cart_id: cartId, product_id: productId, quantity });

export const addItemsToCart = (cartId, products) =>
  apiClient.post(`/cart/${cartId}/add`, { products });

export const getCart = (cartId) => apiClient.get(`/cart/${cartId}`);

// NFC functions
export const scanNFCTag = (tagId) => apiClient.post('/nfc/scan', { tag_id: tagId });

export const scanMultipleNFC = (tagIds) => apiClient.post('/nfc/batch-scan', { tag_ids: tagIds });

export const validateNFCTag = (tagId) => apiClient.get(`/nfc/validate/${tagId}`);

// Order functions
export const createOrderFromCart = (cartId, customerId) =>
  apiClient.post('/orders/create', { cart_id: cartId, customer_id: customerId });

export const getOrder = (orderId) => apiClient.get(`/orders/${orderId}`);

// Payment functions
export const processPayment = (orderId, amount, method) =>
  apiClient.post('/payments/process', { order_id: orderId, amount, payment_method: method });

export const getPayment = (orderId) => apiClient.get(`/payments/${orderId}`);

// Receipt functions
export const generateReceipt = (orderId, customerId) =>
  apiClient.post('/receipts/generate', { order_id: orderId, customer_id: customerId });

export const getReceipt = (receiptId) => apiClient.get(`/receipts/${receiptId}`);

// Loyalty functions
export const addLoyaltyPoints = (customerId, orderId, points) =>
  apiClient.post('/loyalty/add-points', { customer_id: customerId, order_id: orderId, points });

export const getLoyaltyBalance = (customerId) => apiClient.get(`/loyalty/balance/${customerId}`);

// Exit verification functions
export const verifyExit = (orderId) => apiClient.post('/exit/verify', { order_id: orderId });

export const getExitStatus = (orderId) => apiClient.get(`/exit/${orderId}`);

// Simulator functions
export const getDemoData = () => apiClient.get('/simulator/demo-data');

export const getAvailableTags = () => apiClient.get('/simulator/available-tags');

// Legacy service-based exports for backward compatibility
export const cartService = {
  createCart: () => createCart(),
  addItem: (cartId, productId, quantity) => addItemToCart(cartId, productId, quantity),
  getCart: (cartId) => getCart(cartId)
};

export const nfcService = {
  scan: (tagId) => scanNFCTag(tagId),
  validate: (tagId) => validateNFCTag(tagId)
};

export const orderService = {
  create: (cartId, customerId) => createOrderFromCart(cartId, customerId),
  getOrder: (orderId) => getOrder(orderId)
};

export const paymentService = {
  process: (orderId, amount, method) => processPayment(orderId, amount, method)
};

export const receiptService = {
  generate: (orderId, customerId) => generateReceipt(orderId, customerId)
};

export const loyaltyService = {
  addPoints: (customerId, orderId, points) => addLoyaltyPoints(customerId, orderId, points)
};

export const exitService = {
  verify: (orderId) => verifyExit(orderId)
};

export const simulatorService = {
  getDemoData: () => getDemoData()
};

export const api = apiClient;
export default apiClient;
