export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes?: {
    trait_type: string;
    value: string | number;
  }[];
}

export interface PinataResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

export interface MintingState {
  isMinting: boolean;
  error: string | null;
  success: boolean;
} 