# 🧪 SELF CHECKOUT - Final Testing & Verification Guide

**System Status**: ✅ READY FOR PRODUCTION TESTING
**Surfboard Integration**: ✅ ACTIVE (Real API credentials in .env)
**Product Catalog**: ✅ FASHION RETAIL (13 products seeded)

---

## 🚀 QUICK START (5 MINUTES)

### Terminal 1: Backend Setup
```bash
cd backend
npm install
node scripts/init-db.js    # Create database schema
node scripts/seed-data.js  # Seed 13 fashion products
npm start                  # Start backend on :5000
```

### Terminal 2: Frontend Setup
```bash
cd frontend
npm install
npm start                  # Start frontend on :3000
```

### Terminal 3: Browser
```
Open: http://localhost:3000
Click: "START DEMO →"
```

---

## ✅ COMPLETE VERIFICATION CHECKLIST

### Phase 1: System Startup (Verify No Errors)

- [ ] Backend starts successfully
  - Look for: `✅ Database synchronized`
  - Look for: `🚀 SELF CHECKOUT Backend running on http://localhost:5000`
  
- [ ] Database initialized
  - PostgreSQL contains new schema with enhanced Product table
  - Tables: products, nfc_tags, security_tags, merchants, terminals, orders, carts, etc.

- [ ] 13 fashion products seeded
  - Look for: `✅ Created 13 products`
  - Look for: `✅ Created 13 NFC tags`

- [ ] Frontend loads
  - http://localhost:3000 responds
  - Welcome page displays
  - No console errors

---

### Phase 2: Welcome & Navigation (Verify UI Works)

- [ ] Welcome page displays correctly
  - Title: "SELF CHECKOUT"
  - Tagline: "Tap • Shop • Pay • Go"
  - Button: "START DEMO →"

- [ ] Click "START DEMO →"
  - Redirects to Overview Dashboard
  - No errors

- [ ] Sidebar navigation works
  - Sections: SELF CHECKOUT, SHOPPING, PAYMENTS, SECURITY, PRODUCT, MERCHANT, SYSTEM, DASHBOARD
  - All items clickable
  - Active page highlighted

- [ ] Theme toggle works
  - Click theme button (☀️ or 🌙) in header
  - Entire UI switches to light/dark mode
  - Persists on page reload

---

### Phase 3: NFC Scanning & Product Details (Core Feature)

#### 3A: Smart NFC Shopping
- [ ] Navigate to "Smart NFC Shopping"
- [ ] Page title shows: "🛍️ Smart NFC Fashion Shopping"
- [ ] Click "👆 Simulate NFC Tap"
- [ ] System scans a fashion product
- [ ] Product details display with:
  - [ ] Product emoji (👕, 👟, 🎒, etc.)
  - [ ] Brand name (UrbanWear, RunVibe, DenimCo, etc.)
  - [ ] Category & Subcategory
  - [ ] Size (M, L, 42, etc.)
  - [ ] Color
  - [ ] Price in ₹
  - [ ] Rating & review count
  - [ ] Material composition
  - [ ] Care instructions tab shows proper text
  - [ ] Warranty information
  - [ ] Authenticity verified badge

#### 3B: Add to Cart
- [ ] Click "Add to Cart"
- [ ] Item successfully added
- [ ] No errors in console

#### 3C: Scan More Products
- [ ] Click "Simulate NFC Tap" again
- [ ] Different product scanned
- [ ] Can add multiple products to cart

---

### Phase 4: Shopping Cart (Data Persistence)

- [ ] Navigate to "Cart"
- [ ] All scanned products listed
- [ ] Each item shows:
  - [ ] Product name
  - [ ] Price per unit
  - [ ] Quantity controls (-, qty, +)
  - [ ] Total for item
  - [ ] Delete button

- [ ] Quantity controls work
  - [ ] Increase/decrease quantities
  - [ ] Subtotal updates correctly
  - [ ] Total updates correctly

- [ ] Cart summary shows
  - [ ] Subtotal
  - [ ] Tax (10%)
  - [ ] Final Total
  - [ ] Loyalty points earned

- [ ] Data persists
  - [ ] Refresh page
  - [ ] Cart items still present

---

### Phase 5: Payment Flow (Surfboard Integration)

#### 5A: Navigate to Payment
- [ ] Click "Proceed to Payment →"
- [ ] Payment page loads
- [ ] Shows "Order Summary"

#### 5B: Order Summary
- [ ] Subtotal displayed correctly
- [ ] Tax calculated (10% of subtotal)
- [ ] Total correct (subtotal + tax)
- [ ] Payment method: "💳 Credit Card"

#### 5C: Surfboard Checkout
- [ ] Click "PAY NOW"
- [ ] Backend creates Surfboard session
- [ ] Look for redirect to Surfboard checkout URL
- [ ] Should redirect to:
  - Real Surfboard checkout (if credentials valid)
  - Or demo checkout (if fallback needed)

#### 5D: Payment Success Flow
- [ ] Complete payment on Surfboard
- [ ] Browser redirects back to app
- [ ] PaymentSuccess page appears (if available)
- [ ] Shows order confirmation
- [ ] Navigates to Receipt

---

### Phase 6: Receipt & Exit Verification

- [ ] Receipt page displays
  - [ ] Order details
  - [ ] Items purchased
  - [ ] Total amount paid
  - [ ] Order number
  - [ ] Timestamp

- [ ] Navigate to "Exit Verification"
  - [ ] Security gate simulation
  - [ ] Items marked as verified/paid
  - [ ] Exit allowed

---

### Phase 7: Responsive Design

#### Desktop (1280px+)
- [ ] Full sidebar visible
- [ ] All elements properly sized
- [ ] No horizontal scroll

#### Tablet (768px-1279px)
- [ ] Sidebar collapses/expands
- [ ] Dashboard cards stack appropriately
- [ ] Touch-friendly controls

#### Mobile (Below 768px)
- [ ] Sidebar collapse/expand toggle works
- [ ] Single column layout
- [ ] Buttons large enough to tap
- [ ] No content cut off
- [ ] No horizontal scroll

---

### Phase 8: Theme Consistency

#### Dark Mode Verification
Check every page shows:
- [ ] Dark navy backgrounds (#0f172a, #1e293b)
- [ ] Light text (#f1f5f9)
- [ ] Good contrast
- [ ] Readable in all conditions

Pages to check:
- [ ] Welcome
- [ ] Dashboard
- [ ] Smart NFC Shopping
- [ ] NFC Self Checkout
- [ ] Cart
- [ ] Payment
- [ ] Receipt
- [ ] Exit Verification
- [ ] Merchant Onboarding

#### Light Mode Verification
Check every page shows:
- [ ] White backgrounds (#ffffff, #f8fafc)
- [ ] Dark text (#0f172a)
- [ ] Good contrast
- [ ] No grey overlays
- [ ] Clean appearance

---

### Phase 9: Merchant Onboarding (Surfboard Real Integration)

- [ ] Navigate to "Merchant Onboarding"
- [ ] Form displays with fields:
  - [ ] Business Name
  - [ ] Business Type
  - [ ] Owner Name & Email
  - [ ] Bank Account Details
  - [ ] Other required fields

- [ ] Submit form
- [ ] Backend calls real Surfboard Merchant API (if credentials valid)
- [ ] Merchant created with:
  - [ ] Merchant ID assigned
  - [ ] Surfboard status updated
  - [ ] Status shows PENDING or APPROVED

---

### Phase 10: Backend API Verification

#### Test 1: Get Products
```bash
curl http://localhost:5000/api/products
```
Expected response should include 13 products with fields:
- brand, size, color, material, care_instructions, rating, review_count

#### Test 2: Scan NFC Tag
```bash
curl -X POST http://localhost:5000/api/nfc/scan \
  -H "Content-Type: application/json" \
  -d '{"tag_id":"NFC-FASHION-001-TSHIRT-001-BLK"}'
```
Expected: Complete product details returned

#### Test 3: Surfboard Status
```bash
curl http://localhost:5000/api/payments/status/surfboard
```
Expected: Shows Surfboard integration mode (PRODUCTION or SIMULATED)

#### Test 4: Merchant List
```bash
curl http://localhost:5000/api/merchants
```
Expected: List of all registered merchants

---

## 🎯 CRITICAL VERIFICATION POINTS

### Must Work:
1. ✅ NFC scan returns complete fashion product details
2. ✅ Product details show brand, size, color, material
3. ✅ Cart persists data to database
4. ✅ Payment redirects to Surfboard checkout URL
5. ✅ Theme toggle switches entire UI
6. ✅ Responsive design works on all screen sizes
7. ✅ Sidebar navigation all items clickable
8. ✅ No console errors

### Real Surfboard Integration:
- If `SURFBOARD_API_KEY` valid: ✅ Uses real API
- If credentials missing: ✅ Falls back to demo
- Merchant onboarding: ✅ Calls real API
- Payment creation: ✅ Creates real checkout session

---

## 📊 EXPECTED DATABASE STATE

### Products Table (13 rows)
```
PRODUCT                    BRAND           PRICE    SKU
Premium Cotton T-Shirt     UrbanWear       ₹999     TSHIRT-001-BLK
Casual Printed T-Shirt     StyleLab        ₹1,299   TSHIRT-002-WHT
Classic Blue Denim Jeans   DenimCo         ₹2,499   JEANS-001-NVY
... (10 more)
```

### NFC_Tags Table (13 rows)
```
TAG_ID                     PRODUCT_ID    STATUS
NFC-FASHION-001-...        UUID          ACTIVE
NFC-FASHION-002-...        UUID          ACTIVE
... (11 more)
```

### Merchants Table
```
MERCHANT_ID    BUSINESS_NAME    STATUS      SURFBOARD_STATUS
MERCHANT_...   Test Business    PENDING     NOT_REGISTERED
```

---

## 🔧 TROUBLESHOOTING

### Issue: Database connection fails
```
❌ Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution**: Ensure PostgreSQL is running
```bash
# Windows
pg_isready -h localhost -p 5432
```

### Issue: Products not seeding
```
❌ Seeding failed: duplicate key value violates unique constraint
```
**Solution**: Clear database and reseed
```bash
# Delete and recreate database
node scripts/init-db.js
node scripts/seed-data.js
```

### Issue: Frontend can't reach backend
```
❌ Error: Failed to fetch http://localhost:5000/api/products
```
**Solution**: Ensure backend is running on :5000
```bash
# Check backend health
curl http://localhost:5000/api/health
```

### Issue: Theme not switching
**Solution**: Check browser localStorage
```javascript
// In browser console:
localStorage.getItem('app-theme')
```

### Issue: Surfboard payment not redirecting
```
❌ Failed to create payment session
```
**Solution**: Check Surfboard credentials in `.env`
```bash
# Check if credentials are loaded
curl http://localhost:5000/api/payments/status/surfboard
```

---

## 📋 FINAL SIGN-OFF CHECKLIST

Before considering complete:

- [ ] All 13 fashion products display correctly
- [ ] NFC scanning shows complete product details
- [ ] Light mode and dark mode both work on all pages
- [ ] Cart persists data
- [ ] Payment creates Surfboard session
- [ ] Merchant onboarding works
- [ ] Responsive design verified on mobile/tablet/desktop
- [ ] No console errors
- [ ] No database errors
- [ ] Backend health check passes
- [ ] All sidebar navigation items work
- [ ] Theme persists on refresh

---

## 🎉 SUCCESS CRITERIA

**System is PRODUCTION READY when**:

✅ All verification checks pass
✅ No errors in console or database logs
✅ End-to-end flow works: NFC Scan → Cart → Payment → Receipt
✅ Light/Dark mode toggles correctly
✅ Responsive on all screen sizes
✅ Surfboard integration active (real API if credentials valid)
✅ Database persistence working
✅ All navigation items functional

**Estimated Time to Verification**: 30-45 minutes

---

**Status**: 🟢 READY FOR COMPREHENSIVE TESTING
**Date**: July 31, 2026
**System**: SELF CHECKOUT Fashion Retail Platform
