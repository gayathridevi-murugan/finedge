# Queue-Free Checkout

A complete end-to-end NFC-based retail checkout system with automatic payment processing, security verification, and loyalty rewards.

## Project Structure

```
queue-free-checkout-fresh/
├── backend/                 # Express.js backend
│   ├── config/             # Database configuration
│   ├── models/             # Sequelize models (11 tables)
│   ├── services/           # Business logic services
│   ├── routes/             # API endpoints
│   ├── middleware/         # Error handling
│   ├── scripts/            # Database initialization and seeding
│   ├── .env                # Environment variables
│   ├── server.js           # Main server file
│   └── package.json        # Dependencies
│
└── frontend/               # React.js frontend
    ├── public/            # Static files
    ├── src/
    │   ├── pages/         # Page components (Dashboard, Checkout, Receipt)
    │   ├── services/      # API client
    │   ├── store/         # Zustand state management
    │   ├── styles/        # CSS files
    │   ├── App.js         # Main component
    │   └── index.js       # React entry point
    ├── .env               # Environment variables
    └── package.json       # Dependencies
```

## Features

- **NFC Product Detection**: Scan products with NFC tags
- **Shopping Cart**: Add/remove items from cart
- **Order Management**: Create orders and track status
- **Payment Integration**: Surfboard Payments API integration
- **Digital Receipts**: Generate receipts with tax calculation
- **Loyalty System**: Earn points on purchases (SILVER/GOLD/PLATINUM tiers)
- **Exit Security**: Software-based exit verification with GREEN/RED gates
- **Database**: PostgreSQL with Sequelize ORM

## Quick Start

### Prerequisites
- Node.js (v14+)
- PostgreSQL (running on localhost:5432)
- npm or yarn

### Installation & Setup

1. **Clone/Navigate to project**
   ```bash
   cd ~/Desktop/queue-free-checkout-fresh
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Initialize Database**
   ```bash
   npm run setup
   # This will:
   # - Create database schema
   # - Seed sample products (8 items)
   # - Create NFC and security tags
   ```

4. **Start Backend Server**
   ```bash
   npm run dev
   # Server runs on http://localhost:5000
   ```

5. **Install Frontend Dependencies** (in another terminal)
   ```bash
   cd frontend
   npm install
   ```

6. **Start Frontend Dev Server**
   ```bash
   npm start
   # App opens on http://localhost:3000
   ```

## API Endpoints

### Cart Operations
- `POST /api/cart/create` - Create new cart
- `GET /api/cart/:cart_id` - Get cart details
- `POST /api/cart/add` - Add item to cart
- `POST /api/cart/remove` - Remove item from cart

### NFC/Product
- `POST /api/nfc/scan` - Scan NFC tag
- `GET /api/nfc/validate/:tag_id` - Validate NFC tag

### Orders
- `POST /api/orders/create` - Create order from cart
- `GET /api/orders/:order_id` - Get order details

### Payments
- `POST /api/payments/process` - Process payment (Surfboard)
- `GET /api/payments/:order_id` - Get payment status

### Receipts
- `POST /api/receipts/generate` - Generate digital receipt
- `GET /api/receipts/:receipt_id` - Get receipt details

### Loyalty
- `POST /api/loyalty/add-points` - Add loyalty points
- `GET /api/loyalty/balance/:customer_id` - Get loyalty balance

### Exit Verification
- `POST /api/exit/verify` - Verify exit (returns GREEN/RED)
- `GET /api/exit/:order_id` - Get exit status

### Simulator
- `GET /api/simulator/demo-data` - Get demo products & NFC tags
- `GET /api/simulator/available-tags` - List available NFC tags

## Database Models

1. **Product** - Product catalog
2. **Customer** - Customer profiles with loyalty info
3. **Order** - Order records with status tracking
4. **OrderItem** - Line items in orders
5. **Payment** - Payment transactions
6. **Receipt** - Digital receipts
7. **NFCTag** - NFC tag mappings
8. **SecurityTag** - EAS/security tags
9. **Loyalty** - Loyalty transaction log
10. **ExitVerification** - Exit gate verification records
11. **SecurityEvent** - Security audit trail

## Testing the System

1. **Open Frontend**: Navigate to http://localhost:3000
2. **Start Shopping**: Click "Start Shopping" button
3. **Auto-Checkout**: System automatically:
   - Creates cart
   - Scans 2 sample products
   - Creates order
   - Processes payment (90% success rate)
   - Generates receipt
   - Verifies exit (GREEN for paid orders)
   - Earns loyalty points
4. **View Receipt**: See checkout summary with order details
5. **Loyalty Points**: Check points earned on purchase

## Configuration

### Backend (.env)
```
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=123456
DB_NAME=queue_free_checkout
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
```

## Sample Data

The system comes seeded with:
- 8 products (milk, bread, butter, juice, cheese, eggs, yogurt, soup)
- NFC tags for each product
- Security tags for EAS system

## Payment Simulation

The Surfboard payment API has a 90% success rate simulation for testing both approved and declined payments.

## Security Features

- Exit gates verify all items are paid before allowing exit
- Security tags are deactivated after successful payment
- Unpaid item detection blocks exit
- Software-based gate simulation (not physical hardware)

## Next Steps

- Deploy to production server
- Integrate with real NFC hardware
- Connect to live Surfboard Payments account
- Set up monitoring and analytics

## Support

For issues or questions, check the API endpoints documentation or server logs.

---

**Built with**: Express.js, PostgreSQL, Sequelize, React.js, Zustand, Axios
