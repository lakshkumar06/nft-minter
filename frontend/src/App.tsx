import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { NFTMinter } from './components/NFTMinter'
import { getIpfsUrl } from './utils/ipfs'
import { NFT_ABI } from './constants/abi'

// Deployed contract address on Westend Asset Hub
const NFT_CONTRACT_ADDRESS = '0x92fd6660B83F6a37A782A24385A9db5460c1D749';

type NFT = {
  name: string;
  description: string;
  image: string;
}

function App() {
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [manualTokenId, setManualTokenId] = useState<string>('');
  const [manualName, setManualName] = useState<string>('');
  const [manualDescription, setManualDescription] = useState<string>('');
  const [manualImageUrl, setManualImageUrl] = useState<string>('');

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
        setAccount(accounts[0]);
      } catch (err) {
        console.error('Error connecting wallet:', err);
        setAccount(null);
      }
    }
  };

  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum as any);
          const signer = await provider.getSigner();
          const address = await signer.getAddress();
          setAccount(address);
        } catch (err) {
          console.error('Error checking connection:', err);
          setAccount(null);
        }
      }
    };

    checkConnection();

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        setAccount(accounts[0] || null);
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', () => {});
      }
    };
  }, []);

  useEffect(() => {
    const fetchNFTs = async () => {
      if (!account) {
        console.log('No account connected');
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching NFTs for account:', account);
        if (!window.ethereum) {
          throw new Error('Please install MetaMask');
        }
        const provider = new ethers.BrowserProvider(window.ethereum as any);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, signer);

        try {
          // Get the current token ID
          const currentId = await contract.getItemId();
          console.log('Current token ID:', currentId.toString());

          if (currentId.toString() === '0') {
            console.log('No tokens minted yet');
            setNfts([]);
            setLoading(false);
            return;
          }

          const nftPromises = [];
          // Fetch the last minted token
          try {
            const tokenId = BigInt(currentId) - BigInt(1); // Get the last minted token
            console.log(`Getting token ${tokenId.toString()}...`);
            const tokenURI = await contract.tokenURI(tokenId);
            console.log(`Token URI:`, tokenURI);

            // Handle base64 encoded metadata
            try {
              const data = tokenURI.split(',')[1];
              console.log('Base64 data:', data);
              const decodedData = atob(data);
              console.log('Decoded data:', decodedData);
              const metadata = JSON.parse(decodedData);
              console.log(`Metadata:`, metadata);

              nftPromises.push({
                name: metadata.name || `NFT #${tokenId}`,
                description: metadata.description || 'This is an NFT minted on the Westend Asset Hub',
                image: metadata.image,
              });
            } catch (metadataError) {
              console.error('Error processing metadata:', metadataError);
              // Try fetching from IPFS if base64 decoding fails
              try {
                const response = await fetch(getIpfsUrl(tokenURI.replace('ipfs://', '')));
                if (!response.ok) {
                  throw new Error(`Failed to fetch metadata: ${response.statusText}`);
                }
                const metadata = await response.json();
                console.log(`IPFS Metadata:`, metadata);

                nftPromises.push({
                  name: metadata.name || `NFT #${tokenId}`,
                  description: metadata.description || 'This is an NFT minted on the Westend Asset Hub',
                  image: metadata.image ? getIpfsUrl(metadata.image.replace('ipfs://', '')) : 'https://w3s.link/ipfs/QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco',
                });
              } catch (ipfsError) {
                console.error('Error fetching from IPFS:', ipfsError);
              }
            }
          } catch (error) {
            console.error(`Error fetching token:`, error);
          }

          console.log('Final NFT data:', nftPromises);
          setNfts(nftPromises);
        } catch (error) {
          console.error('Error getting tokens:', error);
          setError('Could not fetch your NFTs. Please try again later.');
        }
      } catch (err) {
        console.error('Error fetching NFTs:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch NFTs');
      } finally {
        setLoading(false);
      }
    };

    fetchNFTs();
  }, [account]);

  const handleManualAdd = () => {
    if (!manualTokenId || !manualName || !manualDescription || !manualImageUrl) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const newNFT = {
        name: manualName,
        description: manualDescription,
        image: manualImageUrl,
      };
      
      setNfts(prev => [...prev, newNFT]);
      setManualTokenId('');
      setManualName('');
      setManualDescription('');
      setManualImageUrl('');
    } catch (err) {
      console.error('Error adding NFT:', err);
      alert('Error adding NFT. Please check your inputs and try again.');
    }
  };

  const handleNFTCreated = (nft: NFT) => {
    console.log('NFT created:', nft);
    setNfts(prev => [...prev, nft]);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-8">NFT Minter</h1>
        <NFTMinter onNFTCreated={handleNFTCreated} account={account} onConnectWallet={connectWallet} />
        
        {account ? (
          <>
            <h2 className="text-3xl font-bold text-center my-8">Your NFTs</h2>
            {loading ? (
              <div>Loading your NFTs...</div>
            ) : (
              <>
                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                  </div>
                )}
                
                {/* NFT Display */}
                {nfts.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No NFTs found. Mint a new one to get started.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                    {nfts.map((nft, index) => (
                      <div key={index} className="border rounded-lg p-4 shadow-lg">
                        <img 
                          src={nft.image} 
                          alt={nft.name} 
                          className="w-full h-64 object-cover rounded-lg mb-4"
                        />
                        <h3 className="text-xl font-bold mb-2">{nft.name}</h3>
                        <p className="text-gray-600 mb-2">{nft.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">Please connect your wallet to view your NFTs</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
