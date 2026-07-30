# Queue-Free Checkout - Core Implementation Plan

## Phase 1: Database & Models ✓ (partially complete)

### Required Tables (verify all exist)
- [x] products
- [x] nfc_tags
- [x] security_tags
- [x] customers
- [x] orders
- [x] order_items
- [x] payments
- [x] receipts
- [x] loyalty
- [x] security_events
- [x] exit_verifications
- [ ] group_sessions (NEW - for group shopping)
- [ ] group_members (NEW - for split payments)

### Missing or Needs Verification
- Order lifecycle states (CART → PENDING_PAYMENT → PAYMENT_PROCESSING → PAID → etc)
- Product detection tracking
- Security event logging

---

## Phase 2: NFC Service ⚠️ (needs rebuild for multi-product)

### Real Surfboard NFC API Structure
```
Authentication: Bearer token (from Surfboard Developer Portal)
Base URL: https://api.surfboardpayments.com/v1

Endpoints to implement:
- POST /nfc/readers/{reader_id}/scan - Submit NFC tag read
- GET /nfc/tags/{tag_id} - Get tag details
- POST /nfc/tags - Create NFC tag mapping
```

### NFC Terminal Simulator (Development)
```
Mock NFC tags: NFC-001, NFC-002, NFC-003, NFC-004
Backend endpoint: POST /api/nfc/terminal/batch-scan
Input: {tag_ids: ["NFC-001", "NFC-002", "NFC-003"]}
Output: {products: [{id, name, price, nfc_tag_id, security_tag_id}]}
```

---

## Phase 3: Product Service ✓

### Core Methods
- getProductByNFCTag(tag_id)
- getProduct(product_id)
- getAllProducts()
- checkStock(product_id, quantity)
- getProductSecurityTag(product_id)

---

## Phase 4: Order & Cart Service ✓

### Cart Service
- createCart()
- addItemsToCart(cart_id, products)
- getCart(cart_id)
- clearCart(cart_id)

### Order Service
- createOrderFromCart(cart_id, products)
- getOrder(order_id)
- updateOrderStatus(order_id, status)
- Order Lifecycle States:
  - CART_PENDING
  - AWAITING_PAYMENT
  - PAYMENT_PROCESSING
  - PAID
  - PAYMENT_FAILED
  - EXIT_PENDING
  - EXIT_APPROVED
  - EXIT_BLOCKED

---

## Phase 5: Payment Service ✓ (with Surfboard real API)

### Real Surfboard API Integration
```
Authentication: API Key + Secret from .env
Base URL: https://api.surfboardpayments.com/v1

Endpoints:
- POST /charges - Process payment
- GET /charges/{charge_id} - Get payment status
- POST /refunds - Refund payment
```

### Fallback: Demo Mode
- If real credentials not available, use 90% success simulation
- Clearly label as DEMO/SANDBOX mode
- Never present simulated payment as real

---

## Phase 6: Security & Exit Service ⚠️ (needs rebuild)

### Exit Security Verification
```
Check 1: Payment Complete
  - Order.payment_status == "PAID"
  
Check 2: All Items in Order Paid
  - For each detected product:
    - Is it in the order?
    - Is its security tag DEACTIVATED?
    
Check 3: No Unpaid Items
  - Identify which products are unpaid
  - Block exit with specific reason
```

### Exit Status Values
- GREEN: All checks passed
- RED: Unpaid items detected
- YELLOW: Manual review required

---

## Phase 7: Receipt & Loyalty ✓

### Receipt Service
- generateReceipt(order_id)
- Format: Order#, items, subtotal, tax, total, loyalty points

### Loyalty Service
- addLoyaltyPoints(customer_id, order_id, points)
- Points = floor(order_total)
- Tier progression: SILVER (0+) → GOLD (250+) → PLATINUM (500+)

---

## Phase 8: API Routes ✓ (with new endpoints)

### New/Enhanced Endpoints

```
NFC BATCH SCAN (Development):
POST /api/nfc/batch-scan
{
  tag_ids: ["NFC-001", "NFC-002"]
}

PRODUCT DETECTION:
POST /api/products/detect
{
  nfc_tag_ids: ["NFC-001", "NFC-002", "NFC-003"]
}
Returns: {products: [...], detected_count: 3}

ORDER LIFECYCLE:
GET /api/orders/{order_id}/timeline
Returns: {current_status, previous_statuses, security_status, exit_status}

EXIT VERIFICATION (Enhanced):
POST /api/exit/verify
{
  order_id,
  detected_products: ["product-1", "product-2"]
}
Returns: {
  exit_status: "APPROVED|BLOCKED|REVIEW",
  gate_status: "GREEN|RED|YELLOW",
  unpaid_items: [{product_id, name, price}],
  reason: "All items paid" | "Cap is unpaid"
}
```

---

## Phase 9: Testing (Before UI)

### API Test Suite
1. Health check
2. Product lookup by NFC tag
3. Batch product detection
4. Cart creation and item addition
5. Order creation from cart
6. Payment processing (both real and demo)
7. Receipt generation
8. Loyalty points calculation
9. Exit verification (approved scenario)
10. Exit verification (blocked scenario - unpaid item)
11. Security tag deactivation
12. Order status transitions

### Test Data
- 4 sample products with NFC and security tags
- Test customers
- Test NFC tag IDs: NFC-001 through NFC-004

---

## Success Criteria

Before moving to UI, verify:

- [ ] PostgreSQL connection works
- [ ] All 12+ models created and synced
- [ ] Sample data seeded (4 products, 4 customers, NFC tags)
- [ ] NFC product lookup works (single and batch)
- [ ] Cart creation and item management works
- [ ] Order creation works with proper status tracking
- [ ] Payment processing works (real or clearly labeled demo)
- [ ] Security tags deactivate on payment
- [ ] Receipt generation works
- [ ] Loyalty points calculation works
- [ ] Exit verification works (approved scenario)
- [ ] Exit verification detects unpaid items (blocked scenario)
- [ ] Every API endpoint tested and returns correct data
- [ ] Order lifecycle states properly tracked
- [ ] Exit security reasons are specific (e.g., "Cap is unpaid")

---

## NOT BUILDING YET

- Frontend UI
- React components
- CSS styling
- Form handling
- User interactions

## ONLY BUILDING

- Database models and migrations
- Backend services
- REST API endpoints
- NFC simulator
- Test data and seed scripts
- API testing
- Complete backend validation

---

## Timeline

Phase 1-3: Database + Models (1 hour)
Phase 4-5: Order + Payment (1 hour)
Phase 6-7: Exit + Receipt (1 hour)
Phase 8: API Routes (30 min)
Phase 9: Testing & Validation (1 hour)

Total Backend Implementation: ~4-5 hours

ONLY THEN: Build React UI
