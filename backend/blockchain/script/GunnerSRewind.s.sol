// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.25;

import {Script, console} from "forge-std/Script.sol";
import {GunnerSRewind} from "../src/GunnerSRewind.sol";

contract GunnerSRewindScript is Script {
    GunnerSRewind public gunnersrewind;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();
        gunnersrewind = new GunnerSRewind(0x26423a5aCB0cD213c2206ADdc3091bC5D4f68b62);
        vm.stopBroadcast();
    }
}
