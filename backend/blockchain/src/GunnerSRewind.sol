// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/access/Ownable.sol";

// Add the interface for CheckPointNFT if not already defined
interface ICheckPointNFT {
    function ownerOf(uint256 tokenId) external view returns (address);
    function updateCheckpointData(
        uint256 tokenId,
        string memory worldName,
        uint256 levelNumber,
        uint256 levelPercentage,
        uint256 playerScore,
        uint256 health,
        uint256 shield,
        string[] memory weapons,
        uint256 timePlayed,
        uint256 kills,
        string[] memory boosters,
        string memory imageURI
    ) external;
}

contract GunnerSRewind is Ownable {
    ICheckPointNFT public immutable checkpointNFT;
    
    // Game state mappings
    mapping(address => bool) public activePlayers;
    mapping(address => uint256) public playerLevels;
    // ... other game state variables

    // Access control roles
    mapping(address => bool) public gameOperators;
    
    modifier onlyGameOperator() {
        require(gameOperators[msg.sender] || msg.sender == owner(), "Not a game operator");
        _;
    }

    modifier onlyActivePlayer() {
        require(activePlayers[msg.sender], "Not an active player");
        _;
    }

    constructor(address checkpointNFTAddress) Ownable(msg.sender) {
        checkpointNFT = ICheckPointNFT(checkpointNFTAddress);
    }

    // Access control management
    function setGameOperator(address operator, bool status) external onlyOwner {
        gameOperators[operator] = status;
        emit GameOperatorUpdated(operator, status);
    }

    // Player management
    function registerPlayer(address player) external onlyGameOperator {
        activePlayers[player] = true;
        emit PlayerRegistered(player);
    }

    // Checkpoint update function
    function triggerCheckpointUpdate(uint256 tokenId) external onlyActivePlayer {
        require(msg.sender == checkpointNFT.ownerOf(tokenId), "Only token owner");
        
        // Get current game state for the player
        (
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
        ) = getCurrentGameState(msg.sender);

        // Update the checkpoint
        checkpointNFT.updateCheckpointData(
            tokenId,
            worldName,
            levelNumber,
            levelPercentage,
            playerScore,
            health,
            souls,
            weapons,
            items,
            timePlayed,
            kills,
            boosters
        );
    }

    // New function to mint checkpoints
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
    ) external onlyGameOperator returns (uint256) {
        uint256 tokenId = checkpointNFT.mintCheckpoint(
            worldName,
            levelNumber,
            levelPercentage,
            playerScore,
            health,
            souls,
            weapons,
            items,
            timePlayed,
            kills,
            boosters
        );
        return tokenId;
    }

    function getCurrentGameState(address player) internal view returns (
        string memory worldName,
        uint16 levelNumber,
        uint8 levelPercentage,
        uint128 playerScore,
        uint16 health,
        uint16 souls,
        string[] memory weapons,
        string[] memory items,
        uint256 timePlayed,
        uint256 kills,
        string[] memory boosters,
    ) {
        // Implementation to get current game state
        // This should be implemented based on your game's specific logic
    }

    // Events
    event GameOperatorUpdated(address indexed operator, bool status);
    event PlayerRegistered(address indexed player);
}