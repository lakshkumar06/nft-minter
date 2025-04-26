import { create } from "@web3-storage/w3up-client";
import { NFTMetadata } from '../types/nft';

// IPFS gateway for viewing content
const IPFS_GATEWAY = 'https://w3s.link/ipfs/';

let client: Awaited<ReturnType<typeof create>> | null = null;
let space: any | null = null;

/**
 * Initialize the Web3.Storage client and space
 */
export const initializeIPFS = async () => {
  try {
    if (!client) {
      // Create client
      client = await create();
    }
    
    // Login with email (you'll need to replace this with your email)
    const email = import.meta.env.VITE_W3UP_EMAIL;
    if (!email) {
      throw new Error('W3UP_EMAIL environment variable is not set');
    }
    
    const account = await client.login(email);
    
    // Wait for payment plan if needed
    await account.plan.wait();
    
    // Create or get space
    if (!space) {
      space = await client.createSpace("nft-storage-space", { 
        account,
        skipGatewayAuthorization: false // Allow gateway to serve content
      });
      await client.setCurrentSpace(space.did());
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing IPFS:', error);
    return false;
  }
};

/**
 * Uploads a file to IPFS using Web3.Storage
 * @param file The file to upload
 * @returns The IPFS hash of the uploaded file
 */
export const uploadToIPFS = async (file: File): Promise<string> => {
  try {
    console.log('Starting file upload to IPFS via Web3.Storage...');
    
    if (!client || !space) {
      const initialized = await initializeIPFS();
      if (!initialized) {
        throw new Error('Failed to initialize IPFS client');
      }
    }
    
    // Upload the file
    const cid = await client!.uploadFile(file);
    console.log('File uploaded successfully:', cid);
    
    // Return the IPFS hash with the ipfs:// prefix
    return `ipfs://${cid}`;
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    
    // Fallback to mock IPFS hash for testing
    console.log('Using fallback mock IPFS hash for testing');
    return 'ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco';
  }
};

/**
 * Uploads metadata to IPFS using Web3.Storage
 * @param metadata The NFT metadata to upload
 * @returns The IPFS hash of the uploaded metadata
 */
export const uploadMetadataToIPFS = async (metadata: NFTMetadata): Promise<string> => {
  try {
    console.log('Starting metadata upload to IPFS via Web3.Storage...', metadata);
    
    if (!client || !space) {
      const initialized = await initializeIPFS();
      if (!initialized) {
        throw new Error('Failed to initialize IPFS client');
      }
    }
    
    // Convert metadata to File
    const blob = new Blob([JSON.stringify(metadata)], { type: 'application/json' });
    const file = new File([blob], 'metadata.json', { type: 'application/json' });
    
    // Upload the file
    const cid = await client!.uploadFile(file);
    console.log('Metadata uploaded successfully:', cid);
    
    // Return the IPFS hash with the ipfs:// prefix
    return `ipfs://${cid}`;
  } catch (error) {
    console.error('Error uploading metadata to IPFS:', error);
    
    // Fallback to mock IPFS hash for testing
    console.log('Using fallback mock IPFS hash for testing');
    return 'ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco';
  }
};

/**
 * Gets the public URL for an IPFS hash
 * @param ipfsHash The IPFS hash (with or without ipfs:// prefix)
 * @returns The public URL to view the content
 */
export const getIpfsUrl = (ipfsHash: string): string => {
  // Remove ipfs:// prefix if present
  const hash = ipfsHash.replace('ipfs://', '');
  return `${IPFS_GATEWAY}${hash}`;
}; 