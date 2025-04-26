import { ethers } from 'ethers';

// Westend RPC URL
const WESTEND_RPC_URL = 'https://westend-asset-hub-eth-rpc.polkadot.io';

// Westend Asset Hub chain ID (in hex format)
const WESTEND_CHAIN_ID = '0x1919b0a1'; // 420420421 in hex

// Contract ABI for the NFTMinter contract
const NFT_MINTER_ABI = [
  "function mint(address to, string memory uri) public returns (uint256)",
  "function creatorOf(uint256 tokenId) public view returns (address)",
  "function name() public view returns (string memory)",
  "function symbol() public view returns (string memory)",
  "function totalSupply() public view returns (uint256)"
];

export const connectToWestend = async () => {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  try {
    // Request account access
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    
    // Switch to Westend network
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: WESTEND_CHAIN_ID }],
      });
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: WESTEND_CHAIN_ID,
                chainName: 'Polkadot Asset Hub (Westend)',
                nativeCurrency: {
                  name: 'Westend',
                  symbol: 'WND',
                  decimals: 18,
                },
                rpcUrls: [WESTEND_RPC_URL],
                blockExplorerUrls: ['https://westend.subscan.io/'],
              },
            ],
          });
        } catch (addError) {
          console.error('Error adding Westend network:', addError);
          throw new Error('Failed to add Westend network to MetaMask');
        }
      } else {
        console.error('Error switching to Westend network:', switchError);
        throw switchError;
      }
    }
    
    // Create Web3Provider
    const provider = new ethers.BrowserProvider(window.ethereum);
    return provider;
  } catch (error) {
    console.error('Error connecting to Westend:', error);
    throw new Error('Failed to connect to Westend network');
  }
};

export const mintNFT = async (
  provider: ethers.BrowserProvider,
  metadataUri: string,
  contractAddress: string
) => {
  try {
    const signer = await provider.getSigner();
    const address = await signer.getAddress();

    // Create contract instance
    const contract = new ethers.Contract(
      contractAddress,
      NFT_MINTER_ABI,
      signer
    );

    // Call the mint function
    const tx = await contract.mint(address, metadataUri);
    console.log('Transaction sent:', tx.hash);

    // Wait for the transaction to be mined
    const receipt = await tx.wait();
    console.log('Transaction confirmed:', receipt);

    return receipt;
  } catch (error) {
    console.error('Error minting NFT:', error);
    throw new Error('Failed to mint NFT');
  }
}; 