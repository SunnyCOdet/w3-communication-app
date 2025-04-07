import React from 'react';

function ConnectWallet({ connectWallet, isLoading }) {
  return (
    <div style={{ textAlign: 'center', marginTop: '30px' }}>
      <h2>Connect Your Wallet</h2>
      <p>Please connect your Ethereum wallet (e.g., MetaMask) to use the chat.</p>
      <button onClick={connectWallet} disabled={isLoading}>
        {isLoading ? 'Connecting...' : 'Connect Wallet'}
      </button>
    </div>
  );
}

export default ConnectWallet;
