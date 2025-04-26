export const NFT_ABI = [
  "function mint(address to, string memory uri) public returns (uint256)",
  "function creatorOf(uint256 tokenId) public view returns (address)",
  "function name() public view returns (string memory)",
  "function symbol() public view returns (string memory)",
  "function totalSupply() public view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function tokensOfOwner(address owner) view returns (uint256[])",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
]; 