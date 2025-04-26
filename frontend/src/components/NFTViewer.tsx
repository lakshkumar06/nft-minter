import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getIpfsUrl } from '../utils/ipfs';
import { NFT_ABI } from '../constants/abi';

// Deployed contract address on Westend Asset Hub
const NFT_CONTRACT_ADDRESS = '0x23B759b9795491D9B9CeA4789578B96F2b2164C5';

interface NFT {
  tokenId: string;
  name: string;
  description: string;
  image: string;
}

export const NFTViewer: React.FC = () => {
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [manualTokenId, setManualTokenId] = useState<string>('');
  const [manualName, setManualName] = useState<string>('');
  const [manualDescription, setManualDescription] = useState<string>('');
  const [manualImageUrl, setManualImageUrl] = useState<string>('');

  useEffect(() => {
    const fetchNFTs = async () => {
      try {
        if (!window.ethereum) {
          throw new Error('Please install MetaMask');
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();

        // Use the hardcoded contract address
        const contract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, signer);

        try {
          // Get all tokens owned by the current address
          const ownedTokens = await contract.tokensOfOwner(address);
          console.log('Owned tokens:', ownedTokens);
          
          // Convert Proxy result to array of token IDs
          const tokenIds = Array.from(ownedTokens as any[]).map(token => BigInt(token));
          console.log('Token IDs:', tokenIds);

          // Fetch metadata for each owned token
          const nftPromises = tokenIds.map(async (tokenId: bigint) => {
            try {
              const tokenURI = await contract.tokenURI(tokenId);
              console.log(`Token ${tokenId} URI:`, tokenURI);

              try {
                const response = await fetch(getIpfsUrl(tokenURI.replace('ipfs://', '')));
                if (!response.ok) {
                  throw new Error(`Failed to fetch metadata: ${response.statusText}`);
                }
                const metadata = await response.json();

                return {
                  tokenId: tokenId.toString(),
                  name: metadata.name || `NFT #${tokenId}`,
                  description: metadata.description || 'This is an NFT minted on the Westend Asset Hub',
                  image: metadata.image ? getIpfsUrl(metadata.image.replace('ipfs://', '')) : 'https://w3s.link/ipfs/QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco',
                };
              } catch (metadataError) {
                console.log(`Error fetching metadata for token ${tokenId}:`, metadataError);
                // Use fallback metadata
                return {
                  tokenId: tokenId.toString(),
                  name: `NFT #${tokenId}`,
                  description: 'This is an NFT minted on the Westend Asset Hub',
                  image: 'https://w3s.link/ipfs/QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco',
                };
              }
            } catch (tokenError) {
              console.log(`Error fetching token ${tokenId}:`, tokenError);
              return null;
            }
          });

          const nftData = (await Promise.all(nftPromises)).filter((nft): nft is NFT => nft !== null);
          setNfts(nftData);
        } catch (error) {
          console.log('Error getting owned tokens:', error);
          setError('Could not fetch your NFTs. Please use the manual input below.');
        }
      } catch (err) {
        console.error('Error fetching NFTs:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch NFTs');
      } finally {
        setLoading(false);
      }
    };

    fetchNFTs();
  }, []);

  const handleManualAdd = () => {
    if (!manualTokenId || !manualName || !manualDescription || !manualImageUrl) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const newNFT = {
        tokenId: manualTokenId,
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

  if (loading) {
    return <div>Loading your NFTs...</div>;
  }

  return (
    <div>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {/* Manual NFT Input Form */}
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold mb-2">Add NFT Manually</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Token ID</label>
            <input
              type="text"
              value={manualTokenId}
              onChange={(e) => setManualTokenId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Enter token ID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Enter NFT name"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={manualDescription}
              onChange={(e) => setManualDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Enter NFT description"
              rows={3}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
            <input
              type="text"
              value={manualImageUrl}
              onChange={(e) => setManualImageUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Enter image URL (e.g., https://w3s.link/ipfs/...)"
            />
          </div>
        </div>
        <button
          onClick={handleManualAdd}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Add NFT
        </button>
      </div>
      
      {/* NFT Display */}
      {nfts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No NFTs found. Add one manually or mint a new one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {nfts.map((nft) => (
            <div key={nft.tokenId} className="border rounded-lg p-4 shadow-lg">
              <img 
                src={nft.image} 
                alt={nft.name} 
                className="w-[20vw] h-[20vw] object-cover rounded-lg mb-4"
                width={'200'}
              />
              <h3 className="text-xl font-bold mb-2">{nft.name}</h3>
              <p className="text-gray-600 mb-2">{nft.description}</p>
              <p className="text-sm text-gray-500">Token ID: {nft.tokenId}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}; 