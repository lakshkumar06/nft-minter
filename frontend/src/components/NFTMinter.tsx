import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { uploadToIPFS, uploadMetadataToIPFS } from '../utils/ipfs';
import { MintingState, NFTMetadata } from '../types/nft';

// Deployed contract address on Westend Asset Hub
const NFT_MINTER_CONTRACT_ADDRESS = '0x638E86380f7104347A4c472Ec7A7Fd2817A0f925';

// Contract ABI for the NFTMinter contract
const NFT_MINTER_ABI = [
  "function mint(address to, string memory uri) public returns (uint256)",
  "function creatorOf(uint256 tokenId) public view returns (address)",
  "function name() public view returns (string memory)",
  "function symbol() public view returns (string memory)",
  "function totalSupply() public view returns (uint256)"
];

export const NFTMinter = () => {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [account, setAccount] = useState<string>('');
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [mintingState, setMintingState] = useState<MintingState>({
    isMinting: false,
    error: null,
    success: false,
  });

  // Initialize provider and contract
  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        try {
          // Use the global provider if available, otherwise create a new one
          const westendProvider = (window as any).westendProvider || 
            new ethers.BrowserProvider(window.ethereum, {
              name: 'Polkadot Asset Hub (Westend)',
              chainId: 420420421
            });
          
          setProvider(westendProvider);
          
          // Create contract instance
          const contractInstance = new ethers.Contract(
            NFT_MINTER_CONTRACT_ADDRESS,
            NFT_MINTER_ABI,
            westendProvider
          ) as ethers.Contract;
          
          setContract(contractInstance);
        } catch (error) {
          console.error('Error initializing provider and contract:', error);
        }
      }
    };
    
    init();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        // Request account access
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
        
        setAccount(accounts[0]);
        
        // Get signer after connecting wallet
        if (provider) {
          const signer = await provider.getSigner();
          setSigner(signer);
          
          // Update contract with signer
          if (contract) {
            const contractWithSigner = contract.connect(signer) as ethers.Contract;
            setContract(contractWithSigner);
          }
        }
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setMintingState({
        isMinting: false,
        error: 'Failed to connect wallet',
        success: false,
      });
    }
  };

  const handleMint = async () => {
    if (!file || !name || !description) {
      setMintingState({
        isMinting: false,
        error: 'Please fill in all fields',
        success: false,
      });
      return;
    }

    if (!account || !contract || !signer) {
      setMintingState({
        isMinting: false,
        error: 'Please connect your wallet first',
        success: false,
      });
      return;
    }

    setMintingState({ isMinting: true, error: null, success: false });

    try {
      // Upload image to IPFS
      const imageUri = await uploadToIPFS(file);

      // Create and upload metadata
      const metadata: NFTMetadata = {
        name,
        description,
        image: imageUri,
      };
      const metadataUri = await uploadMetadataToIPFS(metadata);

      // Mint NFT
      const tx = await contract.mint(account, metadataUri);
      console.log('Transaction sent:', tx.hash);

      // Wait for the transaction to be mined
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);

      setMintingState({
        isMinting: false,
        error: null,
        success: true,
      });
    } catch (error) {
      console.error('Error minting NFT:', error);
      setMintingState({
        isMinting: false,
        error: error instanceof Error ? error.message : 'Failed to mint NFT',
        success: false,
      });
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h1>Westend NFT Minter</h1>
      
      {!account ? (
        <button 
          onClick={connectWallet}
          style={{
            padding: '10px 20px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginBottom: '20px'
          }}
        >
          Connect Wallet
        </button>
      ) : (
        <div style={{ marginBottom: '20px' }}>
          <p>Connected Account: {account}</p>
        </div>
      )}
      
      {account && (
        <>
          <div style={{ marginBottom: '20px' }}>
            <label>
              NFT Image:
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'block', marginTop: '10px' }}
              />
            </label>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label>
              Name:
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ display: 'block', marginTop: '10px', width: '100%' }}
              />
            </label>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label>
              Description:
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ display: 'block', marginTop: '10px', width: '100%' }}
              />
            </label>
          </div>

          <button
            onClick={handleMint}
            disabled={mintingState.isMinting}
            style={{
              padding: '10px 20px',
              backgroundColor: mintingState.isMinting ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: mintingState.isMinting ? 'not-allowed' : 'pointer',
            }}
          >
            {mintingState.isMinting ? 'Minting...' : 'Mint NFT'}
          </button>

          {mintingState.error && (
            <div style={{ color: 'red', marginTop: '10px' }}>
              Error: {mintingState.error}
            </div>
          )}

          {mintingState.success && (
            <div style={{ color: 'green', marginTop: '10px' }}>
              NFT minted successfully!
            </div>
          )}
        </>
      )}
    </div>
  );
}; 