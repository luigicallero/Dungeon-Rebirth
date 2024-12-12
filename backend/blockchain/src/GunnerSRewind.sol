// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/access/Ownable.sol";

// Add the interface for CheckPointNFT
interface ICheckPointNFT {
    function balanceOf(address) external view returns(uint256);
    function ownerOf(uint256 tokenId) external view returns (address);
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
    ) external;
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
    ) external returns (uint256);
}

contract GunnerSRewind is Ownable {
    ICheckPointNFT public immutable checkpointNFT;
    
    // Struct to hold game state parameters
    struct GameState {
        string worldName;
        uint16 levelNumber;
        uint8 levelPercentage;
        uint128 playerScore;
        uint16 health;
        uint16 souls;
        string[] weapons;
        string[] items;
        uint32 timePlayed;
        uint32 kills;
        uint16 boosters;
    }

    // Mapping to store game states for each player
    mapping(address => GameState) public playerGameStates;

    // Access control roles
    mapping(address => bool) public gameOperators;
    
    modifier onlyGameOperator() {
        require(gameOperators[msg.sender] || msg.sender == owner(), "Not a game operator");
        _;
    }

    // owner of a CheckPoint NFT is an activePlayer
    modifier onlyActivePlayer() {
        require(checkpointNFT.balanceOf(msg.sender) > 0, "Not an active player");
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

    // Checkpoint update function
    function insertCheckpoint(uint256 tokenId) external onlyActivePlayer {
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

    // Function to mint checkpoints
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
    ) external returns (uint256) {
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

    function setCurrentGameState(
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
        uint16 boosters) external onlyOwner (
    ) {
        playerGameStates[msg.sender] = GameState({
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
    }

    // Events
    event GameOperatorUpdated(address indexed operator, bool status);
    event PlayerRegistered(address indexed player);
}