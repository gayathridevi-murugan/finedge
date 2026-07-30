import React, { useState, useEffect } from 'react';
import { useCheckoutStore } from '../store/checkoutStore';
import { scanNFCTag, createCart, addItemsToCart } from '../services/api';
import '../styles/NFCTerminal.css';

const DEMO_TAGS = {
  'success': ['DEMO_0001', 'DEMO_0002', 'DEMO_0003'],
  'unpaid-item': ['DEMO_0001', 'DEMO_0002', 'DEMO_0003', 'DEMO_0004'],
  'payment-failure': ['DEMO_0001', 'DEMO_0002'],
  'manual': []
};

export default function NFCTerminal() {
  const demoMode = useCheckoutStore((state) => state.demoMode);
  const cartId = useCheckoutStore((state) => state.cartId);
  const setCurrentScreen = useCheckoutStore((state) => state.setCurrentScreen);
  const setCartItems = useCheckoutStore((state) => state.setCartItems);
  const setCartTotal = useCheckoutStore((state) => state.setCartTotal);
  const setError = useCheckoutStore((state) => state.setError);

  const [stage, setStage] = useState('ready');
  const [detectedCount, setDetectedCount] = useState(0);
  const [isScanning, setIsScanning] = useState(false);

  const handleStartScan = async () => {
    if (isScanning) return;

    try {
      setIsScanning(true);
      setStage('scanning');

      // Simulate scanning delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Get demo tags for this scenario
      const tagsToScan = DEMO_TAGS[demoMode] || DEMO_TAGS['success'];

      if (tagsToScan.length === 0) {
        // Manual mode - skip to cart
        setCurrentScreen('cart');
        return;
      }

      setStage('detected');
      setDetectedCount(tagsToScan.length);

      // Simulate product identification
      await new Promise(resolve => setTimeout(resolve, 1500));
      setStage('identifying');

      // Scan each product
      const cartItems = [];
      for (const tagId of tagsToScan) {
        try {
          const response = await scanNFCTag(tagId);
          if (response.data.data.product) {
            const product = response.data.data.product;
            cartItems.push({
              product_id: product.id,
              product_name: product.name,
              price: parseFloat(product.price),
              quantity: 1,
              category: product.category
            });
          }
        } catch (error) {
          console.error(`Error scanning tag ${tagId}:`, error);
        }
      }

      setCartItems(cartItems);
      const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      setCartTotal(parseFloat(total.toFixed(2)));

      // Auto-transition to cart
      await new Promise(resolve => setTimeout(resolve, 1500));
      setCurrentScreen('cart');
    } catch (error) {
      console.error('Error during NFC scan:', error);
      setError('Error scanning products: ' + error.message);
      setStage('ready');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="nfc-terminal-screen">
      <div className="nfc-terminal-content">
        {stage === 'ready' && (
          <div className="nfc-stage ready fade-in">
            <div className="terminal-frame">
              <div className="nfc-display">
                <div className="display-icon">◆</div>
                <div className="display-text">READY</div>
              </div>
            </div>
            <h1>Place Your Products</h1>
            <p className="nfc-instruction">Hold products near the NFC terminal</p>
            <button
              className="scan-button"
              onClick={handleStartScan}
              disabled={isScanning}
            >
              <span>START NFC SCAN</span>
              <span className="arrow">→</span>
            </button>
          </div>
        )}

        {stage === 'scanning' && (
          <div className="nfc-stage scanning fade-in">
            <div className="terminal-frame">
              <div className="nfc-scanner">
                <div className="scan-pulse"></div>
                <div className="scan-pulse"></div>
                <div className="scan-pulse"></div>
              </div>
            </div>
            <h1>Scanning...</h1>
            <p className="nfc-instruction">Detecting NFC tags nearby</p>
          </div>
        )}

        {stage === 'detected' && (
          <div className="nfc-stage detected fade-in">
            <div className="terminal-frame success">
              <div className="nfc-success">✓</div>
            </div>
            <h1>Tags Detected</h1>
            <p className="nfc-count">{detectedCount} Products Found</p>
          </div>
        )}

        {stage === 'identifying' && (
          <div className="nfc-stage identifying fade-in">
            <div className="terminal-frame">
              <div className="nfc-identify">
                <div className="spinner"></div>
              </div>
            </div>
            <h1>Identifying Products</h1>
            <p className="nfc-instruction">Matching tags to inventory...</p>
          </div>
        )}

        <div className="nfc-footer">
          <span className="demo-badge">DEMO MODE • {demoMode.replace('-', ' ').toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
}
