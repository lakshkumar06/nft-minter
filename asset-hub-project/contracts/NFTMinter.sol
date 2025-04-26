// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/**
 * @title NFTMinter
 * @dev A simple NFT contract for Westend
 */
contract NFTMinter {
    // Token name and symbol
    string private _name;
    string private _symbol;
    
    // Mapping from token ID to owner address
    mapping(uint256 => address) private _owners;
    
    // Mapping from token ID to token URI
    mapping(uint256 => string) private _tokenURIs;
    
    // Mapping from token ID to creator address
    mapping(uint256 => address) private _creators;
    
    // Mapping from owner address to array of owned token IDs
    mapping(address => uint256[]) private _ownedTokens;
    
    // Mapping from token ID to its position in the owner's token array
    mapping(uint256 => uint256) private _ownedTokensIndex;
    
    // Counter for token IDs
    uint256 private _tokenIds;
    
    // Events
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Mint(address indexed to, uint256 indexed tokenId, string uri);
    
    /**
     * @dev Constructor that sets the collection name and symbol
     * @param name_ The name of the NFT collection
     * @param symbol_ The symbol of the NFT collection
     */
    constructor(string memory name_, string memory symbol_) {
        _name = name_;
        _symbol = symbol_;
    }
    
    /**
     * @dev Returns the name of the token
     * @return string The name of the token
     */
    function name() public view returns (string memory) {
        return _name;
    }
    
    /**
     * @dev Returns the symbol of the token
     * @return string The symbol of the token
     */
    function symbol() public view returns (string memory) {
        return _symbol;
    }
    
    /**
     * @dev Mints a new NFT with the given URI
     * @param to The address that will own the minted NFT
     * @param uri The token URI of the NFT metadata
     * @return uint256 The ID of the newly minted NFT
     */
    function mint(address to, string memory uri) public returns (uint256) {
        _tokenIds++;
        uint256 newTokenId = _tokenIds;
        
        _owners[newTokenId] = to;
        _tokenURIs[newTokenId] = uri;
        _creators[newTokenId] = msg.sender;
        
        // Add token to owner's array
        _ownedTokens[to].push(newTokenId);
        _ownedTokensIndex[newTokenId] = _ownedTokens[to].length - 1;
        
        emit Transfer(address(0), to, newTokenId);
        emit Mint(to, newTokenId, uri);
        
        return newTokenId;
    }
    
    /**
     * @dev Returns the owner of a token
     * @param tokenId The ID of the token
     * @return address The owner's address
     */
    function ownerOf(uint256 tokenId) public view returns (address) {
        address owner = _owners[tokenId];
        require(owner != address(0), "NFTMinter: owner query for nonexistent token");
        return owner;
    }
    
    /**
     * @dev Returns the token URI of a token
     * @param tokenId The ID of the token
     * @return string The token URI
     */
    function tokenURI(uint256 tokenId) public view returns (string memory) {
        require(_exists(tokenId), "NFTMinter: URI query for nonexistent token");
        return _tokenURIs[tokenId];
    }
    
    /**
     * @dev Returns the creator of a token
     * @param tokenId The ID of the token
     * @return address The creator's address
     */
    function creatorOf(uint256 tokenId) public view returns (address) {
        require(_exists(tokenId), "NFTMinter: creator query for nonexistent token");
        return _creators[tokenId];
    }
    
    /**
     * @dev Returns all token IDs owned by an address
     * @param owner The address to query
     * @return uint256[] Array of token IDs owned by the address
     */
    function tokensOfOwner(address owner) public view returns (uint256[] memory) {
        return _ownedTokens[owner];
    }
    
    /**
     * @dev Returns the total number of tokens minted
     * @return uint256 The total number of tokens
     */
    function totalSupply() public view returns (uint256) {
        return _tokenIds;
    }
    
    /**
     * @dev Returns whether a token exists
     * @param tokenId The ID of the token
     * @return bool Whether the token exists
     */
    function _exists(uint256 tokenId) internal view returns (bool) {
        return _owners[tokenId] != address(0);
    }
} 