import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { uploadToIPFS, uploadMetadataToIPFS } from '../utils/ipfs';
import { MintingState, NFTMetadata } from '../types/nft';

// Deployed contract address on Westend Asset Hub
const NFT_MINTER_CONTRACT_ADDRESS = '0x92fd6660B83F6a37A782A24385A9db5460c1D749';

// Contract ABI for the NFTMinter contract
const NFT_MINTER_ABI = [
  "function mintNFT(string memory tokenURI) public returns (uint256)",
  "function getItemId() public view returns(uint256)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
];

interface NFTMinterProps {
  onNFTCreated: (nft: { name: string; description: string; image: string }) => void;
  account: string | null;
  onConnectWallet: () => Promise<void>;
}

export const NFTMinter: React.FC<NFTMinterProps> = ({ onNFTCreated, account, onConnectWallet }) => {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
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
          const provider = new ethers.BrowserProvider(window.ethereum as any);
          setProvider(provider);
          
          const contractInstance = new ethers.Contract(
            NFT_MINTER_CONTRACT_ADDRESS,
            NFT_MINTER_ABI,
            provider
          );
          
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
      console.log('Uploading image to IPFS...');
      const imageUri = await uploadToIPFS(file);
      console.log('Image uploaded to IPFS:', imageUri);

      // Create and upload metadata
      const metadata: NFTMetadata = {
        name,
        description,
        image: imageUri,
      };
      console.log('Uploading metadata to IPFS...');
      const metadataUri = await uploadMetadataToIPFS(metadata);
      console.log('Metadata uploaded to IPFS:', metadataUri);

      // Mint NFT
      console.log('Minting NFT with metadata URI:', metadataUri);
      const tx = await contract.mintNFT(metadataUri);
      console.log('Transaction sent:', tx.hash);

      // Wait for the transaction to be mined
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);

      // Pass the NFT data to parent component
      onNFTCreated({
        name,
        description,
        image: imageUri
      });

      setMintingState({
        isMinting: false,
        error: null,
        success: true,
      });

      // Clear form
      setFile(null);
      setName('');
      setDescription('');
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
          onClick={onConnectWallet}
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