// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IFakeNFTMarketplace {

 function purchase(uint256 _tokenid) external payable;

 function getPrice() external view returns(uint256);

 function available(uint256 _tokenid) external view returns(bool);
 
}

interface ICryptoDevsNFT {

 function balanceOf(address owner) external view returns(uint256);

 function tokenOfOwnerByIndex(address owner, uint256 tokenId) external view returns(uint256);

}

contract CryptoDevsDAO is Ownable{

 struct Proposal {

  uint256 nftTokenId;

  uint256 deadline;

  uint256 yayVotes;

  uint256 nayVotes;
 
  bool executed;

  mapping (uint256 => bool) voters;

 }

 mapping (uint256 => Proposal) public proposals;

 uint256 public numProposals;

 IFakeNFTMarketplace nftMarketplace;
 ICryptoDevsNFT cryptoDevsNFT;

 constructor(address _nftMarketplace, address _cryptoDevsNFT) payable {
  nftMarketplace = IFakeNFTMarketplace(_nftMarketplace);
  cryptoDevsNFT = ICryptoDevsNFT(_cryptoDevsNFT);
 }

 modifier nftHolderOnly {
  require(cryptoDevsNFT.balanceOf(msg.sender)>0,"NOT A DAO MEMBER");
  _;
 }

 function createProposal(uint256 _nfttokenId) external nftHolderOnly returns(uint256){

  require(nftMarketplace.available(_nfttokenId),"NFT NOT FOR SALE");
  Proposal storage proposal = proposals[numProposals];
  proposal.nftTokenId = _nfttokenId;
  proposal.deadline = block.timestamp + 5 minutes;
  numProposals++;

  return numProposals-1;
 }

 modifier activeProposalOnly(uint256 _proposalIndex){
  require(proposals[_proposalIndex].deadline > block.timestamp,"Deadline Exceeded");
  _;
 }

 enum Vote {
  YAY,
  NAY
 }

 function voteOnProposal(uint256 proposalIndex,Vote vote) external nftHolderOnly activeProposalOnly(proposalIndex) {

  Proposal storage proposal = proposals[proposalIndex];

  uint256 numVotes = 0;

  uint256 voterNFTBalance = cryptoDevsNFT.balanceOf(msg.sender);

  for (uint256 i = 0; i < voterNFTBalance; i++) {
        uint256 tokenId = cryptoDevsNFT.tokenOfOwnerByIndex(msg.sender, i);
        if (proposal.voters[tokenId] == false) {
            numVotes++;
            proposal.voters[tokenId] = true;
        }
    }

  require(numVotes > 0,"ALREADY VOTED");

  if(vote == Vote.YAY){
   proposal.yayVotes += numVotes;
  }
  if(vote == Vote.NAY){
    proposal.nayVotes += numVotes;
 }

 }

 modifier inactiveProposalOnly(uint256 proposalIndex){
  require(proposals[proposalIndex].deadline<=block.timestamp,"DEADLINE NOT YET EXCEEDED");
  require(proposals[proposalIndex].executed==false,"ALREADY EXECUTED");
  _;
 }

 function executeProposal(uint256 proposalIndex) external nftHolderOnly inactiveProposalOnly(proposalIndex) {

  Proposal storage proposal = proposals[proposalIndex];

  if(proposal.yayVotes >= proposal.nayVotes){
   uint256 nftPrice = nftMarketplace.getPrice();
   require(address(this).balance>=nftPrice,"INSUFFICIENT FUNDS");
   nftMarketplace.purchase{value:nftPrice}(proposal.nftTokenId);
  }

  proposal.executed = true;

 }

 function withdrawEther() external onlyOwner {
  uint256 amount = address(this).balance;
  require(amount>0,"NO ether to withdraw");
  (bool sent, ) = payable(owner()).call{value: amount}("");
  require(sent, "FAILED_TO_WITHDRAW_ETHER");

 }

 receive() external payable{}

 fallback() external payable{}

 
}

/*FakeNFTMarketplace deployed to:  0x44878B1E9bdC3FEfFeaFf48dCeced7AdD849D254
CryptoDevsDAO deployed to:  0xBBf0771f2A323776875BB494819Ec782EbC539Ad*/

