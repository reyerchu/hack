// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title HackathonNFT
 * @dev Official Hackathon Taiwan NFT Contract
 */
contract HackathonNFT is ERC721, ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;
    uint256 public maxSupply;
    
    // Whitelist mapping: address => allowed to mint
    mapping(address => bool) public whitelist;
    mapping(address => bool) public hasMinted;
    
    event NFTMinted(address indexed minter, uint256 tokenId, string tokenURI);
    event WhitelistUpdated(address indexed account, bool status);
    
    constructor(
        string memory name,
        string memory symbol,
        uint256 _maxSupply
    ) ERC721(name, symbol) Ownable(msg.sender) {
        maxSupply = _maxSupply;
        _tokenIdCounter = 1;
    }
    
    /**
     * @dev Add addresses to whitelist (batch)
     */
    function addToWhitelist(address[] calldata addresses) external onlyOwner {
        for (uint256 i = 0; i < addresses.length; i++) {
            whitelist[addresses[i]] = true;
            emit WhitelistUpdated(addresses[i], true);
        }
    }
    
    /**
     * @dev Remove addresses from whitelist (batch)
     */
    function removeFromWhitelist(address[] calldata addresses) external onlyOwner {
        for (uint256 i = 0; i < addresses.length; i++) {
            whitelist[addresses[i]] = false;
            emit WhitelistUpdated(addresses[i], false);
        }
    }
    
    /**
     * @dev Mint NFT (only whitelisted addresses, once per address)
     */
    function mint(string memory tokenURI) external {
        require(whitelist[msg.sender], "Not whitelisted");
        require(!hasMinted[msg.sender], "Already minted");
        require(_tokenIdCounter <= maxSupply, "Max supply reached");
        
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI);
        
        hasMinted[msg.sender] = true;
        
        emit NFTMinted(msg.sender, tokenId, tokenURI);
    }
    
    /**
     * @dev Check if address is eligible to mint
     */
    function canMint(address account) external view returns (bool) {
        return whitelist[account] && !hasMinted[account] && _tokenIdCounter <= maxSupply;
    }
    
    /**
     * @dev Override required by Solidity
     */
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
    
    /**
     * @dev Override required by Solidity
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

