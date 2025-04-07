import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import ConnectWallet from './ConnectWallet';
import ChatInterface from './ChatInterface';
import abi from './abi.json'; // You need to create this file

// IMPORTANT: Replace with your deployed contract address
const CONTRACT_ADDRESS = "YOUR_DEPLOYED_CONTRACT_ADDRESS_HERE";

function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const connectWallet = useCallback(async () => {
    setError('');
    setIsLoading(true);
    if (typeof window.ethereum !== 'undefined') {
      try {
        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const currentAccount = accounts[0];
        setAccount(currentAccount);

        // Set up provider and signer
        const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(web3Provider);
        const web3Signer = web3Provider.getSigner();
        setSigner(web3Signer);

        // Instantiate contract
        const chatContract = new ethers.Contract(CONTRACT_ADDRESS, abi, web3Signer);
        setContract(chatContract);

        setIsConnected(true);
        console.log("Wallet connected:", currentAccount);

        // Listen for account changes
        window.ethereum.on('accountsChanged', (newAccounts) => {
          console.log("Account changed:", newAccounts[0]);
          if (newAccounts.length === 0) {
            // Handle wallet disconnection
            disconnectWallet();
          } else {
            setAccount(newAccounts[0]);
            // Re-initialize signer and contract with new account
            const newSigner = web3Provider.getSigner(newAccounts[0]);
            setSigner(newSigner);
            setContract(new ethers.Contract(CONTRACT_ADDRESS, abi, newSigner));
          }
        });

        // Listen for chain changes (optional but recommended)
        window.ethereum.on('chainChanged', (_chainId) => {
          // Handle chain change, e.g., reload the page or prompt user
          console.log("Network changed:", _chainId);
          window.location.reload(); // Simple way to handle it
        });

      } catch (err) {
        console.error("Failed to connect wallet:", err);
        setError(`Failed to connect wallet: ${err.message || 'User rejected connection.'}`);
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    } else {
      setError('MetaMask (or another Ethereum wallet) is not installed. Please install it to use this dApp.');
      setIsLoading(false);
    }
  }, []);

  const disconnectWallet = () => {
    setProvider(null);
    setSigner(null);
    setAccount(null);
    setContract(null);
    setIsConnected(false);
    setError('');
    console.log("Wallet disconnected");
    // Optional: Remove listeners if necessary, though they might become inactive
    // if (window.ethereum && window.ethereum.removeListener) {
    //   window.ethereum.removeListener('accountsChanged', ...);
    //   window.ethereum.removeListener('chainChanged', ...);
    // }
  };

  // Check connection on initial load (optional)
  // useEffect(() => {
  //   const checkConnection = async () => {
  //     if (window.ethereum) {
  //       const accounts = await window.ethereum.request({ method: 'eth_accounts' });
  //       if (accounts.length > 0) {
  //         connectWallet(); // Automatically connect if already permitted
  //       }
  //     }
  //   };
  //   checkConnection();
  // }, [connectWallet]);

  return (
    <div>
      <h1>Web3 Chat dApp</h1>
      {error && <p className="error">{error}</p>}
      {isLoading && <p className="loading">Connecting...</p>}

      {!isConnected ? (
        <ConnectWallet connectWallet={connectWallet} isLoading={isLoading} />
      ) : (
        <div className="wallet-info">
          <p>Connected Account: <strong>{account}</strong></p>
          <button onClick={disconnectWallet}>Disconnect Wallet</button>
          <ChatInterface contract={contract} signer={signer} account={account} />
        </div>
      )}
       <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.9em', color: '#666' }}>
         Ensure you have replaced <code>YOUR_DEPLOYED_CONTRACT_ADDRESS_HERE</code> and created <code>abi.json</code> as per the README.
       </p>
    </div>
  );
}

export default App;
