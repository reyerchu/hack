// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title RWA Hackathon NFT with Merkle Tree Whitelist
 * @notice NFT for RWA Hackathon Taiwan participants
 * @dev Uses Merkle Tree for gas-efficient whitelist management
 * @dev Whitelist is based on email hashes for privacy
 */
contract RWAHackathonNFT is ERC721URIStorage, Ownable {
    // Token ID counter
    uint256 private _nextTokenId;

    // Configuration
    uint256 public immutable maxSupply;
    string public baseTokenURI;
    
    // Merkle Tree root for whitelist (email hashes)
    bytes32 public merkleRoot;
    
    // Minting control
    mapping(bytes32 => bool) public hasMinted; // emailHash => minted
    bool public mintingEnabled;

    // Events
    event NFTMinted(address indexed to, uint256 indexed tokenId, bytes32 emailHash);
    event MerkleRootUpdated(bytes32 newRoot);
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
     * @notice Set Merkle Root for whitelist
     * @param _merkleRoot New Merkle root
     */
    function setMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
        merkleRoot = _merkleRoot;
        emit MerkleRootUpdated(_merkleRoot);
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
     * @notice Set Merkle Root and enable minting in one transaction
     * @param _merkleRoot New Merkle root
     * @dev Combines setMerkleRoot and setMintingEnabled(true) to save gas and reduce steps
     */
    function setupAndEnableMinting(bytes32 _merkleRoot) external onlyOwner {
        merkleRoot = _merkleRoot;
        mintingEnabled = true;
        emit MerkleRootUpdated(_merkleRoot);
        emit MintingStatusChanged(true);
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
     * @notice Mint NFT with Merkle proof
     * @param emailHash Hash of the user's email (keccak256)
     * @param merkleProof Merkle proof for the email
     * @dev Each email can only mint once
     */
    function mint(bytes32 emailHash, bytes32[] calldata merkleProof) external {
        require(mintingEnabled, "Minting is not enabled");
        require(merkleRoot != bytes32(0), "Merkle root not set");
        require(!hasMinted[emailHash], "Email already minted");
        require(_nextTokenId <= maxSupply, "Max supply reached");

        // Verify Merkle proof
        bytes32 leaf = emailHash;
        require(
            MerkleProof.verify(merkleProof, merkleRoot, leaf),
            "Invalid Merkle proof"
        );

        uint256 tokenId = _nextTokenId;
        _nextTokenId++;
        
        _safeMint(msg.sender, tokenId);
        hasMinted[emailHash] = true;

        emit NFTMinted(msg.sender, tokenId, emailHash);
    }

    /**
     * @notice Get total number of minted NFTs
     * @return Total supply of minted tokens
     */
    function totalSupply() public view returns (uint256) {
        return _nextTokenId - 1;
    }

    /**
     * @notice Check if an email hash has already minted
     * @param emailHash Hash of the email to check
     * @return Whether the email has minted
     */
    function hasEmailMinted(bytes32 emailHash) public view returns (bool) {
        return hasMinted[emailHash];
    }

    /**
     * @notice Verify if an email is in the whitelist (without minting)
     * @param emailHash Hash of the email
     * @param merkleProof Merkle proof for the email
     * @return Whether the email is whitelisted
     */
    function verifyWhitelist(
        bytes32 emailHash,
        bytes32[] calldata merkleProof
    ) public view returns (bool) {
        if (merkleRoot == bytes32(0)) return false;
        return MerkleProof.verify(merkleProof, merkleRoot, emailHash);
    }

    /**
     * @notice Override base URI function
     * @return Base URI string
     */
    function _baseURI() internal view override returns (string memory) {
        return baseTokenURI;
    }

    /**
     * @notice Override tokenURI to return correct IPFS path
     * @param tokenId Token ID
     * @return Token URI string
     * @dev Returns baseTokenURI + tokenId + ".json" for IPFS metadata structure
     * @dev Example: ipfs://QmHash/1.json, ipfs://QmHash/2.json, etc.
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(ownerOf(tokenId) != address(0), "Token does not exist");
        
        // Use OpenZeppelin's Strings library for uint256 to string conversion
        // Returns: baseTokenURI + tokenId + ".json"
        string memory baseURI = _baseURI();
        return string(abi.encodePacked(baseURI, Strings.toString(tokenId), ".json"));
    }

    /**
     * @notice Get the next token ID that will be minted
     * @return Next token ID
     */
    function getNextTokenId() public view returns (uint256) {
        return _nextTokenId;
    }
}
