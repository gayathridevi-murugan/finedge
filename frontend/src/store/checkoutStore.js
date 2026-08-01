import { create } from 'zustand';

export const useCheckoutStore = create((set) => ({
  // Screen flow state
  currentScreen: 'welcome',
  demoMode: null,

  // Cart and order data
  sessionId: null,
  cartId: null,
  cartItems: [],
  cartTotal: 0,
  orderId: null,
  orderNumber: null,

  // Payment state
  paymentStatus: null,
  paymentAmount: 0,
  splitPayment: null,

  // Receipt and loyalty
  receipt: null,
  loyaltyPointsEarned: 0,
  loyaltyTier: 'SILVER',

  // Exit verification
  exitStatus: null,
  gateStatus: null,
  unpaidItems: [],

  // NFC scanning
  isScanning: false,
  detectedProducts: [],
  scannedTags: [],

  // UI state
  isLoading: false,
  error: null,

  // Actions
  setCurrentScreen: (screen) => set({ currentScreen: screen }),
  setDemoMode: (mode) => set({ demoMode: mode }),
  setSessionId: (sessionId) => set({ sessionId }),
  setCartId: (cartId) => set({ cartId }),
  setCartItems: (items) => set({ cartItems: items }),
  setCartTotal: (total) => set({ cartTotal: total }),
  setOrderId: (orderId) => set({ orderId }),
  setOrderNumber: (number) => set({ orderNumber: number }),
  setPaymentStatus: (status) => set({ paymentStatus: status }),
  setSplitPayment: (splitData) => set({ splitPayment: splitData }),
  setReceipt: (receipt) => set({ receipt }),
  setLoyaltyPoints: (points, tier) => set({ loyaltyPointsEarned: points, loyaltyTier: tier }),
  setExitStatus: (status, gate, unpaid) => set({ exitStatus: status, gateStatus: gate, unpaidItems: unpaid }),
  setIsScanning: (scanning) => set({ isScanning: scanning }),
  setDetectedProducts: (products) => set({ detectedProducts: products }),
  setError: (error) => set({ error }),
  setIsLoading: (loading) => set({ isLoading: loading }),

  reset: () => set({
    currentScreen: 'welcome',
    demoMode: null,
    sessionId: null,
    cartId: null,
    cartItems: [],
    cartTotal: 0,
    orderId: null,
    orderNumber: null,
    paymentStatus: null,
    paymentAmount: 0,
    splitPayment: null,
    receipt: null,
    loyaltyPointsEarned: 0,
    loyaltyTier: 'SILVER',
    exitStatus: null,
    gateStatus: null,
    unpaidItems: [],
    isScanning: false,
    detectedProducts: [],
    scannedTags: [],
    isLoading: false,
    error: null
  })
}));
