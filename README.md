# DAO for CryptoDev NFT holders:  

This is a DAO for holders of your CryptoDevs NFTs. 

NFT holders are allowed to create and vote on proposals to use the ETH belonging to CryptoDev DAO for purchasing other NFTs from an NFT marketplace, and speculate on price. 

- Anyone with a CryptoDevs NFT can create a proposal to purchase a different NFT from an NFT marketplace
- Everyone with a CryptoDevs NFT can vote for or against the active proposals
- Each NFT counts as one vote for each proposal
- Voter cannot vote multiple times on the same proposal with the same NFT
- If majority of the voters vote for the proposal by the deadline(5min after the proposal is created), the NFT purchase is automatically executed

![image](https://user-images.githubusercontent.com/77727312/230799713-6e0cd56f-7f7f-4b12-a25e-30155ef67562.png)

To avoid overcomplicating things, a simplified fake NFT marketplace(each NFT of 0.1 ether) is created as the focus is on DAO.

Solidity, Hardhat are used to build smart contract.

Quicknode, to deploy the contract through hardhat. React, Next js as frontend services.

Web3Modal to easily allow users to connect to the dApp with all sorts of different wallets like Metamask, Dapper, Gnosis Safe, Frame, Web3 Browsers, etc.



