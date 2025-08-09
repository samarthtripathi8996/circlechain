// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./AccessControl.sol";
import "./RewardToken.sol";
import "./ProductRegistry.sol";

/**
 * @title RecyclingRewards
 * @dev Contract to manage recycling incentives and reward distribution
 */
contract RecyclingRewards is AccessControl {
    
    RewardToken public rewardToken;
    ProductRegistry public productRegistry;
    
    // Reward campaign structure
    struct RewardCampaign {
        string name;
        string description;
        uint256 startTime;
        uint256 endTime;
        uint256 totalRewardPool;
        uint256 remainingRewardPool;
        uint256 minSustainabilityScore;
        string[] eligibleMaterials;
        uint256 baseRewardAmount;
        uint256 bonusMultiplier; // In basis points (10000 = 100%)
        bool isActive;
        address sponsor;
    }
    
    // Recycling metrics
    struct RecyclingMetrics {
        uint256 totalProductsRecycled;
        uint256 totalRewardsDistributed;
        uint256 totalCarbonCreditsEarned;
        uint256 totalMaterialRecovered; // In grams
        mapping(string => uint256) materialTypeRecycled; // material type => amount
    }
    
    // User recycling stats
    struct UserRecyclingStats {
        uint256 totalProductsRecycled;
        uint256 totalRewardsEarned;
        uint256 totalCarbonCredits;
        uint256 currentStreak; // Days of consecutive recycling
        uint256 longestStreak;
        uint256 lastRecyclingDate;
        uint256 sustainabilityScore; // Average score of recycled products
        mapping(string => uint256) materialBreakdown;
    }
    
    // Leaderboard entry
    struct LeaderboardEntry {
        address user;
        uint256 score;
        uint256 rank;
    }
    
    // Achievement structure
    struct Achievement {
        string name;
        string description;
        uint256 requirement; // Number or threshold
        string requirementType; // "products", "streak", "materials", "score"
        uint256 rewardAmount;
        bool isActive;
    }
    
    // State variables
    mapping(uint256 => RewardCampaign) public campaigns;
    mapping(address => UserRecyclingStats) public userStats;
    mapping(uint256 => Achievement) public achievements;
    mapping(address => mapping(uint256 => bool)) public userAchievements; // user => achievement => claimed
    
    RecyclingMetrics public globalMetrics;
    uint256 public campaignCounter;
    uint256 public achievementCounter;
    
    // Leaderboard
    address[] public leaderboard;
    mapping(address => uint256) public leaderboardPosition;
    
    // Carbon credit tracking
    mapping(address => uint256) public carbonCredits;
    uint256 public totalCarbonCredits;
    
    // Recycling streaks and bonuses
    uint256 public constant STREAK_BONUS_THRESHOLD = 7; // 7 days
    uint256 public constant STREAK_BONUS_MULTIPLIER = 1500; // 150% (50% bonus)
    
    // Events
    event RewardCampaignCreated(uint256 indexed campaignId, string name, address sponsor);
    event RewardDistributed(address indexed user, uint256 amount, string reason);
    event CarbonCreditsEarned(address indexed user, uint256 credits);
    event AchievementUnlocked(address indexed user, uint256 indexed achievementId);
    event StreakBonus(address indexed user, uint256 streak, uint256 bonusAmount);
    event LeaderboardUpdated(address indexed user, uint256 newRank);
    
    // Constructor
    constructor(
        address _rewardTokenAddress,
        address _productRegistryAddress
    ) {
        rewardToken = RewardToken(_rewardTokenAddress);
        productRegistry = ProductRegistry(_productRegistryAddress);
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(RECYCLER_ROLE, msg.sender); // Grant admin the recycler role initially
        
        // Initialize default achievements
        _createDefaultAchievements();
    }
    
    /**
     * @dev Create a new reward campaign
     */
    function createRewardCampaign(
        string memory _name,
        string memory _description,
        uint256 _duration, // in seconds
        uint256 _totalRewardPool,
        uint256 _minSustainabilityScore,
        string[] memory _eligibleMaterials,
        uint256 _baseRewardAmount,
        uint256 _bonusMultiplier
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(bytes(_name).length > 0, "Campaign name cannot be empty");
        require(_duration > 0, "Campaign duration must be positive");
        require(_totalRewardPool > 0, "Reward pool must be positive");
        require(_baseRewardAmount > 0, "Base reward must be positive");
        
        campaignCounter++;
        
        RewardCampaign storage campaign = campaigns[campaignCounter];
        campaign.name = _name;
        campaign.description = _description;
        campaign.startTime = block.timestamp;
        campaign.endTime = block.timestamp + _duration;
        campaign.totalRewardPool = _totalRewardPool;
        campaign.remainingRewardPool = _totalRewardPool;
        campaign.minSustainabilityScore = _minSustainabilityScore;
        campaign.baseRewardAmount = _baseRewardAmount;
        campaign.bonusMultiplier = _bonusMultiplier;
        campaign.isActive = true;
        campaign.sponsor = msg.sender;
        
        // Add eligible materials
        for (uint i = 0; i < _eligibleMaterials.length; i++) {
            campaign.eligibleMaterials.push(_eligibleMaterials[i]);
        }
        
        emit RewardCampaignCreated(campaignCounter, _name, msg.sender);
    }
    
    /**
     * @dev Process recycling reward
     */
    function processRecyclingReward(
        address _user,
       
        uint256 _sustainabilityScore,
        uint256 _materialRecoveryRate,
        string[] memory _materials
    ) external onlyRole(RECYCLER_ROLE) {
        require(_user != address(0), "Invalid user address");
        require(_sustainabilityScore <= 100, "Invalid sustainability score");
        require(_materialRecoveryRate <= 100, "Invalid recovery rate");
        
        // Calculate base reward
        uint256 baseReward = rewardToken.calculateRecyclingReward(
            _user,
            _sustainabilityScore,
            _materialRecoveryRate
        );
        
        // Apply active campaign bonuses
        uint256 campaignBonus = _calculateCampaignBonus(
            
            _sustainabilityScore,
            _materials
        );
        
        // Apply streak bonus
        uint256 streakBonus = _calculateStreakBonus(_user);
        
        // Calculate total reward
        uint256 totalReward = baseReward + campaignBonus + streakBonus;
        
        // Calculate carbon credits
        uint256 carbonCreditsEarned = _calculateCarbonCredits(
            _sustainabilityScore,
            _materialRecoveryRate
        );
        
        // Update user stats
        _updateUserStats(_user, _sustainabilityScore, _materials, totalReward, carbonCreditsEarned);
        
        // Update global metrics
        _updateGlobalMetrics(_materials, totalReward, carbonCreditsEarned);
        
        // Update campaign reward pools based on bonuses distributed
        _updateCampaignPools(_sustainabilityScore, _materials);
        
        // Distribute rewards
        if (totalReward > 0) {
            rewardToken.mint(_user, totalReward);
            emit RewardDistributed(_user, totalReward, "Recycling reward");
        }
        
        // Award carbon credits
        if (carbonCreditsEarned > 0) {
            carbonCredits[_user] += carbonCreditsEarned;
            totalCarbonCredits += carbonCreditsEarned;
            emit CarbonCreditsEarned(_user, carbonCreditsEarned);
        }
        
        // Check for achievements
        _checkAchievements(_user);
        
        // Update leaderboard
        _updateLeaderboard(_user);
        
        // Emit streak bonus if applicable
        if (streakBonus > 0) {
            emit StreakBonus(_user, userStats[_user].currentStreak, streakBonus);
        }
    }
    
    /**
     * @dev Claim achievement reward
     */
    function claimAchievement(uint256 _achievementId) external {
        require(achievements[_achievementId].isActive, "Achievement not active");
        require(!userAchievements[msg.sender][_achievementId], "Achievement already claimed");
        require(_checkAchievementEligibility(msg.sender, _achievementId), "Not eligible for achievement");
        
        Achievement memory achievement = achievements[_achievementId];
        userAchievements[msg.sender][_achievementId] = true;
        
        if (achievement.rewardAmount > 0) {
            rewardToken.mint(msg.sender, achievement.rewardAmount);
            emit RewardDistributed(msg.sender, achievement.rewardAmount, "Achievement reward");
        }
        
        emit AchievementUnlocked(msg.sender, _achievementId);
    }
    
    /**
     * @dev Get user recycling statistics
     */
    function getUserStats(address _user) external view returns (
        uint256 totalProductsRecycled,
        uint256 totalRewardsEarned,
        
        uint256 currentStreak,
        uint256 longestStreak,
        uint256 sustainabilityScore
    ) {
        UserRecyclingStats storage stats = userStats[_user];
        return (
            stats.totalProductsRecycled,
            stats.totalRewardsEarned,
           
            stats.currentStreak,
            stats.longestStreak,
            stats.sustainabilityScore
        );
    }
    
    /**
     * @dev Get campaign information
     */
    function getCampaign(uint256 _campaignId) external view returns (
        string memory name,
        string memory description,
        uint256 startTime,
        uint256 endTime,
        uint256 totalRewardPool,
        uint256 remainingRewardPool,
        bool isActive
    ) {
        RewardCampaign memory campaign = campaigns[_campaignId];
        return (
            campaign.name,
            campaign.description,
            campaign.startTime,
            campaign.endTime,
            campaign.totalRewardPool,
            campaign.remainingRewardPool,
            campaign.isActive
        );
    }
    
    /**
     * @dev Get global recycling metrics
     */
    function getGlobalMetrics() external view returns (
        uint256 totalProductsRecycled,
        uint256 totalRewardsDistributed,
        uint256 totalCarbonCreditsEarned,
        uint256 totalMaterialRecovered
    ) {
        return (
            globalMetrics.totalProductsRecycled,
            globalMetrics.totalRewardsDistributed,
            globalMetrics.totalCarbonCreditsEarned,
            globalMetrics.totalMaterialRecovered
        );
    }
    
    /**
     * @dev Get leaderboard
     */
    function getLeaderboard(uint256 _limit) external view returns (address[] memory) {
        uint256 limit = _limit > leaderboard.length ? leaderboard.length : _limit;
        address[] memory topUsers = new address[](limit);
        
        for (uint i = 0; i < limit; i++) {
            topUsers[i] = leaderboard[i];
        }
        
        return topUsers;
    }
    
    /**
     * @dev Get user's carbon credit balance
     */
    function getUserCarbonCredits(address _user) external view returns (uint256) {
        return carbonCredits[_user];
    }
    
    /**
     * @dev Create achievement
     */
    function createAchievement(
        string memory _name,
        string memory _description,
        uint256 _requirement,
        string memory _requirementType,
        uint256 _rewardAmount
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        achievementCounter++;
        
        achievements[achievementCounter] = Achievement({
            name: _name,
            description: _description,
            requirement: _requirement,
            requirementType: _requirementType,
            rewardAmount: _rewardAmount,
            isActive: true
        });
    }
    
    /**
     * @dev Deactivate campaign
     */
    function deactivateCampaign(uint256 _campaignId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        campaigns[_campaignId].isActive = false;
    }
    
    /**
     * @dev Grant recycler role to an address
     */
    function grantRecyclerRole(address _recycler) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _setupRole(RECYCLER_ROLE, _recycler);
    }
    
    /**
     * @dev Revoke recycler role from an address
     */
    function revokeRecyclerRole(address _recycler) external onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(RECYCLER_ROLE, _recycler);
    }
    
    // Internal functions
    
    /**
     * @dev Calculate campaign bonus and update campaign pools
     */
    function _calculateCampaignBonus(
        
        uint256 _sustainabilityScore,
        string[] memory _materials
    ) internal view returns (uint256) {
        uint256 totalBonus = 0;
        
        for (uint i = 1; i <= campaignCounter; i++) {
            RewardCampaign memory campaign = campaigns[i];
            
            if (!campaign.isActive || 
                block.timestamp < campaign.startTime || 
                block.timestamp > campaign.endTime ||
                campaign.remainingRewardPool == 0) {
                continue;
            }
            
            if (_sustainabilityScore >= campaign.minSustainabilityScore) {
                // Check if any materials are eligible
                bool hasEligibleMaterial = campaign.eligibleMaterials.length == 0; // If no specific materials, all are eligible
                
                for (uint j = 0; j < _materials.length && !hasEligibleMaterial; j++) {
                    for (uint k = 0; k < campaign.eligibleMaterials.length; k++) {
                        if (keccak256(bytes(_materials[j])) == keccak256(bytes(campaign.eligibleMaterials[k]))) {
                            hasEligibleMaterial = true;
                            break;
                        }
                    }
                }
                
                if (hasEligibleMaterial) {
                    uint256 campaignReward = (campaign.baseRewardAmount * campaign.bonusMultiplier) / 10000;
                    if (campaignReward <= campaign.remainingRewardPool) {
                        totalBonus += campaignReward;
                    }
                }
            }
        }
        
        return totalBonus;
    }
    
    /**
     * @dev Update campaign reward pools after distributing bonuses
     */
    function _updateCampaignPools(
       
        uint256 _sustainabilityScore,
        string[] memory _materials
    ) internal {
        for (uint i = 1; i <= campaignCounter; i++) {
            RewardCampaign storage campaign = campaigns[i];
            
            if (!campaign.isActive || 
                block.timestamp < campaign.startTime || 
                block.timestamp > campaign.endTime ||
                campaign.remainingRewardPool == 0) {
                continue;
            }
            
            if (_sustainabilityScore >= campaign.minSustainabilityScore) {
                // Check if any materials are eligible
                bool hasEligibleMaterial = campaign.eligibleMaterials.length == 0;
                
                for (uint j = 0; j < _materials.length && !hasEligibleMaterial; j++) {
                    for (uint k = 0; k < campaign.eligibleMaterials.length; k++) {
                        if (keccak256(bytes(_materials[j])) == keccak256(bytes(campaign.eligibleMaterials[k]))) {
                            hasEligibleMaterial = true;
                            break;
                        }
                    }
                }
                
                if (hasEligibleMaterial) {
                    uint256 campaignReward = (campaign.baseRewardAmount * campaign.bonusMultiplier) / 10000;
                    if (campaignReward <= campaign.remainingRewardPool) {
                        campaign.remainingRewardPool -= campaignReward;
                    }
                }
            }
        }
    }
    
    /**
     * @dev Calculate streak bonus
     */
    function _calculateStreakBonus(address _user) internal view returns (uint256) {
        UserRecyclingStats storage stats = userStats[_user];
        
        if (stats.currentStreak >= STREAK_BONUS_THRESHOLD) {
            // Use a default base reward if CONSUMER_BASE_REWARD() doesn't exist
            uint256 baseReward = 100 * 10**18; // 100 tokens as default
            
            // Try to get base reward from token contract, fallback to default if it fails
            try rewardToken.CONSUMER_BASE_REWARD() returns (uint256 tokenBaseReward) {
                baseReward = tokenBaseReward;
            } catch {
                // Use default value
            }
            
            uint256 streakMultiplier = STREAK_BONUS_MULTIPLIER + (stats.currentStreak * 50); // Additional 5% per day
            return (baseReward * (streakMultiplier - 10000)) / 10000; // Only bonus portion
        }
        
        return 0;
    }
    
    /**
     * @dev Calculate carbon credits earned
     */
    function _calculateCarbonCredits(
        uint256 _sustainabilityScore,
        uint256 _materialRecoveryRate
    ) internal pure returns (uint256) {
        // Base credits calculation
        uint256 baseCredits = 10; // 10 credits base
        
        // Apply sustainability score multiplier (fixed calculation)
        uint256 sustainabilityMultiplier = 50 + _sustainabilityScore; // 50 to 150
        
        // Apply recovery rate multiplier
        uint256 recoveryMultiplier = _materialRecoveryRate; // Percentage
        
        return (baseCredits * sustainabilityMultiplier * recoveryMultiplier) / 10000;
    }
    
    /**
     * @dev Update user statistics
     */
    function _updateUserStats(
        address _user,
        uint256 _sustainabilityScore,
        string[] memory _materials,
        uint256 _rewardAmount,
        uint256 _carbonCredits
    ) internal {
        UserRecyclingStats storage stats = userStats[_user];
        
        stats.totalProductsRecycled++;
        stats.totalRewardsEarned += _rewardAmount;
        stats.totalCarbonCredits += _carbonCredits;
        
        // Update sustainability score (running average)
        if (stats.totalProductsRecycled == 1) {
            stats.sustainabilityScore = _sustainabilityScore;
        } else {
            // Fixed calculation: proper weighted average
            uint256 totalScore = stats.sustainabilityScore * (stats.totalProductsRecycled - 1);
            stats.sustainabilityScore = (totalScore + _sustainabilityScore) / stats.totalProductsRecycled;
        }
        
        // Update streak
        if (stats.lastRecyclingDate == 0) {
            // First time recycling
            stats.currentStreak = 1;
        } else {
            uint256 daysSinceLastRecycling = (block.timestamp - stats.lastRecyclingDate) / 86400;
            
            if (daysSinceLastRecycling == 0) {
                // Same day, don't increment streak
                // Keep current streak
            } else if (daysSinceLastRecycling == 1) {
                // Next day, increment streak
                stats.currentStreak++;
            } else {
                // Gap in recycling, reset streak
                stats.currentStreak = 1;
            }
        }
        
        if (stats.currentStreak > stats.longestStreak) {
            stats.longestStreak = stats.currentStreak;
        }
        
        stats.lastRecyclingDate = block.timestamp;
        
        // Update material breakdown
        for (uint i = 0; i < _materials.length; i++) {
            stats.materialBreakdown[_materials[i]]++;
        }
    }
    
    /**
     * @dev Update global metrics
     */
    function _updateGlobalMetrics(
        string[] memory _materials,
        uint256 _rewardAmount,
        uint256 _carbonCredits
    ) internal {
        globalMetrics.totalProductsRecycled++;
        globalMetrics.totalRewardsDistributed += _rewardAmount;
        globalMetrics.totalCarbonCreditsEarned += _carbonCredits;
        
        for (uint i = 0; i < _materials.length; i++) {
            globalMetrics.materialTypeRecycled[_materials[i]]++;
        }
    }
    
    /**
     * @dev Check achievements for user
     */
    function _checkAchievements(address _user) internal {
        UserRecyclingStats storage stats = userStats[_user];
        
        for (uint i = 1; i <= achievementCounter; i++) {
            if (!achievements[i].isActive || userAchievements[_user][i]) {
                continue;
            }
            
            Achievement memory achievement = achievements[i];
            bool eligible = false;
            
            if (keccak256(bytes(achievement.requirementType)) == keccak256(bytes("products"))) {
                eligible = stats.totalProductsRecycled >= achievement.requirement;
            } else if (keccak256(bytes(achievement.requirementType)) == keccak256(bytes("streak"))) {
                eligible = stats.longestStreak >= achievement.requirement;
            } else if (keccak256(bytes(achievement.requirementType)) == keccak256(bytes("score"))) {
                eligible = stats.sustainabilityScore >= achievement.requirement;
            }
            
            if (eligible) {
                userAchievements[_user][i] = true;
                if (achievement.rewardAmount > 0) {
                    rewardToken.mint(_user, achievement.rewardAmount);
                    emit RewardDistributed(_user, achievement.rewardAmount, "Achievement reward");
                }
                emit AchievementUnlocked(_user, i);
            }
        }
    }
    
    /**
     * @dev Check if user is eligible for achievement
     */
    function _checkAchievementEligibility(address _user, uint256 _achievementId) internal view returns (bool) {
        Achievement memory achievement = achievements[_achievementId];
        UserRecyclingStats storage stats = userStats[_user];
        
        if (keccak256(bytes(achievement.requirementType)) == keccak256(bytes("products"))) {
            return stats.totalProductsRecycled >= achievement.requirement;
        } else if (keccak256(bytes(achievement.requirementType)) == keccak256(bytes("streak"))) {
            return stats.longestStreak >= achievement.requirement;
        } else if (keccak256(bytes(achievement.requirementType)) == keccak256(bytes("score"))) {
            return stats.sustainabilityScore >= achievement.requirement;
        }
        
        return false;
    }
    
    /**
     * @dev Update leaderboard (optimized version)
     */
    function _updateLeaderboard(address _user) internal {
        uint256 userScore = _calculateLeaderboardScore(_user);
        
        // Check if user is already in leaderboard
        bool userInLeaderboard = false;
        uint256 userIndex = 0;
        
        for (uint i = 0; i < leaderboard.length; i++) {
            if (leaderboard[i] == _user) {
                userInLeaderboard = true;
                userIndex = i;
                break;
            }
        }
        
        if (!userInLeaderboard) {
            leaderboard.push(_user);
            userIndex = leaderboard.length - 1;
        }
        
        // Bubble the user to their correct position
        while (userIndex > 0) {
            uint256 prevScore = _calculateLeaderboardScore(leaderboard[userIndex - 1]);
            if (userScore > prevScore) {
                // Swap positions
                address temp = leaderboard[userIndex - 1];
                leaderboard[userIndex - 1] = leaderboard[userIndex];
                leaderboard[userIndex] = temp;
                userIndex--;
            } else {
                break;
            }
        }
        
        // Update positions mapping
        for (uint i = 0; i < leaderboard.length; i++) {
            leaderboardPosition[leaderboard[i]] = i + 1;
        }
        
        emit LeaderboardUpdated(_user, leaderboardPosition[_user]);
    }
    
    /**
     * @dev Calculate leaderboard score
     */
    function _calculateLeaderboardScore(address _user) internal view returns (uint256) {
        UserRecyclingStats storage stats = userStats[_user];
        
        // Score = products * 100 + sustainability score * 10 + longest streak * 5 + carbon credits
        return (stats.totalProductsRecycled * 100) + 
               (stats.sustainabilityScore * 10) + 
               (stats.longestStreak * 5) + 
               stats.totalCarbonCredits;
    }
    
    /**
     * @dev Create default achievements
     */
    function _createDefaultAchievements() internal {
        // First recycle achievement
        achievements[++achievementCounter] = Achievement({
            name: "First Steps",
            description: "Recycle your first product",
            requirement: 1,
            requirementType: "products",
            rewardAmount: 50 * 10**18,
            isActive: true
        });
        
        // 10 products achievement
        achievements[++achievementCounter] = Achievement({
            name: "Recycling Enthusiast",
            description: "Recycle 10 products",
            requirement: 10,
            requirementType: "products",
            rewardAmount: 200 * 10**18,
            isActive: true
        });
        
        // 7-day streak achievement
        achievements[++achievementCounter] = Achievement({
            name: "Week Warrior",
            description: "Maintain a 7-day recycling streak",
            requirement: 7,
            requirementType: "streak",
            rewardAmount: 150 * 10**18,
            isActive: true
        });
        
        // High sustainability score achievement
        achievements[++achievementCounter] = Achievement({
            name: "Sustainability Champion",
            description: "Achieve an average sustainability score of 90+",
            requirement: 90,
            requirementType: "score",
            rewardAmount: 300 * 10**18,
            isActive: true
        });
    }
}