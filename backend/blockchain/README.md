### Logic for the front end

When executing a Checkpoint Insert:
1 - Game Parameters are shown to the user to approve
2 - If approved, Contract Owner will initiate a setGameState function with the parameters provided by the Game (Owner: gas consumption with Game Contract)
3 - Function mintCheckpoint or insertCheckpoint is executed (User: gas consumption with Game and NFT Contract)
4 - If successful, flag will be shown in the game

Events:

contract.on("UpdateMetadata", (tokenId, newURI) => {
  console.log(`Metadata updated for token ${tokenId}:`, newURI);
});


Here are 10 popular NFT games that interact with NFTs and update their metadata dynamically. These games typically allow players to trade, level up, or customize their NFTs:

---

### **Top 10 NFT Games with Metadata Interaction**
1. **Axie Infinity (Ethereum/Ronin)**
   - **Description**: A play-to-earn game where players breed, trade, and battle creatures called Axies.
   - **Metadata Update**: Axies’ attributes and stats update as they level up and breed.
   - **Smart Contract**: [Axie Infinity on Etherscan](https://etherscan.io/address/0xf5b0c9b51a0b6aebbd29d1f8905c67d7168c3c1b) (Example).

2. **Gods Unchained (Ethereum)**
   - **Description**: A card-based game where cards are NFTs that can be traded or upgraded.
   - **Metadata Update**: Cards evolve and change based on in-game mechanics.
   - **Smart Contract**: [Gods Unchained Cards](https://etherscan.io/address/0x0e3a2a1f2146d86a604adc220b4967a898d7fe07).

3. **The Sandbox (Ethereum/Polygon)**
   - **Description**: A metaverse game where users create, trade, and monetize virtual assets and land.
   - **Metadata Update**: LAND NFTs can change metadata as owners build on or customize them.
   - **Smart Contract**: [LAND on Etherscan](https://etherscan.io/address/0x7c4d7f2e5f3a7a024f1480d7986dc9e687f0b21e).

4. **Decentraland (Ethereum)**
   - **Description**: A decentralized virtual world where LAND and wearables are NFTs.
   - **Metadata Update**: LAND metadata updates with new structures or experiences added by the owner.
   - **Smart Contract**: [Decentraland LAND](https://etherscan.io/address/0xf87e31492faf9a91b02ee0deaad50d51d56d5d4d).

5. **Illuvium (Ethereum)**
   - **Description**: A game involving creatures called Illuvials, which are NFTs that can be captured and trained.
   - **Metadata Update**: Illuvials gain experience and evolve as they are trained.
   - **Smart Contract**: [Illuvium NFT Example](https://etherscan.io/token/0x9cface1cddd2e5bb2a7e78a7e7a0a6cfbc9e6b98).

6. **Zed Run (Polygon/Ethereum)**
   - **Description**: A digital horse racing game where horses are NFTs.
   - **Metadata Update**: Horses’ metadata reflects race history, performance, and breeding stats.
   - **Smart Contract**: [Zed Run Horses](https://polygonscan.com/address/0xd622ae5cc27f0eebc234bcb6b952bd20cc78d2f6).

7. **Star Atlas (Solana)**
   - **Description**: A space exploration and strategy game with NFT ships and resources.
   - **Metadata Update**: Ships and assets update as players modify and upgrade them.
   - **Smart Contract**: [Star Atlas Marketplace](https://solscan.io/).

8. **CryptoKitties (Ethereum)**
   - **Description**: One of the first NFT games where players breed and collect virtual cats.
   - **Metadata Update**: Cats’ metadata changes based on breeding combinations.
   - **Smart Contract**: [CryptoKitties on Etherscan](https://etherscan.io/address/0x06012c8cf97bead5deae237070f9587f8e7a266d).

9. **Chain Guardians (Ethereum/Polygon)**
   - **Description**: A role-playing game combining DeFi and NFTs, with upgradable characters.
   - **Metadata Update**: NFTs evolve with in-game progress or staking.
   - **Smart Contract**: [ChainGuardians NFT](https://polygonscan.com/address/0xabc7e5b374fcf755f7b37e20da0f296d803f24cc).

10. **Sorare (Ethereum/Polygon)**
    - **Description**: A fantasy football game where players trade and manage NFT-based player cards.
    - **Metadata Update**: Player cards reflect real-world performance statistics.
    - **Smart Contract**: [Sorare Player Cards](https://etherscan.io/address/0x87a924f0c59d04cba91375eafeb3836c17fd033e).

---

Each game's metadata interaction depends on its core mechanics and the blockchain they are built on. Let me know if you’d like a deeper dive into a specific game or help finding detailed contract interactions!