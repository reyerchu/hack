// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title RWA Hackathon NFT
 * @notice NFT for RWA Hackathon Taiwan participants
 * @dev Implements whitelist-based minting with one NFT per address
 */
contract RWAHackathonNFT is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    // Configuration
    uint256 public immutable MAX_SUPPLY;
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
     * @param maxSupply Maximum number of NFTs that can be minted
     * @param _baseTokenURI Base URI for token metadata
     */
    constructor(
        string memory name,
        string memory symbol,
        uint256 maxSupply,
        string memory _baseTokenURI
    ) ERC721(name, symbol) Ownable(msg.sender) {
        MAX_SUPPLY = maxSupply;
        baseTokenURI = _baseTokenURI;
        mintingEnabled = false;
    }

    /**
     * @notice Add addresses to whitelist
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
     */
    function mint() external {
        require(mintingEnabled, "Minting is not enabled");
        require(whitelist[msg.sender], "Not whitelisted");
        require(!hasMinted[msg.sender], "Already minted");
        require(_tokenIdCounter.current() < MAX_SUPPLY, "Max supply reached");

        _tokenIdCounter.increment();
        uint256 newTokenId = _tokenIdCounter.current();
        
        _safeMint(msg.sender, newTokenId);
        hasMinted[msg.sender] = true;

        emit NFTMinted(msg.sender, newTokenId);
    }

    /**
     * @notice Get total number of minted NFTs
     */
    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter.current();
    }

    /**
     * @notice Check if address is whitelisted and hasn't minted
     */
    function canMint(address account) public view returns (bool) {
        return mintingEnabled && 
               whitelist[account] && 
               !hasMinted[account] && 
               _tokenIdCounter.current() < MAX_SUPPLY;
    }

    /**
     * @notice Get base URI for token metadata
     */
    function _baseURI() internal view override returns (string memory) {
        return baseTokenURI;
    }
}

