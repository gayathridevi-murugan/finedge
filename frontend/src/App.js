import React from 'react';
import { useCheckoutStore } from './store/checkoutStore';
import { ThemeProvider } from './store/ThemeContext';
import './styles/design-system.css';
import './App.css';

// Pages
import OverviewDashboard from './pages/OverviewDashboard_NEW';
import SmartNFCShoppingDashboard from './pages/SmartNFCShoppingDashboard';
import NFCSelfCheckout from './pages/NFCSelfCheckout';
import ProductPassport from './pages/ProductPassport.jsx';
import CartPage from './pages/CartPage';
import GroupShopping from './pages/GroupShopping';
import Payment from './pages/Payment.js';
import PaymentSuccess from './pages/PaymentSuccess.jsx';
import PaymentCancel from './pages/PaymentCancel.jsx';
import ReceiptDashboard from './pages/ReceiptDashboard';
import ExitVerificationDashboard from './pages/ExitVerificationDashboard';
import MerchantOnboarding from './pages/MerchantOnboarding';
import Settings from './pages/Settings';
import DemoControls from './pages/DemoControls';
import Welcome from './pages/Welcome.jsx';

function AppContent() {
  const currentScreen = useCheckoutStore((state) => state.currentScreen);

  // Welcome screen doesn't use dashboard layout
  if (currentScreen === 'welcome') {
    return <Welcome />;
  }

  // All other screens use dashboard layout - consistent state-based routing
  return (
    <div className="app">
      {currentScreen === 'overview' && <OverviewDashboard />}
      {currentScreen === 'smart-shopping' && <SmartNFCShoppingDashboard />}
      {currentScreen === 'nfc-self-checkout' && <NFCSelfCheckout />}
      {currentScreen === 'product-passport' && <ProductPassport />}
      {currentScreen === 'cart' && <CartPage />}
      {currentScreen === 'group-shopping' && <GroupShopping />}
      {currentScreen === 'payment' && <Payment />}
      {currentScreen === 'payment-success' && <PaymentSuccess />}
      {currentScreen === 'payment-cancel' && <PaymentCancel />}
      {currentScreen === 'receipt' && <ReceiptDashboard />}
      {currentScreen === 'exit-verification' && <ExitVerificationDashboard />}
      {currentScreen === 'merchant-onboarding' && <MerchantOnboarding />}
      {currentScreen === 'settings' && <Settings />}
      {currentScreen === 'demo-controls' && <DemoControls />}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
