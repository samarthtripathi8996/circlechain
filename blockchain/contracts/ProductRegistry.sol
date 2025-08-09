// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./AccessControl.sol";
import "./RewardToken.sol";

/**
 * @title ProductRegistry
 * @dev Main contract for tracking products through their complete lifecycle
 * in a circular supply chain system
 */
contract ProductRegistry is AccessControl {
    
    // Product status enum
    enum ProductStatus { 
        MANUFACTURED,    // Product created by manufacturer
        SOLD,           // Product sold to consumer
        USED,           // Product being used by consumer
        RECYCLED,       // Product recycled
        REPROCESSED     // Raw materials extracted and ready for reuse
    }
    
    // Raw material structure
    struct RawMaterial {
        string materialType;     // e.g., "Aluminum", "Plastic", "Steel"
        uint256 percentage;      // Percentage composition (0-100)
        bool isRecyclable;       // Whether this material is recyclable
        uint256 recycledCount;   // How many times this material has been recycled
    }
    
    // Product structure
    struct Product {
        string productId;                    // Unique product identifier
        address manufacturer;                // Original manufacturer
        address currentOwner;                // Current owner address
        address recycler;                    // Address of recycler (if recycled)
        uint256 manufacturedAt;              // Manufacturing timestamp
        uint256 soldAt;                      // Sale timestamp
        uint256 recycledAt;                  // Recycling timestamp
        uint256 reprocessedAt;               // Reprocessing timestamp
        ProductStatus status;                // Current status
        RawMaterial[] rawMaterials;          // Array of raw materials
        uint256 sustainabilityScore;         // Score out of 100
        string qrCodeHash;                   // QR code or RFID identifier
        string ipfsMetadataHash;             // IPFS hash for additional metadata
        bool isActive;                       // Whether product is active in system
        uint256 carbonFootprint;             // Carbon footprint in kg CO2
        string[] certifications;             // Sustainability certifications
    }
    
    // Product ownership history
    struct OwnershipRecord {
        address owner;
        uint256 timestamp;
        string transactionType; // "MANUFACTURED", "SOLD", "TRANSFERRED"
    }
    
    // Recycling reward structure
    struct RecyclingReward {
        uint256 tokenAmount;         // Reward amount in tokens
        uint256 carbonCredits;       // Carbon credits earned
        string recyclingMethod;      // Method used for recycling
        uint256 materialRecoveryRate; // Percentage of material recovered
    }
    
    // State variables
    RewardToken public rewardToken;
    
    // Counters for system statistics
    uint256 public totalProductsCount;
    uint256 public totalRecycledCount;
    uint256 public totalReprocessedCount;
    
    // Mappings
    mapping(string => Product) public products;
    mapping(string => OwnershipRecord[]) public ownershipHistory;
    mapping(string => RecyclingReward) public recyclingRewards;
    mapping(address => string[]) public manufacturerProducts;
    mapping(address => string[]) public ownerProducts;
    mapping(address => string[]) public recyclerProducts;
    mapping(string => bool) public productExists;
    
    // Statistics
    mapping(address => uint256) public manufacturerStats; // Total products manufactured
    mapping(address => uint256) public recyclerStats;     // Total products recycled
    mapping(string => uint256) public materialRecycleCount; // Material type recycle count
    
    // Events
    event ProductRegistered(
        string indexed productId, 
        address indexed manufacturer, 
        uint256 timestamp
    );
    
    event ProductSold(
        string indexed productId, 
        address indexed from, 
        address indexed to, 
        uint256 timestamp
    );
    
    event ProductRecycled(
        string indexed productId, 
        address indexed recycler, 
        uint256 rewardAmount,
        uint256 timestamp
    );
    
    event ProductReprocessed(
        string indexed productId,
        address indexed manufacturer,
        uint256 timestamp
    );
    
    event OwnershipTransferred(
        string indexed productId,
        address indexed from,
        address indexed to,
        uint256 timestamp
    );
    
    event SustainabilityScoreUpdated(
        string indexed productId,
        uint256 oldScore,
        uint256 newScore
    );
    
    // Modifiers
    modifier productExistsCheck(string memory _productId) {
        require(productExists[_productId], "Product does not exist");
        _;
    }
    
    modifier onlyProductOwner(string memory _productId) {
        require(
            products[_productId].currentOwner == msg.sender, 
            "Not the product owner"
        );
        _;
    }
    
    modifier onlyManufacturer(string memory _productId) {
        require(
            products[_productId].manufacturer == msg.sender, 
            "Not the manufacturer"
        );
        _;
    }
    
    modifier onlyActiveProduct(string memory _productId) {
        require(products[_productId].isActive, "Product is not active");
        _;
    }
    
    // Constructor
    constructor(address _rewardTokenAddress) {
        require(_rewardTokenAddress != address(0), "Invalid reward token address");
        rewardToken = RewardToken(_rewardTokenAddress);
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }
    
    /**
     * @dev Register a new product by manufacturer
     */
    function registerProduct(
        string memory _productId,
        RawMaterial[] memory _rawMaterials,
        string memory _qrCodeHash,
        string memory _ipfsMetadataHash,
        uint256 _carbonFootprint,
        string[] memory _certifications
    ) external onlyRole(MANUFACTURER_ROLE) {
        require(bytes(_productId).length > 0, "Product ID cannot be empty");
        require(!productExists[_productId], "Product already exists");
        require(_rawMaterials.length > 0, "At least one raw material required");
        require(_rawMaterials.length <= 10, "Too many raw materials"); // Gas limit protection
        
        // Validate raw material percentages sum to 100
        uint256 totalPercentage = 0;
        for (uint256 i = 0; i < _rawMaterials.length; i++) {
            require(bytes(_rawMaterials[i].materialType).length > 0, "Material type cannot be empty");
            require(_rawMaterials[i].percentage > 0, "Material percentage must be greater than 0");
            require(_rawMaterials[i].percentage <= 100, "Material percentage cannot exceed 100");
            totalPercentage += _rawMaterials[i].percentage;
        }
        require(totalPercentage == 100, "Raw material percentages must sum to 100");
        
        // Create product
        Product storage newProduct = products[_productId];
        newProduct.productId = _productId;
        newProduct.manufacturer = msg.sender;
        newProduct.currentOwner = msg.sender;
        newProduct.manufacturedAt = block.timestamp;
        newProduct.status = ProductStatus.MANUFACTURED;
        newProduct.qrCodeHash = _qrCodeHash;
        newProduct.ipfsMetadataHash = _ipfsMetadataHash;
        newProduct.isActive = true;
        newProduct.carbonFootprint = _carbonFootprint;
        
        // Add raw materials
        for (uint256 i = 0; i < _rawMaterials.length; i++) {
            newProduct.rawMaterials.push(_rawMaterials[i]);
        }
        
        // Add certifications (with limit to prevent gas issues)
        require(_certifications.length <= 20, "Too many certifications");
        for (uint256 i = 0; i < _certifications.length; i++) {
            newProduct.certifications.push(_certifications[i]);
        }
        
        // Calculate initial sustainability score
        newProduct.sustainabilityScore = _calculateSustainabilityScore(_rawMaterials, _certifications.length);
        
        // Update mappings
        productExists[_productId] = true;
        manufacturerProducts[msg.sender].push(_productId);
        ownerProducts[msg.sender].push(_productId);
        manufacturerStats[msg.sender]++;
        totalProductsCount++;
        
        // Add to ownership history
        ownershipHistory[_productId].push(OwnershipRecord({
            owner: msg.sender,
            timestamp: block.timestamp,
            transactionType: "MANUFACTURED"
        }));
        
        emit ProductRegistered(_productId, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Transfer product ownership (sale to consumer)
     */
    function transferOwnership(
        string memory _productId,
        address _newOwner
    ) external productExistsCheck(_productId) onlyProductOwner(_productId) onlyActiveProduct(_productId) {
        require(_newOwner != address(0), "Invalid new owner address");
        require(_newOwner != msg.sender, "Cannot transfer to self");
        
        Product storage product = products[_productId];
        require(product.status != ProductStatus.RECYCLED && product.status != ProductStatus.REPROCESSED, 
                "Cannot transfer recycled or reprocessed product");
        
        address previousOwner = product.currentOwner;
        
        // Update product ownership
        product.currentOwner = _newOwner;
        
        // Update status if it's first sale
        if (product.status == ProductStatus.MANUFACTURED) {
            product.status = ProductStatus.SOLD;
            product.soldAt = block.timestamp;
        }
        
        // Update owner mappings
        ownerProducts[_newOwner].push(_productId);
        _removeFromOwnerProducts(previousOwner, _productId);
        
        // Add to ownership history
        ownershipHistory[_productId].push(OwnershipRecord({
            owner: _newOwner,
            timestamp: block.timestamp,
            transactionType: product.status == ProductStatus.SOLD ? "SOLD" : "TRANSFERRED"
        }));
        
        emit ProductSold(_productId, previousOwner, _newOwner, block.timestamp);
        emit OwnershipTransferred(_productId, previousOwner, _newOwner, block.timestamp);
    }
    
    /**
     * @dev Mark product as being used
     */
    function markAsUsed(string memory _productId) 
        external 
        productExistsCheck(_productId) 
        onlyProductOwner(_productId) 
        onlyActiveProduct(_productId)
    {
        Product storage product = products[_productId];
        require(product.status == ProductStatus.SOLD, "Product must be sold first");
        
        product.status = ProductStatus.USED;
    }
    
    /**
     * @dev Recycle product and distribute rewards
     */
    function recycleProduct(
        string memory _productId,
        string memory _recyclingMethod,
        uint256 _materialRecoveryRate
    ) external onlyRole(RECYCLER_ROLE) productExistsCheck(_productId) onlyActiveProduct(_productId) {
        require(bytes(_recyclingMethod).length > 0, "Recycling method cannot be empty");
        require(_materialRecoveryRate > 0 && _materialRecoveryRate <= 100, "Invalid material recovery rate");
        
        Product storage product = products[_productId];
        require(
            product.status == ProductStatus.USED || product.status == ProductStatus.SOLD, 
            "Product must be used or sold to be recycled"
        );
        
        // Calculate recycling rewards
        uint256 rewardAmount = _calculateRecyclingReward(
            product.sustainabilityScore,
            _materialRecoveryRate,
            product.rawMaterials.length
        );
        
        uint256 carbonCredits = _calculateCarbonCredits(
            product.carbonFootprint,
            _materialRecoveryRate
        );
        
        address rewardRecipient = product.currentOwner;
        
        // Update product status
        product.status = ProductStatus.RECYCLED;
        product.recycledAt = block.timestamp;
        product.recycler = msg.sender;
        
        // Store recycling reward details
        recyclingRewards[_productId] = RecyclingReward({
            tokenAmount: rewardAmount,
            carbonCredits: carbonCredits,
            recyclingMethod: _recyclingMethod,
            materialRecoveryRate: _materialRecoveryRate
        });
        
        // Update recycler mappings
        recyclerProducts[msg.sender].push(_productId);
        recyclerStats[msg.sender]++;
        totalRecycledCount++;
        
        // Update material recycle counts
        for (uint256 i = 0; i < product.rawMaterials.length; i++) {
            materialRecycleCount[product.rawMaterials[i].materialType]++;
        }
        
        // Mint reward tokens to the previous owner (consumer who recycled)
        if (rewardAmount > 0) {
            rewardToken.mint(rewardRecipient, rewardAmount);
        }
        
        emit ProductRecycled(_productId, msg.sender, rewardAmount, block.timestamp);
    }
    
    /**
     * @dev Mark raw materials as reprocessed and ready for reuse
     */
    function markAsReprocessed(
        string memory _productId
    ) external onlyRole(MANUFACTURER_ROLE) productExistsCheck(_productId) onlyActiveProduct(_productId) {
        Product storage product = products[_productId];
        require(product.status == ProductStatus.RECYCLED, "Product must be recycled first");
        
        product.status = ProductStatus.REPROCESSED;
        product.reprocessedAt = block.timestamp;
        totalReprocessedCount++;
        
        // Increment recycled count for each material
        for (uint256 i = 0; i < product.rawMaterials.length; i++) {
            product.rawMaterials[i].recycledCount++;
        }
        
        emit ProductReprocessed(_productId, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Update sustainability score (only by authorized auditors)
     */
    function updateSustainabilityScore(
        string memory _productId,
        uint256 _newScore
    ) external onlyRole(AUDITOR_ROLE) productExistsCheck(_productId) onlyActiveProduct(_productId) {
        require(_newScore <= 100, "Score cannot exceed 100");
        
        Product storage product = products[_productId];
        uint256 oldScore = product.sustainabilityScore;
        product.sustainabilityScore = _newScore;
        
        emit SustainabilityScoreUpdated(_productId, oldScore, _newScore);
    }
    
    /**
     * @dev Get complete product information
     */
    function getProduct(string memory _productId) 
        external 
        view 
        productExistsCheck(_productId) 
        returns (Product memory) 
    {
        return products[_productId];
    }
    
    /**
     * @dev Get product ownership history
     */
    function getOwnershipHistory(string memory _productId) 
        external 
        view 
        productExistsCheck(_productId)
        returns (OwnershipRecord[] memory) 
    {
        return ownershipHistory[_productId];
    }
    
    /**
     * @dev Get recycling reward information
     */
    function getRecyclingReward(string memory _productId) 
        external 
        view 
        productExistsCheck(_productId)
        returns (RecyclingReward memory) 
    {
        return recyclingRewards[_productId];
    }
    
    /**
     * @dev Get products by manufacturer
     */
    function getManufacturerProducts(address _manufacturer) 
        external 
        view 
        returns (string[] memory) 
    {
        return manufacturerProducts[_manufacturer];
    }
    
    /**
     * @dev Get products by owner
     */
    function getOwnerProducts(address _owner) 
        external 
        view 
        returns (string[] memory) 
    {
        return ownerProducts[_owner];
    }
    
    /**
     * @dev Get products by recycler
     */
    function getRecyclerProducts(address _recycler) 
        external 
        view 
        returns (string[] memory) 
    {
        return recyclerProducts[_recycler];
    }
    
    /**
     * @dev Get system statistics
     */
    function getSystemStats() external view returns (
        uint256 totalProducts,
        uint256 totalRecycled,
        uint256 totalReprocessed
    ) {
        return (totalProductsCount, totalRecycledCount, totalReprocessedCount);
    }
    
    // Internal functions
    
    /**
     * @dev Calculate sustainability score based on materials and certifications
     */
    function _calculateSustainabilityScore(
        RawMaterial[] memory _materials,
        uint256 _certificationCount
    ) internal pure returns (uint256) {
        uint256 score = 0;
        uint256 recyclablePercentage = 0;
        
        // Calculate recyclable material percentage
        for (uint256 i = 0; i < _materials.length; i++) {
            if (_materials[i].isRecyclable) {
                recyclablePercentage += _materials[i].percentage;
            }
        }
        
        // Base score from recyclable materials (0-70 points)
        score = (recyclablePercentage * 70) / 100;
        
        // Bonus points for certifications (up to 30 points)
        uint256 certificationBonus = _certificationCount * 10;
        if (certificationBonus > 30) {
            certificationBonus = 30;
        }
        
        score += certificationBonus;
        
        if (score > 100) {
            score = 100;
        }
        
        return score;
    }
    
    /**
     * @dev Calculate recycling reward amount
     */
    function _calculateRecyclingReward(
        uint256 _sustainabilityScore,
        uint256 _materialRecoveryRate,
        uint256 _materialCount
    ) internal pure returns (uint256) {
        // Prevent division by zero and ensure reasonable values
        if (_sustainabilityScore == 0 || _materialRecoveryRate == 0) {
            return 0;
        }
        
        // Base reward calculation
        uint256 baseReward = 100 * 10**18; // 100 tokens base
        
        // Multiply by sustainability score factor (more careful calculation)
        uint256 sustainabilityMultiplier = _sustainabilityScore + 50; // 50 to 150
        
        // Multiply by material recovery rate (as percentage)
        uint256 recoveryMultiplier = _materialRecoveryRate; // 1-100
        
        // Bonus for material diversity (capped to prevent overflow)
        uint256 diversityBonus = _materialCount > 10 ? 100 : _materialCount * 10; // Max 100% bonus
        
        // More careful calculation to prevent overflow
        uint256 reward = baseReward;
        reward = (reward * sustainabilityMultiplier) / 100;
        reward = (reward * recoveryMultiplier) / 100;
        reward = (reward * (100 + diversityBonus)) / 100;
        
        return reward;
    }
    
    /**
     * @dev Calculate carbon credits earned from recycling
     */
    function _calculateCarbonCredits(
        uint256 _carbonFootprint,
        uint256 _materialRecoveryRate
    ) internal pure returns (uint256) {
        if (_carbonFootprint == 0 || _materialRecoveryRate == 0) {
            return 0;
        }
        
        // Carbon credits = (carbon footprint saved) * (recovery rate) / 1000
        // Prevent overflow by checking values
        uint256 maxCarbonFootprint = type(uint256).max / _materialRecoveryRate;
        if (_carbonFootprint > maxCarbonFootprint) {
            return maxCarbonFootprint / 100000; // Conservative fallback
        }
        
        return (_carbonFootprint * _materialRecoveryRate) / 100000; // Changed divisor to prevent very small results
    }
    
    /**
     * @dev Remove product from owner's product list
     */
    function _removeFromOwnerProducts(address _owner, string memory _productId) internal {
        string[] storage ownerProductList = ownerProducts[_owner];
        uint256 length = ownerProductList.length;
        
        for (uint256 i = 0; i < length; i++) {
            if (keccak256(bytes(ownerProductList[i])) == keccak256(bytes(_productId))) {
                // Replace with last element and pop
                ownerProductList[i] = ownerProductList[length - 1];
                ownerProductList.pop();
                break;
            }
        }
    }
    
    /**
     * @dev Emergency function to deactivate a product
     */
    function deactivateProduct(string memory _productId) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
        productExistsCheck(_productId) 
    {
        products[_productId].isActive = false;
    }
    
    /**
     * @dev Emergency function to reactivate a product
     */
    function reactivateProduct(string memory _productId) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
        productExistsCheck(_productId) 
    {
        products[_productId].isActive = true;
    }
    
    /**
     * @dev Update reward token contract address
     */
    function updateRewardToken(address _newRewardToken) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(_newRewardToken != address(0), "Invalid reward token address");
        rewardToken = RewardToken(_newRewardToken);
    }
    
    /**
     * @dev Emergency pause function
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        // Implementation would depend on whether you're using OpenZeppelin's Pausable
        // This is a placeholder for the pause functionality
    }
    
    /**
     * @dev Emergency unpause function
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        // Implementation would depend on whether you're using OpenZeppelin's Pausable
        // This is a placeholder for the unpause functionality
    }
}