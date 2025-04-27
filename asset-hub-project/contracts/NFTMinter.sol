// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract nftMinter is ERC721URIStorage {
    uint256 private _tokenIds;

    constructor() ERC721("SOREN NFT", "SOREN") {}

    function mintNFT(string memory tokenURI) public returns (uint256) {
        uint256 newItemId = _tokenIds;
        _mint(msg.sender, newItemId);
        _setTokenURI(newItemId, tokenURI);

        _tokenIds++;
        return newItemId;
    }

    function getItemId() public view returns(uint256) {
        return _tokenIds;
    }
}