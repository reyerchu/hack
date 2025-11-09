// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RWA Hackathon NFT
 * @notice NFT for RWA Hackathon Taiwan participants
 * @dev Implements whitelist-based minting with one NFT per address
 * @dev Uses OpenZeppelin Contracts v5.x (latest version)
 */
contract RWAHackathonNFT is ERC721URIStorage, Ownable {
    // Token ID counter (OpenZeppelin v5 removed Counters library)
    uint256 private _nextTokenId;

    // Configuration
    uint256 public immutable maxSupply;
    string public baseTokenURI;
    
    // Minting control
    mapping(address => bool) public hasMinted;
    mapping(address => bool) public whitelist;
    bool public mintingEnabled;

    // Events
    event NFTMinted(address indexed to, uint256 indexed tokenId);
    event WhitelistAdded(address[] addresses);
    event WhitelistRemoved(address[] addresses);
    event MintingStatusChanged(bool enabled);
    event BaseURIUpdated(string newBaseURI);

    /**
     * @notice Constructor
     * @param name NFT collection name
     * @param symbol NFT collection symbol
     * @param _maxSupply Maximum number of NFTs that can be minted
     * @param _baseTokenURI Base URI for token metadata
     */
    constructor(
        string memory name,
        string memory symbol,
        uint256 _maxSupply,
        string memory _baseTokenURI
    ) ERC721(name, symbol) Ownable(msg.sender) {
        require(_maxSupply > 0, "Max supply must be greater than 0");
        maxSupply = _maxSupply;
        baseTokenURI = _baseTokenURI;
        _nextTokenId = 1; // Start from token ID 1
    }

    /**
     * @notice Add addresses to whitelist (batch operation)
     * @param addresses Array of addresses to whitelist
     */
    function addToWhitelist(address[] calldata addresses) external onlyOwner {
        for (uint i = 0; i < addresses.length; i++) {
            whitelist[addresses[i]] = true;
        }
        emit WhitelistAdded(addresses);
    }

    /**
     * @notice Remove addresses from whitelist
     * @param addresses Array of addresses to remove
     */
    function removeFromWhitelist(address[] calldata addresses) external onlyOwner {
        for (uint i = 0; i < addresses.length; i++) {
            whitelist[addresses[i]] = false;
        }
        emit WhitelistRemoved(addresses);
    }

    /**
     * @notice Enable or disable minting
     * @param enabled Whether minting should be enabled
     */
    function setMintingEnabled(bool enabled) external onlyOwner {
        mintingEnabled = enabled;
        emit MintingStatusChanged(enabled);
    }

    /**
     * @notice Update base URI for metadata
     * @param newBaseURI New base URI
     */
    function setBaseURI(string memory newBaseURI) external onlyOwner {
        baseTokenURI = newBaseURI;
        emit BaseURIUpdated(newBaseURI);
    }

    /**
     * @notice Mint NFT (public function for whitelisted addresses)
     * @dev Each address can only mint once
     */
    function mint() external {
        require(mintingEnabled, "Minting is not enabled");
        require(whitelist[msg.sender], "Not whitelisted");
        require(!hasMinted[msg.sender], "Already minted");
        require(_nextTokenId <= maxSupply, "Max supply reached");

        uint256 tokenId = _nextTokenId;
        _nextTokenId++;
        
        _safeMint(msg.sender, tokenId);
        hasMinted[msg.sender] = true;

        emit NFTMinted(msg.sender, tokenId);
    }

    /**
     * @notice Get total number of minted NFTs
     * @return Total supply of minted tokens
     */
    function totalSupply() public view returns (uint256) {
        return _nextTokenId - 1;
    }

    /**
     * @notice Check if address is whitelisted and hasn't minted
     * @param account Address to check
     * @return Whether the address can mint
     */
    function canMint(address account) public view returns (bool) {
        return mintingEnabled 
            && whitelist[account] 
            && !hasMinted[account]
            && _nextTokenId <= maxSupply;
    }

    /**
     * @notice Override base URI function
     * @return Base URI string
     */
    function _baseURI() internal view override returns (string memory) {
        return baseTokenURI;
    }

    /**
     * @notice Get the next token ID that will be minted
     * @return Next token ID
     */
    function getNextTokenId() public view returns (uint256) {
        return _nextTokenId;
    }
}
