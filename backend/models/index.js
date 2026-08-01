const sequelize = require('../config/database');
const Product = require('./Product');
const Customer = require('./Customer');
const Cart = require('./Cart');
const CartItem = require('./CartItem');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const Payment = require('./Payment');
const Receipt = require('./Receipt');
const NFCTag = require('./NFCTag');
const SecurityTag = require('./SecurityTag');
const Loyalty = require('./Loyalty');
const ExitVerification = require('./ExitVerification');
const SecurityEvent = require('./SecurityEvent');
const GroupSession = require('./GroupSession');
const GroupMember = require('./GroupMember');
const Merchant = require('./Merchant');
const Terminal = require('./Terminal');

// Define associations
Cart.hasMany(CartItem, { foreignKey: 'cart_id', as: 'items' });
CartItem.belongsTo(Cart, { foreignKey: 'cart_id' });

CartItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
Product.hasMany(CartItem, { foreignKey: 'product_id', as: 'cart_items' });

Cart.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
Customer.hasMany(Cart, { foreignKey: 'customer_id', as: 'carts' });

Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id' });

Order.hasOne(Payment, { foreignKey: 'order_id', as: 'payment' });
Payment.belongsTo(Order, { foreignKey: 'order_id' });

Order.hasOne(Receipt, { foreignKey: 'order_id', as: 'receipt' });
Receipt.belongsTo(Order, { foreignKey: 'order_id' });

Order.hasOne(ExitVerification, { foreignKey: 'order_id', as: 'exit_verification' });
ExitVerification.belongsTo(Order, { foreignKey: 'order_id' });

Order.hasMany(SecurityEvent, { foreignKey: 'order_id', as: 'security_events' });
SecurityEvent.belongsTo(Order, { foreignKey: 'order_id' });

Customer.hasMany(Order, { foreignKey: 'customer_id', as: 'orders' });
Order.belongsTo(Customer, { foreignKey: 'customer_id' });

Customer.hasMany(Loyalty, { foreignKey: 'customer_id', as: 'loyalty_transactions' });
Loyalty.belongsTo(Customer, { foreignKey: 'customer_id' });

Product.hasMany(OrderItem, { foreignKey: 'product_id', as: 'order_items' });
OrderItem.belongsTo(Product, { foreignKey: 'product_id' });

Product.hasOne(NFCTag, { foreignKey: 'product_id', as: 'nfc_tag' });
NFCTag.belongsTo(Product, { foreignKey: 'product_id' });

Product.hasOne(SecurityTag, { foreignKey: 'product_id', as: 'security_tag' });
SecurityTag.belongsTo(Product, { foreignKey: 'product_id' });

GroupSession.belongsTo(Customer, { foreignKey: 'leader_customer_id', as: 'leader' });
Customer.hasMany(GroupSession, { foreignKey: 'leader_customer_id', as: 'led_group_sessions' });

GroupSession.hasMany(GroupMember, { foreignKey: 'group_session_id', as: 'members' });
GroupMember.belongsTo(GroupSession, { foreignKey: 'group_session_id' });

GroupMember.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
Customer.hasMany(GroupMember, { foreignKey: 'customer_id', as: 'group_memberships' });

// Merchant and Terminal associations
Merchant.hasMany(Terminal, { foreignKey: 'merchant_id', as: 'terminals' });
Terminal.belongsTo(Merchant, { foreignKey: 'merchant_id', as: 'merchant' });

module.exports = {
  sequelize,
  Product,
  Customer,
  Cart,
  CartItem,
  Order,
  OrderItem,
  Payment,
  Receipt,
  NFCTag,
  SecurityTag,
  Loyalty,
  ExitVerification,
  SecurityEvent,
  GroupSession,
  GroupMember,
  Merchant,
  Terminal
};
