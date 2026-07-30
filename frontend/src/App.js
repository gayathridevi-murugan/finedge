import React from 'react';
import { useCheckoutStore } from './store/checkoutStore';
import Welcome from './pages/Welcome';
import DemoSelector from './pages/DemoSelector';
import NFCTerminal from './pages/NFCTerminal';
import SmartCart from './pages/SmartCart';
import Payment from './pages/Payment';
import CheckoutComplete from './pages/CheckoutComplete';
import ExitVerification from './pages/ExitVerification';
import Receipt from './pages/Receipt';
import './App.css';

export default function App() {
  const currentScreen = useCheckoutStore((state) => state.currentScreen);

  return (
    <div className="app">
      {currentScreen === 'welcome' && <Welcome />}
      {currentScreen === 'demo-selector' && <DemoSelector />}
      {currentScreen === 'nfc-terminal' && <NFCTerminal />}
      {currentScreen === 'cart' && <SmartCart />}
      {currentScreen === 'payment' && <Payment />}
      {currentScreen === 'checkout-complete' && <CheckoutComplete />}
      {currentScreen === 'exit-verification' && <ExitVerification />}
      {currentScreen === 'receipt' && <Receipt />}
    </div>
  );
}
