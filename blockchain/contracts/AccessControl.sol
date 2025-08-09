// SPDX-License-Identifier: MIT 
pragma solidity ^0.8.19;

/**
 * @title AccessControl
 * @dev Role-based access control contract for the circular supply chain system
 */
contract AccessControl {
    
    // Role definitions
    bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00;
    bytes32 public constant MANUFACTURER_ROLE = keccak256("MANUFACTURER_ROLE");
    bytes32 public constant RECYCLER_ROLE = keccak256("RECYCLER_ROLE");
    bytes32 public constant CONSUMER_ROLE = keccak256("CONSUMER_ROLE");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    
    // Role data structure
    struct RoleData {
        mapping(address => bool) members;
        bytes32 adminRole;
        bool exists;
    }
    
    // Role storage
    mapping(bytes32 => RoleData) private _roles;
    
    // User profile structure
    struct UserProfile {
        string name;
        string email;
        string organizationType; // "Manufacturer", "Recycler", "Consumer", "Auditor"
        string[] certifications;
        uint256 registeredAt;
        bool isVerified;
        bool isActive;
    }
    
    // User profiles
    mapping(address => UserProfile) public userProfiles;
    mapping(bytes32 => address[]) public roleMembers; // Track members of each role
    
    // Events
    event RoleAdminChanged(bytes32 indexed role, bytes32 indexed previousAdminRole, bytes32 indexed newAdminRole);
    event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender);
    event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender);
    event UserProfileCreated(address indexed user, string organizationType);
    event UserProfileUpdated(address indexed user, string name);
    event UserVerified(address indexed user, address indexed verifier);
    
    // Modifiers
    modifier onlyRole(bytes32 role) {
        require(hasRole(role, msg.sender), "AccessControl: account missing required role");
        _;
    }
    
    modifier onlyVerifiedUser() {
        require(userProfiles[msg.sender].isVerified, "User must be verified");
        require(userProfiles[msg.sender].isActive, "User account is inactive");
        _;
    }
    
    // Constructor
    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        
        // Set admin roles
        _setRoleAdmin(MANUFACTURER_ROLE, DEFAULT_ADMIN_ROLE);
        _setRoleAdmin(RECYCLER_ROLE, DEFAULT_ADMIN_ROLE);
        _setRoleAdmin(CONSUMER_ROLE, DEFAULT_ADMIN_ROLE);
        _setRoleAdmin(AUDITOR_ROLE, DEFAULT_ADMIN_ROLE);
        _setRoleAdmin(VERIFIER_ROLE, DEFAULT_ADMIN_ROLE);
    }
    
    /**
     * @dev Check if account has a specific role
     */
    function hasRole(bytes32 role, address account) public view returns (bool) {
        return _roles[role].members[account];
    }
    
    /**
     * @dev Get the admin role that controls a role
     */
    function getRoleAdmin(bytes32 role) public view returns (bytes32) {
        return _roles[role].adminRole;
    }
    
    /**
     * @dev Grant a role to an account
     */
    function grantRole(bytes32 role, address account) public onlyRole(getRoleAdmin(role)) {
        _grantRole(role, account);
    }
    
    /**
     * @dev Revoke a role from an account
     */
    function revokeRole(bytes32 role, address account) public onlyRole(getRoleAdmin(role)) {
        _revokeRole(role, account);
    }
    
    /**
     * @dev Renounce a role
     */
    function renounceRole(bytes32 role, address account) public {
        require(account == msg.sender, "AccessControl: can only renounce roles for self");
        _revokeRole(role, account);
    }
    
    /**
     * @dev Create user profile
     */
    function createUserProfile(
        string memory _name,
        string memory _email,
        string memory _organizationType,
        string[] memory _certifications
    ) external {
        require(bytes(userProfiles[msg.sender].name).length == 0, "Profile already exists");
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_organizationType).length > 0, "Organization type cannot be empty");
        
        UserProfile storage profile = userProfiles[msg.sender];
        profile.name = _name;
        profile.email = _email;
        profile.organizationType = _organizationType;
        profile.registeredAt = block.timestamp;
        profile.isActive = true;
        profile.isVerified = false;
        
        // Add certifications
        for (uint i = 0; i < _certifications.length; i++) {
            profile.certifications.push(_certifications[i]);
        }
        
        emit UserProfileCreated(msg.sender, _organizationType);
    }
    
    /**
     * @dev Update user profile
     */
    function updateUserProfile(
        string memory _name,
        string memory _email
    ) external {
        require(bytes(userProfiles[msg.sender].name).length > 0, "Profile does not exist");
        require(bytes(_name).length > 0, "Name cannot be empty");
        
        UserProfile storage profile = userProfiles[msg.sender];
        profile.name = _name;
        profile.email = _email;
        
        emit UserProfileUpdated(msg.sender, _name);
    }
    
    /**
     * @dev Add certification to user profile
     */
    function addCertification(string memory _certification) external {
        require(bytes(userProfiles[msg.sender].name).length > 0, "Profile does not exist");
        require(bytes(_certification).length > 0, "Certification cannot be empty");
        
        userProfiles[msg.sender].certifications.push(_certification);
    }
    
    /**
     * @dev Verify user (only by verifiers)
     */
    function verifyUser(address _user) external onlyRole(VERIFIER_ROLE) {
        require(bytes(userProfiles[_user].name).length > 0, "User profile does not exist");
        require(!userProfiles[_user].isVerified, "User already verified");
        
        userProfiles[_user].isVerified = true;
        
        // Auto-assign appropriate role based on organization type
        string memory orgType = userProfiles[_user].organizationType;
        
        if (keccak256(bytes(orgType)) == keccak256(bytes("Manufacturer"))) {
            _grantRole(MANUFACTURER_ROLE, _user);
        } else if (keccak256(bytes(orgType)) == keccak256(bytes("Recycler"))) {
            _grantRole(RECYCLER_ROLE, _user);
        } else if (keccak256(bytes(orgType)) == keccak256(bytes("Consumer"))) {
            _grantRole(CONSUMER_ROLE, _user);
        } else if (keccak256(bytes(orgType)) == keccak256(bytes("Auditor"))) {
            _grantRole(AUDITOR_ROLE, _user);
        }
        
        emit UserVerified(_user, msg.sender);
    }
    
    /**
     * @dev Deactivate user account
     */
    function deactivateUser(address _user) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(bytes(userProfiles[_user].name).length > 0, "User profile does not exist");
        userProfiles[_user].isActive = false;
    }
    
    /**
     * @dev Reactivate user account
     */
    function reactivateUser(address _user) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(bytes(userProfiles[_user].name).length > 0, "User profile does not exist");
        userProfiles[_user].isActive = true;
    }
    
    /**
     * @dev Register as manufacturer (requires verification)
     */
    function registerAsManufacturer(
        string memory _name,
        string memory _email,
        string[] memory _certifications
    ) external {
        require(bytes(userProfiles[msg.sender].name).length == 0, "Profile already exists");
        
        // Create profile
        UserProfile storage profile = userProfiles[msg.sender];
        profile.name = _name;
        profile.email = _email;
        profile.organizationType = "Manufacturer";
        profile.registeredAt = block.timestamp;
        profile.isActive = true;
        profile.isVerified = false;
        
        // Add certifications
        for (uint i = 0; i < _certifications.length; i++) {
            profile.certifications.push(_certifications[i]);
        }
        
        emit UserProfileCreated(msg.sender, "Manufacturer");
    }
    
    /**
     * @dev Register as recycler (requires verification)
     */
    function registerAsRecycler(
        string memory _name,
        string memory _email,
        string[] memory _certifications
    ) external {
        require(bytes(userProfiles[msg.sender].name).length == 0, "Profile already exists");
        
        // Create profile
        UserProfile storage profile = userProfiles[msg.sender];
        profile.name = _name;
        profile.email = _email;
        profile.organizationType = "Recycler";
        profile.registeredAt = block.timestamp;
        profile.isActive = true;
        profile.isVerified = false;
        
        // Add certifications
        for (uint i = 0; i < _certifications.length; i++) {
            profile.certifications.push(_certifications[i]);
        }
        
        emit UserProfileCreated(msg.sender, "Recycler");
    }
    
    /**
     * @dev Register as consumer
     */
    function registerAsConsumer(
        string memory _name,
        string memory _email
    ) external {
        require(bytes(userProfiles[msg.sender].name).length == 0, "Profile already exists");
        
        // Create profile
        UserProfile storage profile = userProfiles[msg.sender];
        profile.name = _name;
        profile.email = _email;
        profile.organizationType = "Consumer";
        profile.registeredAt = block.timestamp;
        profile.isActive = true;
        profile.isVerified = true; // Consumers are auto-verified
        
        // Grant consumer role immediately
        _grantRole(CONSUMER_ROLE, msg.sender);
        
        emit UserProfileCreated(msg.sender, "Consumer");
    }
    
    /**
     * @dev Get user profile
     */
    function getUserProfile(address _user) external view returns (
        string memory name,
        string memory email,
        string memory organizationType,
        string[] memory certifications,
        uint256 registeredAt,
        bool isVerified,
        bool isActive
    ) {
        UserProfile memory profile = userProfiles[_user];
        return (
            profile.name,
            profile.email,
            profile.organizationType,
            profile.certifications,
            profile.registeredAt,
            profile.isVerified,
            profile.isActive
        );
    }
    
    /**
     * @dev Get all members of a role
     */
    function getRoleMembers(bytes32 role) external view returns (address[] memory) {
        return roleMembers[role];
    }
    
    /**
     * @dev Get user's roles
     */
    function getUserRoles(address _user) external view returns (bytes32[] memory) {
        bytes32[] memory allRoles = new bytes32[](6);
        allRoles[0] = DEFAULT_ADMIN_ROLE;
        allRoles[1] = MANUFACTURER_ROLE;
        allRoles[2] = RECYCLER_ROLE;
        allRoles[3] = CONSUMER_ROLE;
        allRoles[4] = AUDITOR_ROLE;
        allRoles[5] = VERIFIER_ROLE;
        
        uint256 count = 0;
        for (uint i = 0; i < allRoles.length; i++) {
            if (hasRole(allRoles[i], _user)) {
                count++;
            }
        }
        
        bytes32[] memory userRoles = new bytes32[](count);
        uint256 index = 0;
        for (uint i = 0; i < allRoles.length; i++) {
            if (hasRole(allRoles[i], _user)) {
                userRoles[index] = allRoles[i];
                index++;
            }
        }
        
        return userRoles;
    }
    
    // Internal functions
    
    /**
     * @dev Setup a role
     */
    function _setupRole(bytes32 role, address account) internal {
        _grantRole(role, account);
    }
    
    /**
     * @dev Set the admin role for a role
     */
    function _setRoleAdmin(bytes32 role, bytes32 adminRole) internal {
        bytes32 previousAdminRole = getRoleAdmin(role);
        _roles[role].adminRole = adminRole;
        _roles[role].exists = true;
        emit RoleAdminChanged(role, previousAdminRole, adminRole);
    }
    
    /**
     * @dev Grant a role to an account
     */
    function _grantRole(bytes32 role, address account) internal {
        if (!hasRole(role, account)) {
            _roles[role].members[account] = true;
            roleMembers[role].push(account);
            emit RoleGranted(role, account, msg.sender);
        }
    }
    
    /**
     * @dev Revoke a role from an account
     */
    function _revokeRole(bytes32 role, address account) internal {
        if (hasRole(role, account)) {
            _roles[role].members[account] = false;
            
            // Remove from roleMembers array
            address[] storage members = roleMembers[role];
            for (uint i = 0; i < members.length; i++) {
                if (members[i] == account) {
                    members[i] = members[members.length - 1];
                    members.pop();
                    break;
                }
            }
            
            emit RoleRevoked(role, account, msg.sender);
        }
    }
}