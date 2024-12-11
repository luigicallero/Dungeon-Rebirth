// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract CheckPointNFT is ERC721, Ownable {
    using Strings for uint256;
    
    event CheckpointUpdated(uint256 indexed tokenId, address indexed updater);
    event WorldAuthorized(address indexed worldAddress);
    event WorldRevoked(address indexed worldAddress);
    event CheckpointMinted(uint256 indexed tokenId, address indexed player, address indexed world);
    
    uint256 private _nextTokenId;
    string private _baseTokenURI;

    // Update struct to store checkpoint data with optimized uint sizes
    struct CheckpointData {
        string worldName;
        uint16 levelNumber;      // Max 1000, fits in uint16 (max 65,535)
        uint8 levelPercentage;   // Max 100, fits in uint8 (max 255)
        uint128 playerScore;     // Likely doesn't need full uint256
        uint16 health;          // Max 10000, fits in uint16
        uint16 souls;           // Max 100, fits in uint16 (but displays as max 3 in OpenSea)
        string[] weapons;
        string[] items;
        uint32 timePlayed;      // Can store up to ~136 years in seconds
        uint32 kills;           // Unlikely to exceed 4.2 billion
        uint16 boosters;        // Max 1000, fits in uint16
    }

    // Mapping from token ID to checkpoint data
    mapping(uint256 => CheckpointData) public checkpoints;
    mapping(address => bool) public authorizedWorlds;

    // eentrancy guard
    bool private _locked;
    modifier nonReentrant() {
        require(!_locked, "ReentrancyGuard: reentrant call");
        _locked = true;
        _;
        _locked = false;
    }

    // Update the input validation constants to match the new types
    uint16 private constant MAX_WEAPONS_ARRAY_LENGTH = 20;
    uint16 private constant MAX_ITEMS_ARRAY_LENGTH = 1000;
    uint16 private constant MAX_BOOSTERS = 10;
    uint8 private constant MAX_STRING_LENGTH = 100;
    uint16 private constant MAX_HEALTH = 10000;
    uint16 private constant MAX_SOULS = 100;  // Internal limit is 100, but display max is 3
    uint16 private constant MAX_LEVEL = 1000;

    constructor(string memory baseTokenURI) ERC721("CheckPoint", "CPT") Ownable(msg.sender) {
        _baseTokenURI = baseTokenURI;
    }

    function authorizeWorld(address worldAddress) external onlyOwner {
        authorizedWorlds[worldAddress] = true;
        emit WorldAuthorized(worldAddress);
    }

    function revokeWorld(address worldAddress) external onlyOwner {
        authorizedWorlds[worldAddress] = false;
        emit WorldRevoked(worldAddress);
    }

    function mintCheckpoint(
        string memory worldName,
        uint16 levelNumber,
        uint8 levelPercentage,
        uint128 playerScore,
        uint16 health,
        uint16 souls,
        string[] memory weapons,
        string[] memory items,
        uint32 timePlayed,
        uint32 kills,
        uint16 boosters
    ) external nonReentrant returns (uint256) {
        require(authorizedWorlds[msg.sender], "Only authorized worlds can mint checkpoints");
        
        // Add input validation
        require(bytes(worldName).length <= MAX_STRING_LENGTH, "World name exceeds maximum length");
        require(levelNumber <= MAX_LEVEL, "Level number exceeds maximum value");
        require(levelPercentage <= 100, "Invalid level percentage");
        require(health <= MAX_HEALTH, "Health value exceeds maximum limit");
        require(souls <= MAX_SOULS, "Souls value exceeds maximum limit");
        require(weapons.length <= MAX_WEAPONS_ARRAY_LENGTH, "Weapons array exceeds maximum length");
        require(items.length <= MAX_ITEMS_ARRAY_LENGTH, "Items array exceeds maximum length");
        require(boosters <= MAX_BOOSTERS, "Boosters value exceeds maximum limit");

        // Validate array contents
        for(uint i = 0; i < weapons.length; i++) {
            require(bytes(weapons[i]).length <= MAX_STRING_LENGTH, "Weapon name exceeds maximum length");
        }
        for(uint i = 0; i < items.length; i++) {
            require(bytes(items[i]).length <= MAX_STRING_LENGTH, "Item name exceeds maximum length");
        }
        
        uint256 tokenId = _nextTokenId++;
        _safeMint(tx.origin, tokenId);
        
        checkpoints[tokenId] = CheckpointData({
            worldName: worldName,
            levelNumber: levelNumber,
            levelPercentage: levelPercentage,
            playerScore: playerScore,
            health: health,
            souls: souls,
            weapons: weapons,
            items: items,
            timePlayed: timePlayed,
            kills: kills,
            boosters: boosters
        });

        emit CheckpointMinted(tokenId, tx.origin, msg.sender);
        return tokenId;
    }

    function getCheckpointData(uint256 tokenId) external view returns (CheckpointData memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return checkpoints[tokenId];
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        CheckpointData memory checkpoint = checkpoints[tokenId];
        
        // Pre-allocate strings with approximate sizes
        string[] memory attributes = new string[](9 + checkpoint.weapons.length + checkpoint.items.length);
        uint256 index = 0;
        
        // Add base attributes
        attributes[index++] = string(abi.encodePacked('{"trait_type": "World Name", "value": "', 
            checkpoint.worldName, 
        '"}'));
        attributes[index++] = string(abi.encodePacked('{"trait_type": "Level", "value": "', 
            uint256(checkpoint.levelNumber).toString(), 
        '"}'));
        attributes[index++] = string(abi.encodePacked('{"trait_type": "Level Percentage", "value": "', 
            uint256(checkpoint.levelPercentage).toString(), 
        '"}'));
        attributes[index++] = string(abi.encodePacked('{"trait_type": "Score", "value": "', 
            uint256(checkpoint.playerScore).toString(), 
        '"}'));
        attributes[index++] = string(abi.encodePacked('{"trait_type": "Health", "value": "', 
            uint256(checkpoint.health).toString(), 
        '"}'));
        attributes[index++] = string(abi.encodePacked('{"trait_type": "souls", "value": "', 
            uint256(checkpoint.souls).toString(), 
        '"}'));
        attributes[index++] = string(abi.encodePacked('{"trait_type": "Time Played", "value": "', 
            uint256(checkpoint.timePlayed).toString(), 
        '"}'));
        attributes[index++] = string(abi.encodePacked('{"trait_type": "Kills", "value": "', 
            uint256(checkpoint.kills).toString(), 
        '"}'));
        attributes[index++] = string(abi.encodePacked('{"trait_type": "Boosters", "value": "x', 
            uint256(checkpoint.boosters).toString(), 
        '"}'));

        // Add weapons
        for (uint i = 0; i < checkpoint.weapons.length; i++) {
            attributes[index++] = string(abi.encodePacked(
                '{"trait_type": "Weapon ', 
                (i + 1).toString(), 
                '", "value": "', 
                checkpoint.weapons[i],
                '"}'
            ));
        }

        // Add items
        for (uint i = 0; i < checkpoint.items.length; i++) {
            attributes[index++] = string(abi.encodePacked(
                '{"trait_type": "Item ',
                (i + 1).toString(),
                '", "value": "',
                checkpoint.items[i], 
                '"}'
            ));
        }

        // Join all attributes with commas
        string memory attributesJson = '';
        for (uint i = 0; i < attributes.length; i++) {
            if (i > 0) attributesJson = string.concat(attributesJson, ',');
            attributesJson = string.concat(attributesJson, attributes[i]);
        }
        
        // Construct the final JSON
        string memory json = string(abi.encodePacked(
            '{"name": "Checkpoint #', 
            tokenId.toString(),
            '", "description": "Checkpoints are used to save progress at certain points. ' 
            'If the player fails or exits the game, they can resume from the last checkpoint ' 
            'rather than starting over from the beginning", ',
            '"image": "', 
            _baseURI(),
            '", "attributes": [',
            attributesJson,
            ']}'
        ));

        return string(abi.encodePacked('data:application/json;base64,', Base64.encode(bytes(json))));
    }

    function updateCheckpointData(
        uint256 tokenId,
        string memory worldName,
        uint16 levelNumber,
        uint8 levelPercentage,
        uint128 playerScore,
        uint16 health,
        uint16 souls,
        string[] memory weapons,
        string[] memory items,
        uint32 timePlayed,
        uint32 kills,
        uint16 boosters
    ) external nonReentrant {
        require(authorizedWorlds[msg.sender], "Only authorized worlds can update checkpoints");
        require(tx.origin == ownerOf(tokenId), "Transaction must be initiated by token owner");
        
        // Input validation
        require(bytes(worldName).length <= MAX_STRING_LENGTH, "World name exceeds maximum length");
        require(levelNumber <= MAX_LEVEL, "Level number exceeds maximum value");
        require(levelPercentage <= 100, "Invalid level percentage");
        require(health <= MAX_HEALTH, "Health value exceeds maximum limit");
        require(souls <= MAX_SOULS, "Souls value exceeds maximum limit");
        
        // Add input validation for array lengths
        require(weapons.length <= MAX_WEAPONS_ARRAY_LENGTH, "Weapons array exceeds maximum length");
        require(items.length <= MAX_ITEMS_ARRAY_LENGTH, "Items array exceeds maximum length");
        require(boosters <= MAX_BOOSTERS, "Boosters value exceeds maximum limit");

        // Validate array contents
        for(uint i = 0; i < weapons.length; i++) {
            require(bytes(weapons[i]).length <= MAX_STRING_LENGTH, "Weapon name exceeds maximum length");
        }
        for(uint i = 0; i < items.length; i++) {
            require(bytes(items[i]).length <= MAX_STRING_LENGTH, "Item name exceeds maximum length");
        }
        
        checkpoints[tokenId] = CheckpointData({
            worldName: worldName,
            levelNumber: levelNumber,
            levelPercentage: levelPercentage,
            playerScore: playerScore,
            health: health,
            souls: souls,
            weapons: weapons,
            items: items,
            timePlayed: timePlayed,
            kills: kills,
            boosters: boosters
        });

        emit CheckpointUpdated(tokenId, msg.sender);
    }
}
