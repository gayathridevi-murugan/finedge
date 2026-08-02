import { create } from 'zustand';

export const useCheckoutStore = create((set) => ({
  // Screen flow state
  currentScreen: 'welcome',
  previousScreen: null,
  demoMode: null,
  shoppingMode: null,

  // Cart and order data
  sessionId: null,
  cartId: null,
  cartItems: [],
  cartTotal: 0,
  orderId: null,
  orderNumber: null,

  // Separate carts for each mode
  smartShoppingCartId: null,
  smartShoppingCartItems: [],
  smartShoppingCartTotal: 0,
  nfcSelfCheckoutCartId: null,
  nfcSelfCheckoutCartItems: [],
  nfcSelfCheckoutCartTotal: 0,

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

  // Group Shopping state
  groupSessionId: null,
  groupShoppers: [],
  currentShopperIndex: 0,
  groupCompletedShoppers: [],
  groupPhase: 'select-count', // 'select-count', 'shopping', 'complete'
  groupTotal: 0,

  // UI state
  isLoading: false,
  error: null,

  // Actions
  setCurrentScreen: (screen) => set((state) => ({ previousScreen: state.currentScreen, currentScreen: screen })),
  setPreviousScreen: (screen) => set({ previousScreen: screen }),
  setShoppingMode: (mode) => set({ shoppingMode: mode }),
  setDemoMode: (mode) => set({ demoMode: mode }),
  setSessionId: (sessionId) => set({ sessionId }),
  setCartId: (cartId) => set({ cartId }),
  setCartItems: (items) => set({ cartItems: items }),
  setCartTotal: (total) => set({ cartTotal: total }),

  // Smart Shopping cart actions
  setSmartShoppingCartId: (cartId) => set({ smartShoppingCartId: cartId }),
  setSmartShoppingCartItems: (items) => set({ smartShoppingCartItems: items }),
  setSmartShoppingCartTotal: (total) => set({ smartShoppingCartTotal: total }),

  // NFC Self Checkout cart actions
  setNFCSelfCheckoutCartItems: (items) => set({ nfcSelfCheckoutCartItems: items }),
  setNFCSelfCheckoutCartTotal: (total) => set({ nfcSelfCheckoutCartTotal: total }),
  setNFCSelfCheckoutCartId: (cartId) => set({ nfcSelfCheckoutCartId: cartId }),

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

  // Group Shopping actions
  setGroupSessionId: (id) => set({ groupSessionId: id }),
  setGroupShoppers: (shoppers) => set({ groupShoppers: shoppers }),
  setCurrentShopperIndex: (index) => set({ currentShopperIndex: index }),
  setGroupCompletedShoppers: (shoppers) => set({ groupCompletedShoppers: shoppers }),
  setGroupPhase: (phase) => set({ groupPhase: phase }),
  setGroupTotal: (total) => set({ groupTotal: total }),

  reset: () => set({
    currentScreen: 'welcome',
    previousScreen: null,
    demoMode: null,
    shoppingMode: null,
    sessionId: null,
    cartId: null,
    cartItems: [],
    cartTotal: 0,
    smartShoppingCartId: null,
    smartShoppingCartItems: [],
    smartShoppingCartTotal: 0,
    nfcSelfCheckoutCartId: null,
    nfcSelfCheckoutCartItems: [],
    nfcSelfCheckoutCartTotal: 0,
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
    groupSessionId: null,
    groupShoppers: [],
    currentShopperIndex: 0,
    groupCompletedShoppers: [],
    groupPhase: 'select-count',
    groupTotal: 0,
    isLoading: false,
    error: null
  })
}));
