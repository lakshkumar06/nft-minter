import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ethers } from 'ethers';

// Initialize the provider with the Westend Asset Hub chain ID
if (window.ethereum) {
  const provider = new ethers.BrowserProvider(window.ethereum, {
    name: 'Polkadot Asset Hub (Westend)',
    chainId: 420420421
  });
  
  // Make the provider available globally
  (window as any).westendProvider = provider;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
