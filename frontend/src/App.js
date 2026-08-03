import React, { useEffect } from 'react';
import { useCheckoutStore } from './store/checkoutStore';
import { lookupOrderBySurfboardOrderId } from './services/api';
import { ThemeProvider } from './store/ThemeContext';
import './styles/design-system.css';
import './App.css';

// Pages
import OverviewDashboard from './pages/OverviewDashboard_NEW';
import SmartNFCShoppingDashboard from './pages/SmartNFCShoppingDashboard';
import NFCSelfCheckout from './pages/NFCSelfCheckout';
import NFCScans from './pages/NFCScans';
import ProductPassport from './pages/ProductPassport.jsx';
import CartPage from './pages/CartPage';
import GroupShopping from './pages/GroupShopping';
import GroupPayment from './pages/GroupPayment';
import Payment from './pages/Payment.js';
import PaymentSuccess from './pages/PaymentSuccess.jsx';
import PaymentCancel from './pages/PaymentCancel.jsx';
import ReceiptDashboard from './pages/ReceiptDashboard';
import ExitVerificationDashboard from './pages/ExitVerificationDashboard';
import MerchantOnboarding from './pages/MerchantOnboarding';
import Settings from './pages/Settings';
import DemoControls from './pages/DemoControls';
import Welcome from './pages/Welcome.jsx';
import NotificationCenter from './components/NotificationCenter';

function AppContent() {
  const currentScreen = useCheckoutStore((state) => state.currentScreen);
  const setCurrentScreen = useCheckoutStore((state) => state.setCurrentScreen);
  const setOrderId = useCheckoutStore((state) => state.setOrderId);

  // Restore order id + route after the customer returns from the Surfboard-hosted payment page.
  // The SPA state (Zustand) is lost on that cross-domain round trip, so it must be rebuilt from the URL.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkoutResult = params.get('checkout_result');
    const localOrderId = params.get('local_order_id');
    // Surfboard appends its own orderId param on return - used as a fallback below in case it
    // ever strips our custom checkout_result/local_order_id params instead of preserving them.
    const surfboardOrderId = params.get('orderId');

    if (checkoutResult && localOrderId) {
      setOrderId(localOrderId);
      setCurrentScreen(checkoutResult === 'success' ? 'payment-success' : 'payment-cancel');
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }

    if (surfboardOrderId) {
      // Our own params didn't survive the redirect - resolve the local order id from Surfboard's
      // order id instead. Route to payment-success either way: PaymentSuccess always re-verifies
      // with the backend and redirects to payment-cancel itself if the payment wasn't actually paid.
      lookupOrderBySurfboardOrderId(surfboardOrderId)
        .then((res) => {
          setOrderId(res.data.data.order_id);
          setCurrentScreen('payment-success');
        })
        .catch(() => setCurrentScreen('payment-cancel'))
        .finally(() => window.history.replaceState({}, '', window.location.pathname));
      return;
    }

    // Same pattern for the merchant returning from Surfboard's hosted KYB verification page.
    const onboardingResult = params.get('onboarding_result');
    if (onboardingResult) {
      setCurrentScreen('merchant-onboarding');
      // MerchantOnboarding reads onboarding_result itself once mounted - leave the query string intact.
    }
  }, [setOrderId, setCurrentScreen]);

  // Welcome screen doesn't use dashboard layout
  if (currentScreen === 'welcome') {
    return <Welcome />;
  }

  // All other screens use dashboard layout - consistent state-based routing
  return (
    <div className="app">
      <NotificationCenter />
      {currentScreen === 'overview' && <OverviewDashboard />}
      {currentScreen === 'smart-shopping' && <SmartNFCShoppingDashboard />}
      {currentScreen === 'nfc-self-checkout' && <NFCSelfCheckout />}
      {currentScreen === 'nfc-scans' && <NFCScans />}
      {currentScreen === 'product-passport' && <ProductPassport />}
      {currentScreen === 'cart' && <CartPage />}
      {currentScreen === 'group-shopping' && <GroupShopping />}
      {currentScreen === 'group-payment' && <GroupPayment />}
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
