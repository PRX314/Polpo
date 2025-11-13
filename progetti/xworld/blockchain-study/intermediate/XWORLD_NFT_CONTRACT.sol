// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title XWorldCollection
 * @dev NFT Collection per X World Project con 3 tier:
 * - Seed (0.05 ETH): Valigetta fisica + NFT gemello + 10 BIC
 * - Builder (0.2 ETH): Voto materiale + Numerata + Badge + 50 BIC
 * - Visionary (1 ETH): Incisione custom + 1/1 + Crediti + 200 BIC
 *
 * Features:
 * - Max supply per tier
 * - Reveal mechanism
 * - Royalties EIP-2981
 * - BIC rewards distribution
 * - Metadata IPFS
 */
contract XWorldCollection is ERC721, ERC721URIStorage, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;

    // ============ State Variables ============

    Counters.Counter private _tokenIdCounter;

    // Tier structure
    enum Tier { Seed, Builder, Visionary }

    struct NFTMetadata {
        Tier tier;
        uint256 mintedAt;
        uint256 bicReward;
        string customData; // Per Visionary tier
    }

    // Supply limits per tier
    uint256 public constant MAX_SEED = 100;
    uint256 public constant MAX_BUILDER = 50;
    uint256 public constant MAX_VISIONARY = 10;
    uint256 public constant MAX_TOTAL_SUPPLY = 160;

    // Prezzi per tier (in wei)
    uint256 public constant SEED_PRICE = 0.05 ether;
    uint256 public constant BUILDER_PRICE = 0.2 ether;
    uint256 public constant VISIONARY_PRICE = 1 ether;

    // BIC rewards per tier
    uint256 public constant SEED_BIC_REWARD = 10;
    uint256 public constant BUILDER_BIC_REWARD = 50;
    uint256 public constant VISIONARY_BIC_REWARD = 200;

    // Contatori per tier
    uint256 public seedMinted;
    uint256 public builderMinted;
    uint256 public visionaryMinted;

    // Max mint per wallet
    uint256 public constant MAX_PER_WALLET = 5;

    // Mapping
    mapping(uint256 => NFTMetadata) public tokenMetadata;
    mapping(address => uint256) public mintedByAddress;
    mapping(address => uint256) public bicRewards; // BIC da distribuire

    // Base URIs per revealed/unrevealed
    string private _baseTokenURI;
    string private _unrevealedURI;
    bool public revealed = false;

    // Treasury wallet
    address public treasuryWallet;

    // Royalties (EIP-2981)
    uint96 public royaltyBPS = 500; // 5%
    address public royaltyReceiver;

    // Sale state
    bool public saleActive = false;

    // ============ Events ============

    event NFTMinted(
        address indexed minter,
        uint256 indexed tokenId,
        Tier tier,
        uint256 bicReward
    );

    event BICRewarded(
        address indexed recipient,
        uint256 amount
    );

    event SaleStateChanged(bool active);
    event Revealed(string baseURI);

    // ============ Constructor ============

    constructor(
        address _treasuryWallet,
        address _royaltyReceiver,
        string memory _initialUnrevealedURI
    ) ERC721("X World Collection", "XWORLD") Ownable(msg.sender) {
        require(_treasuryWallet != address(0), "Invalid treasury");
        require(_royaltyReceiver != address(0), "Invalid royalty receiver");

        treasuryWallet = _treasuryWallet;
        royaltyReceiver = _royaltyReceiver;
        _unrevealedURI = _initialUnrevealedURI;
    }

    // ============ Minting Functions ============

    /**
     * @dev Mint Seed tier NFT (0.05 ETH)
     */
    function mintSeed() external payable nonReentrant {
        require(saleActive, "Sale not active");
        require(msg.value == SEED_PRICE, "Incorrect ETH amount");
        require(seedMinted < MAX_SEED, "Seed tier sold out");
        require(mintedByAddress[msg.sender] < MAX_PER_WALLET, "Max per wallet reached");

        _mintTier(msg.sender, Tier.Seed, SEED_BIC_REWARD, "");
        seedMinted++;
    }

    /**
     * @dev Mint Builder tier NFT (0.2 ETH)
     */
    function mintBuilder() external payable nonReentrant {
        require(saleActive, "Sale not active");
        require(msg.value == BUILDER_PRICE, "Incorrect ETH amount");
        require(builderMinted < MAX_BUILDER, "Builder tier sold out");
        require(mintedByAddress[msg.sender] < MAX_PER_WALLET, "Max per wallet reached");

        _mintTier(msg.sender, Tier.Builder, BUILDER_BIC_REWARD, "");
        builderMinted++;
    }

    /**
     * @dev Mint Visionary tier NFT (1 ETH) con custom data
     */
    function mintVisionary(string memory customData) external payable nonReentrant {
        require(saleActive, "Sale not active");
        require(msg.value == VISIONARY_PRICE, "Incorrect ETH amount");
        require(visionaryMinted < MAX_VISIONARY, "Visionary tier sold out");
        require(mintedByAddress[msg.sender] < MAX_PER_WALLET, "Max per wallet reached");
        require(bytes(customData).length > 0, "Custom data required");

        _mintTier(msg.sender, Tier.Visionary, VISIONARY_BIC_REWARD, customData);
        visionaryMinted++;
    }

    /**
     * @dev Internal mint function
     */
    function _mintTier(
        address to,
        Tier tier,
        uint256 bicReward,
        string memory customData
    ) private {
        uint256 tokenId = _tokenIdCounter.current();
        require(tokenId < MAX_TOTAL_SUPPLY, "Max supply reached");

        _tokenIdCounter.increment();
        _safeMint(to, tokenId);

        tokenMetadata[tokenId] = NFTMetadata({
            tier: tier,
            mintedAt: block.timestamp,
            bicReward: bicReward,
            customData: customData
        });

        mintedByAddress[to]++;
        bicRewards[to] += bicReward;

        emit NFTMinted(to, tokenId, tier, bicReward);
        emit BICRewarded(to, bicReward);
    }

    // ============ Owner Functions ============

    /**
     * @dev Toggle sale state
     */
    function toggleSale() external onlyOwner {
        saleActive = !saleActive;
        emit SaleStateChanged(saleActive);
    }

    /**
     * @dev Reveal NFTs
     */
    function reveal(string memory baseURI) external onlyOwner {
        require(!revealed, "Already revealed");
        _baseTokenURI = baseURI;
        revealed = true;
        emit Revealed(baseURI);
    }

    /**
     * @dev Update unrevealed URI
     */
    function setUnrevealedURI(string memory newURI) external onlyOwner {
        _unrevealedURI = newURI;
    }

    /**
     * @dev Update royalty settings
     */
    function setRoyaltyInfo(address receiver, uint96 bps) external onlyOwner {
        require(bps <= 1000, "Royalty too high"); // Max 10%
        royaltyReceiver = receiver;
        royaltyBPS = bps;
    }

    /**
     * @dev Withdraw funds to treasury
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");

        (bool success, ) = treasuryWallet.call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    /**
     * @dev Emergency withdraw to owner
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds");

        (bool success, ) = owner().call{value: balance}("");
        require(success, "Emergency withdrawal failed");
    }

    // ============ View Functions ============

    /**
     * @dev Get BIC rewards for address
     */
    function getBICRewards(address user) external view returns (uint256) {
        return bicRewards[user];
    }

    /**
     * @dev Get NFT metadata
     */
    function getTokenMetadata(uint256 tokenId) external view returns (NFTMetadata memory) {
        require(_ownerOf(tokenId) != address(0), "Token doesn't exist");
        return tokenMetadata[tokenId];
    }

    /**
     * @dev Get tokens owned by address
     */
    function tokensOfOwner(address owner) external view returns (uint256[] memory) {
        uint256 tokenCount = balanceOf(owner);
        uint256[] memory result = new uint256[](tokenCount);
        uint256 counter = 0;

        for (uint256 i = 0; i < _tokenIdCounter.current(); i++) {
            if (_ownerOf(i) == owner) {
                result[counter] = i;
                counter++;
            }
        }

        return result;
    }

    /**
     * @dev Get total minted
     */
    function totalMinted() external view returns (uint256) {
        return _tokenIdCounter.current();
    }

    /**
     * @dev Get available supply per tier
     */
    function getAvailableSupply() external view returns (
        uint256 seedAvailable,
        uint256 builderAvailable,
        uint256 visionaryAvailable
    ) {
        seedAvailable = MAX_SEED - seedMinted;
        builderAvailable = MAX_BUILDER - builderMinted;
        visionaryAvailable = MAX_VISIONARY - visionaryMinted;
    }

    // ============ URI Functions ============

    /**
     * @dev Token URI (revealed o unrevealed)
     */
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        require(_ownerOf(tokenId) != address(0), "Token doesn't exist");

        if (!revealed) {
            return _unrevealedURI;
        }

        return super.tokenURI(tokenId);
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    // ============ EIP-2981 Royalties ============

    /**
     * @dev EIP-2981 royalty info
     */
    function royaltyInfo(uint256 /*tokenId*/, uint256 salePrice)
        external
        view
        returns (address receiver, uint256 royaltyAmount)
    {
        receiver = royaltyReceiver;
        royaltyAmount = (salePrice * royaltyBPS) / 10000;
    }

    // ============ Required Overrides ============

    function _burn(uint256 tokenId)
        internal
        override(ERC721, ERC721URIStorage)
    {
        super._burn(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return interfaceId == 0x2a55205a || super.supportsInterface(interfaceId);
        // 0x2a55205a è EIP-2981
    }
}
