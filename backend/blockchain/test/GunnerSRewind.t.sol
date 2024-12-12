// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.25;

import {Test} from "forge-std/Test.sol";
import {GunnerSRewind} from "../src/GunnerSRewind.sol";
import {CheckPointNFT} from "../src/CheckPointNFT.sol";

contract GunnerSRewindTest is Test {
    GunnerSRewind public gunnersrewind;
    CheckPointNFT public checkpointnft;
    address public player = address(0x1);
    address public operator = address(0x2);
    string public constant BASE_URI = "ipfs://QmQxYG2QAngFrGt3DRbtZUfGS5rL9B1ztGeZgM42K1Xvqg";

    function setUp() public {
        checkpointnft = new CheckPointNFT(BASE_URI);
        gunnersrewind = new GunnerSRewind(address(checkpointnft));
        checkpointnft.authorizeWorld(address(gunnersrewind));
    }

    function testRegisterPlayer() public {
        gunnersrewind.setGameOperator(operator, true);
        vm.startPrank(player);
        gunnersrewind.mintCheckpoint("World1", 1, 100, 1000, 100, 50, new string[](0), new string[](0), 3600, 10, 5);
        vm.stopPrank();
        assertTrue(checkpointnft.balanceOf(msg.sender) > 0, "Player should own a CheckPoint NFT to be registered as active");
    }

    function testSetGameOperator() public {
        gunnersrewind.setGameOperator(operator, true);
        assertTrue(gunnersrewind.gameOperators(operator), "Operator should be set");
    }

    function testAuthorizedWorld() public view {
        assertTrue(checkpointnft.authorizedWorlds(address(gunnersrewind)),"World should be Authorized");
    }

    function testCheckpointMint() public {
        gunnersrewind.setGameOperator(operator, true);
        
        // Simulate the player triggering a checkpoint update
        vm.startPrank(player);
        uint256 tokenId = gunnersrewind.mintCheckpoint("World1", 1, 100, 1000, 100, 50, new string[](0), new string[](0), 3600, 10, 5);
        vm.stopPrank();
        // vm.startPrank(player);
        // gunnersrewind.triggerCheckpointUpdate(tokenId);
        // vm.stopPrank();
        assertEq(tokenId, 0);
        // Add assertions to verify the checkpoint data was updated correctly
        // This will depend on how you implement the CheckPointNFT contract
    }


    function testOnlyOwnerCanSetGameOperator() public {
        vm.expectRevert();
        vm.startPrank(player);
        gunnersrewind.setGameOperator(player, true);
        vm.stopPrank();
    }
}
