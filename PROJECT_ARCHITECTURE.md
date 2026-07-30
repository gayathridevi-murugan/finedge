# Queue-Free Checkout - Project Architecture

## Executive Summary

**Queue-Free Checkout** is an NFC-based retail checkout system that demonstrates **multi-product batch NFC reading** for fast, queue-free shopping experiences. The system differs from traditional retail and competitor solutions by focusing on **simultaneous multi-product NFC tag identification** rather than single-item barcode scanning.

---

## Problem Statement

### Traditional Retail Checkout Issues
- Long queues at checkout
- Slow per-item scanning  
- Manual checkout processes
- Customer frustration
- High staff dependency
- Difficulty handling multiple items quickly
- Security gaps in theft prevention

### Our Solution: Queue-Free Checkout
Fast, automated checkout through:
- **Simultaneous multi-product NFC identification**
- Automatic cart generation from batch NFC reads
- One-step payment via Surfboard
- Security verification before exit
- Digital receipts and loyalty rewards
- Optional group/split payments

---

## How We Differ From Competitors

### Vs. Decathlon/Uniqlo Self-Checkout
- **They use:** Barcode scanning (single item per scan)
- **We demonstrate:** NFC batch reading (multiple items simultaneously)
- **Our advantage:** Faster checkout without sequential scanning

### Vs. Traditional Cashier
- **They use:** Manual scanning + cash registers
- **We use:** Automated NFC detection + digital payment

---

## Core User Journey

```
1. CUSTOMER ENTERS STORE
   ↓
2. CUSTOMER SELECTS MULTIPLE PRODUCTS
   (picks items, puts them in a basket or on NFC terminal)
   ↓
3. CUSTOMER APPROACHES NFC CHECKOUT TERMINAL
   (NFC Terminal = NFC reader with NFC-enabled product tags)
   ↓
4. NFC TAGS ARE READ SIMULTANEOUSLY
   (Terminal reads multiple NFC tags in one action)
   ↓
5. BACKEND MAPS TAG IDs TO PRODUCTS
   (Product Service: NFC Tag → Product)
   ↓
6. SHOPPING CART IS AUTO-CREATED
   (Order Service: Creates cart with all detected products)
   ↓
7. CUSTOMER REVIEWS ITEMS & CART
   (Frontend shows products, quantities, total price)
   ↓
8. PAYMENT THROUGH SURFBOARD
   (Customer pays via digital payment system)
   ↓
9. PAYMENT CONFIRMED
   (Payment Service: Transaction successful, order status = PAID)
   ↓
10. SECURITY STATUS UPDATED
    (Payment Service: All security tags marked DEACTIVATED)
    ↓
11. DIGITAL RECEIPT GENERATED
    (Receipt Service: Creates receipt with all items, tax, total)
    ↓
12. LOYALTY POINTS AWARDED
    (Loyalty Service: Points earned based on purchase amount)
    ↓
13. CUSTOMER GOES TO EXIT
    (Customer approaches exit gate/door)
    ↓
14. EXIT SECURITY VERIFICATION
    (Exit Service: Verifies payment complete + security tags deactivated)
    ↓
15. EXIT APPROVED (GREEN) OR BLOCKED (RED)
    (Customer can leave OR system alerts to unpaid items)
```

---

## System Architecture

### Technology Stack

**Backend:**
- Runtime: Node.js
- Framework: Express.js
- Database: PostgreSQL
- ORM: Sequelize
- Payment: Surfboard Payments API (real) + Simulation (90% success)

**Frontend:**
- Framework: React 18
- State: Zustand (cart, checkout, receipt state)
- HTTP Client: Axios
- UI: Custom CSS (responsive design)

**Database:** PostgreSQL 12+

---

## Database Schema

### 11 Core Models

1. **Product**
   - Core product catalog
   - Fields: id, name, category, price, stock, description

2. **NFCTag**
   - Maps NFC tag IDs to products
   - Fields: tag_id, product_id, status, scan_count, last_scanned_at

3. **SecurityTag**
   - EAS/Security label tracking
   - Fields: tag_id, product_id, status (ACTIVE/DEACTIVATED)
   - Purpose: Prevents unpaid items from leaving store

4. **Customer**
   - Customer profiles
   - Fields: name, email, phone, loyalty_points, loyalty_tier (SILVER/GOLD/PLATINUM)

5. **Order**
   - Purchase orders
   - Fields: order_number, customer_id, total_amount
   - Status tracking: payment_status, security_status, exit_status

6. **OrderItem**
   - Line items in an order
   - Fields: order_id, product_id, quantity, unit_price, subtotal

7. **Payment**
   - Payment transactions
   - Fields: order_id, amount, status, transaction_id, payment_gateway

8. **Receipt**
   - Digital receipts
   - Fields: order_id, receipt_number, subtotal, tax, total_amount, loyalty_points_earned

9. **Loyalty**
   - Loyalty transaction log
   - Fields: customer_id, order_id, transaction_type (EARNED/REDEEMED), points

10. **ExitVerification**
    - Exit gate simulation records
    - Fields: order_id, exit_status, gate_status (GREEN/RED), simulation_note, unpaid_items

11. **SecurityEvent**
    - Audit trail for security events
    - Fields: order_id, event_type, status, description

---

## NFC Flow - Detailed

### What is NFC?
- **NFC:** Near Field Communication
- **Range:** 4-10cm (very close proximity)
- **Use Case:** Product identification at checkout
- **NOT:** UHF RFID (long-range), not exit security gate

### Our NFC Implementation

#### Real-World NFC Scenario
```
Product A → has NFC Tag "PROD_A_001"
Product B → has NFC Tag "PROD_B_002"
Product C → has NFC Tag "PROD_C_003"

Customer places all 3 products on NFC Terminal
Terminal reads all 3 tags simultaneously
Backend receives: ["PROD_A_001", "PROD_B_002", "PROD_C_003"]
```

#### Current Implementation
- **Single-tag reading** (reads one tag at a time)
- **Demo tags** (DEMO_0001, DEMO_0002, etc.)
- **On-the-fly product creation** (creates Product in DB when tag is scanned)
- **Sequelize models** store permanent NFC ↔ Product mappings

#### API Endpoints
```
POST /api/nfc/scan
  {tag_id: "DEMO_0001"}
  
  Returns:
  {
    nfc_tag_id: "uuid",
    tag_id: "DEMO_0001",
    product: { id, name, price, stock },
    scan_count: 1,
    scanned_at: "2026-07-30T10:00:00Z"
  }
```

---

## Payment Flow - Detailed

### Surfboard Payments Integration

#### Current State
- **Real Endpoint:** https://api.surfboardpayments.com (configured in .env)
- **Simulation Mode:** 90% success rate for demo purposes
- **Payment Status Flow:** PENDING → CAPTURED (or FAILED)

#### Payment Processing

```
1. Customer clicks "Pay"
   ↓
2. PaymentService.initiatePayment()
   - Creates Payment record in DB
   - Sets status = PENDING
   
3. PaymentService.processPaymentWithSurfboard()
   - Calls Surfboard API (or simulates)
   - Generates transaction_id
   - 90% chance: success → CAPTURED
   - 10% chance: failure → FAILED
   
4. Upon Success:
   - Payment status = CAPTURED
   - Order status = PAID
   - Security tags auto-deactivated
   - Receipt generated
   - Loyalty points awarded
```

#### API Endpoints
```
POST /api/payments/process
  {order_id, amount, payment_method}
  
  Returns:
  {
    payment: {
      id, order_id, amount, status, transaction_id
    },
    order: {
      id, order_number, payment_status, total_amount
    }
  }
```

---

## Exit Security Simulation - Detailed

### NOT a Physical Gate
- **What we are:** Software simulation of EAS (Electronic Article Surveillance) logic
- **What we are NOT:** Physical gate hardware, UHF RFID, turnstile

### Logic Flow
```
Customer approaches exit → System verifies:

1. Is payment complete?
   - Check: Order.payment_status == "PAID"
   - If NOT PAID → EXIT BLOCKED (RED)
   
2. Are all security tags deactivated?
   - Check: All SecurityTag.status == "DEACTIVATED"
   - If any ACTIVE → EXIT BLOCKED (RED)
   
3. All checks pass?
   - EXIT APPROVED (GREEN)
```

### API Endpoints
```
POST /api/exit/verify
  {order_id}
  
  Returns:
  {
    exit_verification: {
      id, order_id, exit_status, gate_status,
      simulation_note: "Software simulation - not physical gate"
    }
  }
  
Gate Status:
- GREEN: Exit approved, customer can leave
- RED: Exit blocked, unpaid items detected
- YELLOW: Manual review required (future)
```

### Simulation Notice
Every exit verification response includes:
```
"simulation_note": "Software simulation - not physical gate"
```
This clearly indicates we are NOT claiming to have physical hardware.

---

## Backend Services Architecture

### 9 Core Services

1. **CartService** (in-memory)
   - Manages shopping carts
   - Methods: createCart, addItemToCart, removeItem, getCart

2. **NFCService** (database)
   - Handles NFC tag scanning
   - Creates products on-the-fly for demo tags
   - Methods: scanNFCTag, validateNFCTag, getNFCTag

3. **OrderService** (database)
   - Creates orders from carts
   - Manages order status
   - Methods: createOrderFromCart, getOrder, updateOrderStatus

4. **PaymentService** (database + Surfboard API)
   - Initiates and processes payments
   - Simulates Surfboard API (90% success rate)
   - Deactivates security tags on payment success
   - Methods: initiatePayment, processPaymentWithSurfboard, capturePayment

5. **ReceiptService** (database)
   - Generates digital receipts
   - Calculates tax (10%)
   - Methods: generateReceipt, getReceipt

6. **LoyaltyService** (database)
   - Manages loyalty points
   - Auto-upgrades tiers (SILVER → GOLD → PLATINUM)
   - Methods: addLoyaltyPoints, getLoyaltyBalance

7. **ExitSecurityService** (database)
   - Verifies exit security
   - Checks payment status and security tag status
   - Methods: verifyExit, approveExit, blockExit

8. **SimulatorService** (hardcoded)
   - Provides demo product data
   - Hardcoded 8 sample products (DEMO_0001 to DEMO_0008)
   - Methods: getDemoData

9. **Services Index**
   - Exports all services for use in routes

---

## API Routes (8 modules)

### 1. Cart Routes (`POST/GET /api/cart/...`)
- Create cart
- Get cart details
- Add items
- Remove items

### 2. NFC Routes (`POST/GET /api/nfc/...`)
- Scan NFC tag
- Validate NFC tag

### 3. Order Routes (`POST/GET /api/orders/...`)
- Create order from cart
- Get order details

### 4. Payment Routes (`POST/GET /api/payments/...`)
- Process payment
- Get payment status

### 5. Receipt Routes (`POST/GET /api/receipts/...`)
- Generate receipt
- Get receipt details

### 6. Loyalty Routes (`POST/GET /api/loyalty/...`)
- Add loyalty points
- Get loyalty balance

### 7. Exit Routes (`POST/GET /api/exit/...`)
- Verify exit
- Get exit status

### 8. Simulator Routes (`GET /api/simulator/...`)
- Get demo data (8 sample products)
- Get available tags

---

## Frontend Architecture

### 3 Pages

1. **Dashboard** (Checkout.js)
   - Product catalog (from simulator)
   - "Start Shopping" button
   - How it works steps
   - Feature highlights

2. **Checkout** (Checkout.js - renamed)
   - Multi-step flow: Cart → Payment → Exit
   - Automatic product scanning (simulated)
   - Cart display
   - Payment processing
   - Loading states

3. **Receipt** (Receipt.js)
   - Order number and date
   - Item list with prices
   - Subtotal, tax, total
   - Loyalty points earned
   - "New Checkout" button

### State Management (Zustand)
```javascript
{
  cartId,
  cartItems,
  cartTotal,
  orderId,
  orderNumber,
  paymentStatus,
  exitStatus,
  gateStatus,
  loyaltyPoints
}
```

---

## Demo Scenarios

### Scenario 1: Successful Checkout
```
1. Customer has: Milk ($3.99), Bread ($2.50)
2. Items detected via NFC → Auto cart created
3. Total: $6.49
4. Payment: CAPTURED (90% success)
5. Security tags: DEACTIVATED
6. Receipt: Generated, +6 loyalty points
7. Exit: APPROVED (GREEN)
8. Customer leaves ✓
```

### Scenario 2: Unpaid Item Detection
```
1. Customer has: Milk ($3.99), Bread ($2.50), Butter ($4.50)
2. NFC detects: All 3 items
3. But payment only made for: Milk + Bread ($6.49)
4. System detects: Butter is UNPAID
5. Exit verification:
   - Butter SecurityTag.status = ACTIVE (not deactivated)
   - EXIT BLOCKED (RED)
6. System alerts: Unpaid item detected
7. Customer must pay for Butter or return it
```

---

## What is Real vs Simulated

### REAL (with Surfboard)
- Payment API integration (endpoint configured)
- Payment processing logic
- Order status tracking
- Receipt generation
- Database persistence

### SIMULATED (for demo)
- NFC Terminal (simulator service returns hardcoded data)
- NFC Tag Reading (simulates with tag IDs)
- Payment Success Rate (90% simulated)
- Exit Gate (software logic, not physical hardware)
- Demo Products (8 hardcoded products)

### LABELED SIMULATION
- Exit verification responses include:
  ```
  "simulation_note": "Software simulation - not physical gate"
  ```

---

## Current Project Status

### What Exists ✓
- 11 database models (complete schema)
- 9 backend services (all core logic)
- 8 API route modules (53+ endpoints)
- React frontend (3 pages)
- Complete checkout flow
- Payment simulation (90% success)
- Exit security logic
- NFC tag scanning
- Digital receipts
- Loyalty system

### What Needs Work ⚠️
1. **NFC Multi-Product Batch Reading**
   - Current: Single-tag scanning
   - Needed: Simultaneous multi-tag reading simulation

2. **Frontend NFC Interface**
   - Current: Sequential "Start Shopping" button
   - Needed: "Place items on NFC terminal" interface showing real-time multi-product detection

3. **Demo Scenarios**
   - Scenario 1: All items paid → exit approved
   - Scenario 2: Unpaid item → exit blocked

4. **Frontend Startup**
   - npm start currently has issues
   - Needs react-scripts configuration fix

5. **Documentation**
   - This architecture document
   - Clear simulation labels throughout UI

---

## How to Use This System

### For Development/Demo
1. Start backend: `npm run dev` (port 5000)
2. Start frontend: `npm start` (port 3000)
3. Visit http://localhost:3000
4. Click "Start Shopping"
5. Watch automated checkout flow
6. See receipt and loyalty points

### For Real Integration
1. Configure Surfboard API credentials in `.env`
2. Integrate real NFC terminal API
3. Replace simulator with real NFC hardware driver
4. Deploy backend and frontend
5. System is ready for production

---

## Key Design Decisions

1. **Batch NFC Over Sequential Scanning**
   - Faster checkout experience
   - More realistic retail scenario
   - Differentiator vs traditional POS

2. **Software Exit Verification**
   - No physical hardware required for demo
   - Checks: Payment status + Security tag status
   - Clearly labeled as simulation

3. **Auto-Create Products for Demo Tags**
   - Allows testing without pre-seeding DB
   - Demo tags follow pattern: DEMO_0001 to DEMO_0008

4. **Payment Simulation**
   - 90% success rate for real-world testing
   - Allows testing both success and failure flows
   - Easy to flip to real API

5. **Separate Services Layer**
   - Business logic isolated from routes
   - Easy to test and maintain
   - Easy to extend with new features

---

## Next Steps for Enhancement

1. Implement real NFC multi-product batch reading
2. Update frontend NFC interface for real-time multi-product detection
3. Create demo scenario mode (Scenario 1 & 2)
4. Integrate real Surfboard API credentials
5. Add real NFC terminal hardware driver
6. Implement group shopping / split payments
7. Add inventory management
8. Add customer accounts and loyalty tracking

---

## File Locations

```
~/Desktop/queue-free-checkout-fresh/
├── backend/
│   ├── server.js                 # Main Express app
│   ├── config/database.js        # PostgreSQL config
│   ├── models/                   # 11 Sequelize models
│   ├── services/                 # 9 business logic services
│   ├── routes/                   # 8 API route modules
│   ├── middleware/errorHandler.js # Error handling
│   └── scripts/                  # DB init & seed
│
└── frontend/
    ├── src/
    │   ├── pages/                # 3 pages (Dashboard, Checkout, Receipt)
    │   ├── services/api.js       # API client
    │   ├── store/checkoutStore.js # Zustand state
    │   └── styles/               # CSS files
    └── public/index.html
```

---

## Conclusion

Queue-Free Checkout demonstrates a next-generation retail checkout system focused on **multi-product NFC batch reading**, **fast payment**, and **security verification**. The system is built with modern technologies (Node.js, React, PostgreSQL, Surfboard API) and includes clear separation between real integration points and simulation for demo purposes.

The architecture supports both demo/development (with simulators) and production (with real hardware and APIs).
