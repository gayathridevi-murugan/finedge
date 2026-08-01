# SELF CHECKOUT - END-TO-END TEST SCENARIOS

## Test Environment Setup
- **Backend:** Running on `http://localhost:5000`
- **Frontend:** Running on `http://localhost:3000`
- **Database:** PostgreSQL on localhost:5432
- **Mode:** DEMO (no real Surfboard credentials)

---

## SCENARIO A: Merchant Onboarding & Terminal Registration

### Steps:
1. POST `http://localhost:5000/api/merchants/onboard`
   ```json
   {
     "business_name": "Test Store",
     "business_type": "Retail",
     "owner_name": "John Doe",
     "owner_email": "john@test.com",
     "owner_phone": "1234567890",
     "bank_name": "Test Bank",
     "account_holder": "Test Account",
     "account_number": "1234567890"
   }
   ```

2. **Expected Response:**
   - merchant_id created
   - Status: PENDING
   - Stored in PostgreSQL merchants table

3. GET `http://localhost:5000/api/merchants/status/{merchant_id}`
   - **Expected:** Merchant data returned from database

4. POST `http://localhost:5000/api/terminals/register`
   ```json
   {
     "merchant_id": "MERCHANT_...",
     "terminal_name": "NFC Checkout 1",
     "terminal_type": "NFC_SELF_CHECKOUT",
     "location": "Entrance",
     "nfc_reader_id": "NFC-001",
     "security_gate_id": "GATE-001"
   }
   ```

5. **Expected Response:**
   - terminal_id created
   - Status: ONLINE
   - Linked to merchant in database

6. GET `http://localhost:5000/api/terminals/{terminal_id}`
   - **Expected:** Terminal data with merchant info

### Success Criteria:
- ✅ Merchant stored in database
- ✅ Terminal registered and linked to merchant
- ✅ Data retrievable from database
- ✅ Terminal shows ONLINE status

---

## SCENARIO B: NFC Scanning → Cart → Payment

### Frontend Flow:
1. Click "START DEMO" on Welcome page
2. Navigate to "NFC Self Checkout"
3. Click "SIMULATE NFC TAP" multiple times (3+ times)

### Expected Results:
- **NFC Scanner shows:**
  - Last scanned product name
  - Product price
  - NFC tag detected message

- **Shopping Cart shows:**
  - All scanned products listed
  - Correct quantities
  - Correct subtotal
  - Correct tax (10%)
  - Correct total

- **Example Data:**
  ```
  Product 1: Cheddar Cheese - ₹5.99 x1 = ₹5.99
  Product 2: Organic Milk - ₹3.99 x1 = ₹3.99
  Subtotal: ₹9.98
  Tax: ₹1.00
  Total: ₹10.98
  ```

### Cart Navigation:
- Click "Review Cart" button
- **Expected:** Navigate to Cart page with items displayed

### Backend Verification:
- GET `http://localhost:5000/api/cart/{cart_id}`
  - **Expected:** Returns cart with all scanned items from database

### Success Criteria:
- ✅ NFC tag simulates successfully
- ✅ Product details retrieved from database
- ✅ Products added to cart in PostgreSQL
- ✅ Cart totals calculated correctly
- ✅ Cart displays in UI
- ✅ Navigation to cart page works

---

## SCENARIO C: Payment Flow - Surfboard Redirect

### Frontend Flow:
1. From Cart page, click "Proceed to Payment"
2. Review order summary
3. Click "PAY NOW"

### Expected Behavior:
- Frontend calls `/api/payments/create-session`
- Backend returns checkout URL
- Frontend redirects to checkout URL (demo or real Surfboard)

### Demo Mode (No Credentials):
- Redirects to: `http://localhost:3000/checkout/demo?payment_id=...&order_id=...`

### Real Surfboard Mode (With Credentials):
- Redirects to: `https://checkout.surfboardpayments.com/session/...`

### Backend Verification:
- GET `http://localhost:5000/api/payments/{order_id}`
  - **Expected:** Payment record in PENDING status
  - Contains payment_id, order_id, amount

- GET `http://localhost:5000/api/payments/status/surfboard`
  - **Expected:** Shows current mode (DEMO or PRODUCTION)

### Success Criteria:
- ✅ Payment session created in database
- ✅ Redirect happens (to demo or real Surfboard)
- ✅ Payment status tracked
- ✅ Order linked to payment

---

## SCENARIO D: Light Mode Theme

### Frontend Flow:
1. Application loads (should default to Light mode)
2. Verify all pages display correctly:
   - Welcome page
   - Dashboard
   - NFC Self Checkout
   - Cart
   - Payment
   - All sidebar pages

### Light Mode Verification:
- ✅ Background: White or very light (#ffffff, #f8fafc)
- ✅ Text: Dark navy/black (#0f172a, #334155)
- ✅ Cards: White (#ffffff)
- ✅ Borders: Visible but subtle
- ✅ All text readable
- ✅ No grey overlays
- ✅ No dark translucent boxes

### Dark Mode Testing:
1. Click theme toggle button in header
2. Application switches to dark mode
3. Verify all pages display correctly

### Dark Mode Verification:
- ✅ Background: Dark navy/black (#0f172a)
- ✅ Text: White/light (#f1f5f9, #cbd5e1)
- ✅ Cards: Dark grey (#1e293b)
- ✅ Borders: Subtle but visible
- ✅ All text readable
- ✅ Premium dark UI appearance

### Theme Toggle Testing:
1. Switch between light and dark modes multiple times
2. **Expected:** Instant switching without refresh
3. **Expected:** State persists after page reload

### Success Criteria:
- ✅ Light mode displays correctly
- ✅ Dark mode displays correctly
- ✅ Text readable in both modes
- ✅ Theme toggle works smoothly
- ✅ No component breaking in either mode

---

## SCENARIO E: Complete Order Flow

### Combined Flow:
1. Merchant Onboarding → Terminal registered
2. NFC Scan → 3+ products scanned
3. Cart → Review items and totals
4. Payment → Redirect to checkout

### Backend Verification at Each Step:
1. **After NFC Scan:**
   - GET `/api/cart/{cart_id}` → 3+ items in database

2. **After Payment Initiated:**
   - GET `/api/payments/status/surfboard` → DEMO mode confirmed
   - GET `/api/orders/{order_id}` → Order in database with payment_status=PENDING

3. **After Payment Completion:**
   - POST `/api/demo-payment/verify-demo` → Payment marked CAPTURED
   - GET `/api/orders/{order_id}` → Order payment_status=PAID

### Success Criteria:
- ✅ Complete flow executable end-to-end
- ✅ All data persisted to database
- ✅ Orders properly created from cart
- ✅ Payments properly tracked
- ✅ Status updates propagate correctly

---

## SCENARIO F: Group Shopping Split Payment

### Frontend Flow (When Implemented):
1. Add products via NFC scanning
2. Navigate to "Group Shopping"
3. Create group with members
4. Select split method (Equal or Item-Based)
5. Each member completes payment

### Expected Behavior:
- Group data stored in PostgreSQL
- Each member has payment record
- Payments tracked separately
- Total = sum of member payments

### Backend Verification:
- GET `/api/group-shopping/{group_id}` → Group data with members
- GET `/api/payments?group_id={group_id}` → Multiple payment records

### Success Criteria (When Implemented):
- ✅ Group created with members
- ✅ Split calculated correctly
- ✅ Each member payment tracked
- ✅ All payments must complete before order finalized

---

## SCENARIO G: Exit Verification

### Frontend Flow:
1. Complete payment
2. System shows receipt
3. Click "Exit Verification"
4. Security gate check occurs
5. Gate allows/denies exit

### Backend Verification:
- GET `/api/exit/{order_id}` → Exit status (APPROVED or BLOCKED)
- GET `/api/security-events/{order_id}` → Event log

### Success Criteria:
- ✅ Exit verification runs after payment
- ✅ Security tags deactivated for paid items
- ✅ Exit status tracked in database
- ✅ Event logged for audit trail

---

## TEST EXECUTION CHECKLIST

### Phase 1: Setup Verification
- [ ] Backend running on port 5000
- [ ] Frontend running on port 3000
- [ ] PostgreSQL connected
- [ ] Database synced (all tables exist)

### Phase 2: Merchant & Terminal
- [ ] Merchant onboarding creates record in DB
- [ ] Terminal registration links to merchant
- [ ] Terminal status retrievable
- [ ] Merchant status retrievable

### Phase 3: NFC → Cart → Payment
- [ ] NFC simulation scans products
- [ ] Products retrieved from database
- [ ] Cart items persist to database
- [ ] Cart navigation works
- [ ] Payment session created
- [ ] Checkout redirect occurs

### Phase 4: Theme
- [ ] Light mode displays correctly
- [ ] Dark mode displays correctly
- [ ] All text readable in both modes
- [ ] Theme toggle works
- [ ] Theme persists after reload

### Phase 5: Complete Flow
- [ ] Scan → Cart → Payment → Receipt → Exit works end-to-end
- [ ] All data in database
- [ ] Status updates correctly
- [ ] No UI breaking

### Phase 6: Database Verification
- [ ] merchants table has records
- [ ] terminals table has records
- [ ] products table has scanned items
- [ ] carts table has cart records
- [ ] cart_items table has items
- [ ] orders table has order records
- [ ] order_items table has order items
- [ ] payments table has payment records
- [ ] Relationships properly linked

---

## FAILURE DIAGNOSIS

### If NFC Scan Fails:
1. Check backend logs: `tail -f /tmp/backend.log`
2. Verify `/api/nfc/available` returns products
3. Check if DEMO_PRODUCTS in nfcService match UI expectations

### If Cart Empty:
1. Check `/api/cart/{cart_id}` returns items
2. Verify CartItem records in database
3. Check cart association in Cart model

### If Payment Doesn't Redirect:
1. Check browser console for errors
2. Verify `/api/payments/create-session` returns checkout_url
3. Check if window.location.href was executed

### If Light Mode Broken:
1. Check CSS files use semantic variables
2. Verify [data-theme="light"] styles applied
3. Check browser dev tools computed styles
4. Verify design-system.css loaded

### If Database Empty:
1. Check PostgreSQL connection: `psql -U postgres -d queue_free_checkout`
2. Check Sequelize sync logs
3. Verify models auto-created tables

---

## SUCCESS METRICS

### Functional Requirements:
- ✅ Merchant onboarding stores persistent data
- ✅ Terminals configurable and trackable
- ✅ NFC scanning returns product details
- ✅ Cart persists to database
- ✅ Payment session created
- ✅ Theme system works in both modes

### Data Integrity:
- ✅ All data in PostgreSQL
- ✅ Proper relationships maintained
- ✅ Totals calculated correctly
- ✅ Status updates propagate

### User Experience:
- ✅ Light mode fully readable
- ✅ Dark mode fully readable
- ✅ All navigation works
- ✅ No UI breaking in either theme
- ✅ Complete flow executable

---

**Test Version:** 1.0  
**Date:** July 31, 2026  
**Status:** Ready for execution after CSS fixes complete
