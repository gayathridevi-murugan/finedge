# Architectural Audit: Smart NFC Shopping vs NFC Self Checkout Separation

**Date:** August 2, 2026  
**Status:** Critical Issues Found  
**Severity:** HIGH - Payment Flow Broken for Smart Shopping

---

## Executive Summary

The project has **attempted to separate** Smart NFC Shopping and NFC Self Checkout into independent cart systems, but the separation is **incomplete and broken**. Smart NFC Shopping has no backend cart persistence, causing the payment flow to fail when trying to create an order from a null cart ID.

---

## 1. ROUTES & NAVIGATION

### Frontend Navigation (State-Based Routing)
**File:** `src/App.js`
- Uses Zustand `currentScreen` state for routing
- No traditional URL-based routing (no React Router)
- Entry points:
  - `'smart-shopping'` → SmartNFCShoppingDashboard
  - `'nfc-self-checkout'` → NFCSelfCheckout
  - `'cart'` → CartPage
  - `'payment'` → Payment

### Navigation Flow
```
Welcome
  ↓
Overview Dashboard
  ├→ Smart NFC Shopping → Cart → Payment
  └→ NFC Self Checkout → Cart → Payment
```

**Issue Found:** Both features navigate to the same Cart and Payment pages, but they use different state stores and don't properly coordinate.

---

## 2. CART STATE MANAGEMENT

### Zustand Store (src/store/checkoutStore.js)

**Separation Attempt - PARTIAL SUCCESS:**
```javascript
// Generic cart (backward compatibility)
cartItems: []
cartTotal: 0
cartId: null

// Smart Shopping cart (lines 18-19)
smartShoppingCartItems: []
smartShoppingCartTotal: 0

// NFC Self Checkout cart (lines 20-22)
nfcSelfCheckoutCartItems: []
nfcSelfCheckoutCartTotal: 0
nfcSelfCheckoutCartId: null  ← Only Self Checkout has cartId!
```

**Critical Issues:**
1. **Smart Shopping has NO cartId** - No backend persistence identifier
2. **Generic cart fields still exist** - Unused and cause confusion
3. **paymentAmount field never set** - Remains 0 throughout (line 26)
4. **setters exist but inconsistently used** - Some components use generic, some use mode-specific

### Setters for Separate Carts:
- `setSmartShoppingCartItems()` / `setSmartShoppingCartTotal()`
- `setNFCSelfCheckoutCartItems()` / `setNFCSelfCheckoutCartTotal()`
- `setNFCSelfCheckoutCartId()` ← Only for NFC Self Checkout

---

## 3. PRODUCT SCANNING & CART ADDITION

### SmartNFCShoppingDashboard (src/pages/SmartNFCShoppingDashboard.jsx)

**Flow:**
1. Lines 8-11: Gets `smartShoppingCartItems` and setters from store
2. Line 76-164: `handleSimulateNFCTap()` scans an NFC tag
3. Line 101: Calls `scanNFCTag(tagId)` to backend
4. Lines 127-147: **Adds product to LOCAL store ONLY**
   - No backend cart creation
   - No backend cart persistence
   - Only updates Zustand state
5. Line 73: Redirects to cart after adding

**Initial Quantity:** `quantity: 1` (lines 63, 144)

**Critical Issue:** NO BACKEND CART EXISTS FOR SMART SHOPPING

```javascript
// Smart Shopping only updates Zustand
setCartItems(newCartItems);  // Local state only
setCartTotal(total);         // Local state only
setCurrentScreen('cart');    // Navigate to cart
```

---

### NFCSelfCheckout (src/pages/NFCSelfCheckout.jsx)

**Flow:**
1. Lines 8-13: Gets `nfcSelfCheckoutCartId`, `nfcSelfCheckoutCartItems` from store
2. Lines 22-37: **Creates backend cart on mount** via `POST /cart/create`
   - Stores `cartId` in state
3. Line 72-152: `handleSimulateNFCTap()` scans an NFC tag
4. Lines 114-130: **Adds product to LOCAL store** (Zustand)
5. Lines 133-141: **Attempts to persist to backend** via `POST /cart/{cartId}/add`
6. Lines 128-130: Updates local state with totals

**Initial Quantity:** `quantity: 1` (line 124)

**Backend Persistence:** ✓ YES
```javascript
await apiClient.post(`/cart/${cartId}/add`, {
  products: [{ product_id: randomProduct.id, quantity: existingItem ? 1 : 1 }]
});
```

---

## 4. CART PAGE LOGIC

### CartPage (src/pages/CartPage.jsx)

**Smart Detection (Lines 32-45):**
```javascript
const isSmartShopping = previousScreen === 'smart-shopping';
const isNFCSelfCheckout = previousScreen === 'nfc-self-checkout';

// Selects appropriate cart based on origin
const cartId = isSmartShopping ? smartCartId : nfcCartId;
const cartItems = isSmartShopping ? smartCartItems : nfcCartItems;
const cartTotal = isSmartShopping ? smartCartTotal : nfcCartTotal;
```

**Issue:** Smart Shopping cart ID is hardcoded to `null` (line 11)
```javascript
const smartCartId = null;  // ← NO BACKEND CART!
```

**Backend Load (Lines 48-67):**
- Only loads from backend if `cartId && cartItems.length === 0`
- Smart Shopping will never load (cartId is null)
- NFC Self Checkout will load if empty

**Quantity Update (Lines 69-89):**
- Calls `POST /cart/{cartId}/update-quantity` (line 81)
- **ENDPOINT DOES NOT EXIST** - Backend has no `/update-quantity` route
- Update fails silently, only updates local state

**Item Removal (Lines 91-107):**
- Calls `POST /cart/{cartId}/remove` (line 100)
- **ENDPOINT DOES NOT EXIST** - Backend has no dedicated `/remove` route
- Only generic `POST /remove` exists (expects `{cart_id, product_id}` in body)
- Removal fails silently, only updates local state

---

## 5. CART BACKEND API ISSUES

### Cart Routes (backend/routes/cart.js)

**Existing Endpoints:**
- `POST /cart/create` - ✓ Works
- `GET /cart/:cart_id` - ✓ Works
- `POST /cart/:cart_id/add` - ✓ Works
- `POST /cart/add` - ✓ Works (but requires cart_id in body)
- `POST /cart/remove` - ✓ Works (requires cart_id in body)

**Missing Endpoints:**
- ❌ `POST /cart/:cart_id/update-quantity` - Called by CartPage.jsx line 81
- ❌ `POST /cart/:cart_id/remove` - Called by CartPage.jsx line 100

**Issue:** Frontend assumes route structure that doesn't match backend

---

## 6. PAYMENT FLOW

### Payment.js (src/pages/Payment.js)

**Cart Source Selection (Lines 18-20):**
```javascript
const cartTotal = previousScreen === 'smart-shopping' ? smartCartTotal : nfcCartTotal;
const cartId = nfcCartId;  // ← ALWAYS uses NFCSelfCheckout cartId!
```

**Critical Bug:** Line 20 always uses `nfcCartId`, even for Smart Shopping!

**Order Creation (Lines 46-58):**
```javascript
if (!finalOrderId) {
  const orderResponse = await createOrderFromCart(cartId, null);
  // For Smart Shopping: cartId = null
  // For NFC Self Checkout: cartId = valid UUID
}
```

**Backend Validation (backend/routes/orders.js line 9):**
```javascript
if (!cart_id) {
  return res.status(400).json({
    success: false,
    error: { message: 'cart_id is required' }
  });
}
```

**Result:** Smart Shopping payment FAILS because `cartId = null`

### Amount Calculation (Lines 33-36):
```javascript
const safeCartTotal = parseFloat(cartTotal || 0);
const tax = parseFloat((safeCartTotal * taxRate).toFixed(2));
const finalTotal = parseFloat((safeCartTotal + tax).toFixed(2));
```

**If cartTotal is 0:** finalTotal = 0
**Zero Amount Issue Source:** Likely from cart not being created/populated correctly

---

## 7. QUANTITY INITIALIZATION SUMMARY

| Component | Initial Quantity | Source |
|-----------|------------------|--------|
| SmartNFCShoppingDashboard | `quantity: 1` | Hardcoded in component |
| NFCSelfCheckout | `quantity: 1` | Hardcoded in component |
| Backend CartItem | `quantity: 1` | Default in model (line 8, CartItem.js) |

All components correctly set quantity to 1 when a new product is added.

---

## 8. DATA FLOW DIAGRAMS

### Smart NFC Shopping (BROKEN)
```
SmartNFCShoppingDashboard
    ↓ (scan NFC tag)
scanNFCTag() → Backend NFC API ✓
    ↓ (get product)
Extract price from response
    ↓ (add to cart)
Zustand Store (local only)
    ↓
CartPage (previousScreen = 'smart-shopping')
    ↓ (read from store)
Payment.js
    ├→ cartId = nfcCartId (null) ❌
    ├→ cartTotal = smartCartTotal (from Zustand)
    ↓ (create order)
createOrderFromCart(null, null) → FAILS ❌
```

### NFC Self Checkout (WORKS)
```
NFCSelfCheckout
    ↓ (mount)
POST /cart/create → Creates backend cart ✓
    ↓ (scan NFC tag)
scanNFCTag() → Backend NFC API ✓
    ↓ (add to cart)
Zustand Store + 
POST /cart/{cartId}/add → Backend ✓
    ↓
CartPage (previousScreen = 'nfc-self-checkout')
    ├→ cartId = nfcCartId ✓
    ├→ cartItems = nfcSelfCheckoutCartItems ✓
    ├→ cartTotal = nfcSelfCheckoutCartTotal ✓
    ↓ (manage cart)
POST /cart/{cartId}/update-quantity → FAILS (endpoint missing) ❌
POST /cart/{cartId}/remove → FAILS (endpoint missing) ❌
    ↓ (proceed to payment)
Payment.js
    ├→ cartId = nfcCartId ✓
    ├→ cartTotal = nfcCartTotal ✓
    ↓ (create order)
createOrderFromCart(cartId, null) → Works ✓
    ↓ (process payment)
processPayment() → Success ✓
```

---

## 9. ZERO AMOUNT PAYMENT ISSUE

### Root Cause Analysis

The zero amount payment issue could occur in these scenarios:

#### Scenario 1: Smart NFC Shopping Path
1. User scans products in SmartNFCShoppingDashboard
2. Products added to `smartShoppingCartTotal` (local store)
3. User clicks "Checkout" → navigates to Payment
4. Payment.js reads `cartTotal = smartCartTotal` ✓ (has value)
5. Calculates `finalTotal = cartTotal + tax` ✓ (should have value)

**This path should work IF the cart has items.**

#### Scenario 2: NFC Self Checkout Path
1. User scans products in NFCSelfCheckout
2. Products added to both:
   - `nfcSelfCheckoutCartItems` (Zustand)
   - Backend cart via `POST /cart/{cartId}/add`
3. Backend calculates `total_amount` from CartItem subtotals ✓
4. Local state also updates `nfcSelfCheckoutCartTotal` ✓
5. User navigates to Cart → Payment
6. Payment reads `cartTotal = nfcCartTotal` (from Zustand, not backend)

**Problem:** If user modifies cart quantities in CartPage, local state updates but backend doesn't (endpoints missing), then Payment uses stale local total!

#### Scenario 3: Cart Not Persisted
- If backend cart fails to add items
- Local state has items but backend has empty cart
- Order created with items but total_amount = 0 from backend
- Payment amount calculated from local state (correct)
- But order total_amount doesn't match

---

## 10. ARCHITECTURE ISSUES SUMMARY

### Critical Issues (Must Fix)

1. **Smart Shopping Has No Backend Cart**
   - Location: SmartNFCShoppingDashboard.jsx (lines 76-164)
   - Impact: Payment flow completely broken for Smart Shopping
   - Fix: Create backend cart on mount (like NFCSelfCheckout does)

2. **Payment.js Uses Wrong cartId for Smart Shopping**
   - Location: Payment.js line 20
   - Impact: Smart Shopping can't create orders
   - Fix: Conditionally select correct cartId based on previousScreen

3. **Missing Backend Endpoints**
   - Missing: `POST /cart/{cartId}/update-quantity`
   - Missing: `POST /cart/{cartId}/remove`
   - Impact: Cart modifications fail silently
   - Fix: Implement these endpoints in backend/routes/cart.js

4. **Backend Remove Endpoint Signature Mismatch**
   - Frontend calls: `POST /cart/{cartId}/remove` with product_id in URL params
   - Backend expects: `POST /cart/remove` with `{cart_id, product_id}` in body
   - Fix: Either update frontend calls or add new parameterized endpoint

5. **Generic Cart Fields Never Used**
   - Lines 12-14 in checkoutStore.js
   - Causes confusion about which cart is "the" cart
   - Fix: Remove generic cart fields, use only mode-specific fields

### Medium Issues

6. **Product Price Zero Bug**
   - If product.price is null from database, frontend should validate
   - Currently: `parseFloat(null) = NaN`, calculations break
   - Fix: Add validation in NFC scan response

7. **Quantity Calculation Bug in NFCSelfCheckout**
   - Line 136: `quantity: existingItem ? 1 : 1` (always 1)
   - Intent unclear: should increment or add 1?
   - Fix: Clarify logic or use `existingItem ? existing.quantity + 1 : 1`

---

## 11. CURRENT STATE BY FEATURE

### Smart NFC Shopping Status: ❌ BROKEN

| Component | Status | Issue |
|-----------|--------|-------|
| NFC Scanning | ✓ Works | |
| Local Cart | ✓ Works | No backend persistence |
| Cart Display | ✓ Works | Reads from Zustand |
| Order Creation | ❌ Fails | cartId = null |
| Payment | ❌ Fails | No valid order |

### NFC Self Checkout Status: ⚠️ PARTIALLY BROKEN

| Component | Status | Issue |
|-----------|--------|-------|
| Cart Creation | ✓ Works | Creates on mount |
| NFC Scanning | ✓ Works | |
| Add to Cart | ✓ Works | Both local & backend |
| Cart Display | ✓ Works | Reads from Zustand |
| Cart Modification | ❌ Fails | Missing backend endpoints |
| Order Creation | ✓ Works | Has valid cartId |
| Payment | ✓ Works | Amount calculated correctly |

---

## 12. SEPARATION WORK ANALYSIS

### What Was Done Right
1. ✓ Separate Zustand state fields created
2. ✓ Separate setter functions created
3. ✓ CartPage intelligently selects cart based on previousScreen
4. ✓ NFC Self Checkout has backend cart infrastructure

### What Was Done Wrong
1. ❌ Smart Shopping never creates backend cart
2. ❌ Smart Shopping cartId remains null throughout
3. ❌ Payment.js doesn't properly handle both modes
4. ❌ Backend cart endpoints incomplete
5. ❌ Generic cart fields left in, causing confusion
6. ❌ No validation of separation (no tests)

### What Wasn't Done
1. ❌ Create backend cart in SmartNFCShoppingDashboard
2. ❌ Update Payment.js to handle Smart Shopping cartId
3. ❌ Implement missing cart update endpoints
4. ❌ Add integration tests for both flows
5. ❌ Add checkout tests for payment with both cart types
6. ❌ Documentation of expected behavior

---

## 13. RECOMMENDED FIXES (Priority Order)

### Priority 1: Fix Payment Flow (CRITICAL)
**File:** `src/pages/SmartNFCShoppingDashboard.jsx`
```javascript
// Add cart initialization on mount (useEffect)
useEffect(() => {
  const initializeCart = async () => {
    try {
      const response = await apiClient.post('/cart/create', {});
      if (response.data.success) {
        setSmartShoppingCartId(response.data.data.cart_id);  // Add to store
      }
    } catch (error) {
      console.warn('Could not initialize cart:', error);
    }
  };
  
  // Initialize only once
  initializeCart();
}, []);
```

**File:** `src/store/checkoutStore.js`
```javascript
// Add missing setter and state
smartShoppingCartId: null,  // Add this
setSmartShoppingCartId: (cartId) => set({ smartShoppingCartId: cartId }),  // Add this
```

**File:** `src/pages/SmartNFCShoppingDashboard.jsx` (in handleAddToCart)
```javascript
// Persist to backend
if (smartShoppingCartId) {
  try {
    await apiClient.post(`/cart/${smartShoppingCartId}/add`, {
      products: [{ product_id: selectedProduct.id, quantity: 1 }]
    });
  } catch (error) {
    console.warn('Could not persist to backend:', error);
  }
}
```

### Priority 2: Fix Payment.js
**File:** `src/pages/Payment.js` (lines 18-20)
```javascript
const isSmartShopping = previousScreen === 'smart-shopping';
const cartItems = isSmartShopping ? smartCartItems : nfcCartItems;
const cartTotal = isSmartShopping ? smartCartTotal : nfcCartTotal;
const cartId = isSmartShopping ? smartShoppingCartId : nfcCartId;  // FIX THIS
```

### Priority 3: Add Missing Backend Endpoints
**File:** `backend/routes/cart.js`
```javascript
// Add update-quantity endpoint
router.post('/:cart_id/update-quantity', asyncHandler(async (req, res) => {
  const { cart_id } = req.params;
  const { product_id, quantity } = req.body;
  
  const updatedCart = await cartService.updateItemQuantity(cart_id, product_id, quantity);
  
  res.json({
    success: true,
    data: {
      message: 'Quantity updated',
      cart_id: updatedCart.id,
      items: updatedCart.items,
      total_amount: updatedCart.total_amount
    }
  });
}));

// Add remove endpoint with cart_id parameter
router.post('/:cart_id/remove', asyncHandler(async (req, res) => {
  const { cart_id } = req.params;
  const { product_id } = req.body;
  
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
```

### Priority 4: Clean Up Store
**File:** `src/store/checkoutStore.js`
```javascript
// Remove unused generic cart fields
// Delete: cartItems, cartTotal, cartId (lines 12-14)
// Use only: smartShoppingCartItems/Total/Id, nfcSelfCheckoutCartItems/Total/Id
```

### Priority 5: Add Tests
Create test files to validate:
- Smart Shopping cart creation and order flow
- NFC Self Checkout cart persistence
- Payment amount calculation for both modes
- Cart modification endpoints

---

## 14. FILE REFERENCE GUIDE

### Frontend
| File | Purpose | Issues |
|------|---------|--------|
| `src/App.js` | Main router via currentScreen | None |
| `src/store/checkoutStore.js` | Zustand store | Generic fields, missing smartShoppingCartId |
| `src/pages/SmartNFCShoppingDashboard.jsx` | Smart shopping UI | No backend cart creation |
| `src/pages/NFCSelfCheckout.jsx` | NFC self-checkout UI | Works correctly |
| `src/pages/CartPage.jsx` | Cart management | Calls missing endpoints |
| `src/pages/Payment.js` | Payment processing | Wrong cartId for Smart Shopping |
| `src/services/api.js` | API client | Correct endpoints |

### Backend
| File | Purpose | Issues |
|------|---------|--------|
| `backend/routes/cart.js` | Cart endpoints | Missing update-quantity, parameterized remove |
| `backend/services/cartService.js` | Cart business logic | Works correctly |
| `backend/routes/orders.js` | Order creation | Requires cartId (correct) |
| `backend/services/orderService.js` | Order logic | Works correctly |
| `backend/routes/payments.js` | Payment processing | Works correctly |
| `backend/models/Cart.js` | Cart schema | Works correctly |
| `backend/models/CartItem.js` | Cart item schema | Works correctly |

---

## 15. TESTING MATRIX

### Test Scenarios to Validate

| Scenario | Steps | Expected | Actual | Status |
|----------|-------|----------|--------|--------|
| Smart Shopping Order | Scan → Add → Cart → Payment | Amount > 0 | ? | Unknown |
| NFC Self Checkout Order | Scan → Add → Cart → Payment | Amount > 0 | ? | Unknown |
| Smart Shopping Qty Update | Cart → Qty+1 → Save | Qty updates | Fails silently | ❌ |
| NFC SC Qty Update | Cart → Qty+1 → Save | Qty updates | Fails silently | ❌ |
| Smart Shopping Remove | Cart → Delete → Save | Item removed | Fails silently | ❌ |
| NFC SC Remove | Cart → Delete → Save | Item removed | Fails silently | ❌ |
| Order Creation Smart | Payment → Pay Now | Order created | Fails (no cartId) | ❌ |
| Order Creation NFC SC | Payment → Pay Now | Order created | Works | ✓ |

---

## Conclusion

The separation work was started but **not completed**. Smart NFC Shopping lacks critical backend infrastructure, while NFC Self Checkout is mostly functional but has missing API endpoints. Both features converge at the Payment page, but proper cartId handling is incomplete.

The zero amount payment issue most likely occurs when:
1. Smart Shopping attempts payment with null cartId (order creation fails)
2. OR cart modifications fail silently, causing total_amount mismatch between frontend and backend

All issues are fixable with the recommendations above.
