import Head from "next/head";
import styles from "../styles/Home.module.css";
import { Contract,providers } from "ethers";
import {formatEther} from "ethers/lib/utils";
import { CRYPTODEVS_DAO_ABI,CRYPTODEVS_DAO_CONTRACT_ADDRESS,CRYPTODEVS_NFT_ABI,CRYPTODEVS_NFT_CONTRACT_ADDRESS } from "../constants";
import{useRef,useEffect,useState} from "react";
import Web3Modal from "web3modal";


export default function Home() {

  const [walletConnected, setWalletConnected] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [treasuryBalance, setTreasuryBalance] = useState("0");
  const [loading, setLoading] = useState(false);
  const [numProposals,setNumProposals] = useState("0");
  const [nftBalance,setNftBalance] = useState(0);
  const [fakeNftTokenId, setFakeNftTokenId] = useState("");
  const [proposals,setProposals] = useState([]);

  const [selectedTab, setSelectedTab] = useState("");

  const web3ModalRef = useRef();

  const getProviderOrSigner = async(needSigner = false) => {
    try{
      const provider = await web3ModalRef.current.connect();
      const web3Provider = new providers.Web3Provider(provider);

      const {chainId} = await web3Provider.getNetwork();
      if(chainId!==5){
        window.alert("Please switch to Goerli Network");
        throw new Error("Please switch to Goerli Network");
      }

      if(needSigner){
        const signer = web3Provider.getSigner();
        return signer;
      }

      return web3Provider;

    } catch(e){
      console.log(e);
    }

  }

  const getDaoContractInstance = (providerOrsigner) => {
    return new Contract(CRYPTODEVS_DAO_CONTRACT_ADDRESS, CRYPTODEVS_DAO_ABI, providerOrsigner);
  };

  const getCryptodevsNftContractInstance = (providerOrsigner) => {
    return new Contract(CRYPTODEVS_NFT_CONTRACT_ADDRESS, CRYPTODEVS_NFT_ABI, providerOrsigner);
  };

  const connectWallet = async() => {
    try {
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (error) {
      console.error(error);
    }
  }

  const getDAOOwner = async() => {
    try {
      const signer = await getProviderOrSigner(true);
      const contract = getDaoContractInstance(signer);

      const _owner = await contract.owner();
      const address = await signer.getAddress();

      if(_owner.toLowerCase() === address.toLowerCase()){
        setIsOwner(true);
      }
    } catch (error) {
      console.error(error);
    }
  }

  const getDAOTreasuryBalance = async() => {
    try {
      const provider = await getProviderOrSigner(false);
      const balance = await provider.getBalance(CRYPTODEVS_DAO_CONTRACT_ADDRESS);
      setTreasuryBalance(balance.toString());
    } catch (error) {
      console.error(error);
    }
  }

  const withdrawDAOEther = async() => {
    try {
      const signer = await getProviderOrSigner(true);
      const contract = getDaoContractInstance(signer);
      const tx = await contract.withdrawEther();
      setLoading(true);
      await tx.wait();
      setLoading(false);
      getDAOTreasuryBalance();
    } catch (error) {
      console.error(error);
      window.alert(error.reason);
    }
  }

  const getNumProposalsInDAO = async() => {
    try {
      const provider = await getProviderOrSigner(true);
      const contract = getDaoContractInstance(provider);
      const tx = await contract.numProposals();
      setNumProposals(tx.toString());
    } catch (error) {
      console.error(error);
    }
  }

  const getUserNFTBalance = async() => {
    try {
      const signer = await getProviderOrSigner(true);
      const nftcontract = getCryptodevsNftContractInstance(signer);
      const balance = await nftcontract.balanceOf(signer.getAddress());
      setNftBalance(parseInt(balance.toString()));
    } catch (error) {
      console.error(error);
    }
  }

  const createProposal = async() => {
    try {
      const signer = await getProviderOrSigner(true);
      const contract = getDaoContractInstance(signer);
      const tx = await contract.createProposal(fakeNftTokenId);
      setLoading(true);
      await tx.wait();
      await getNumProposalsInDAO();
      setLoading(false);
      
    } catch (error) {
      console.error(error);
      window.alert(error.reason)
    }
  }

  const fetchProposalById = async(id) => {
    try {
      const provider = await getProviderOrSigner(false);
      const contract = getDaoContractInstance(provider);
      const proposal = await contract.proposals(id);
      const parsedProposal = {
        proposalId : id,
        nftTokenId : proposal.nftTokenId.toString(),
        deadline : new Date(parseInt(proposal.deadline.toString())*1000),
        yayVotes : proposal.yayVotes.toString(),
        nayVotes : proposal.nayVotes.toString(),
        executed : proposal.executed,
      }
      return parsedProposal;
    } catch (error) {
      console.error(error);
    }
  }

  const fetchAllProposals = async() => {
    try {
      const proposals = [];
      for(let i=0;i<numProposals;i++){
        const proposal = await fetchProposalById(i);
        proposals.push(proposal);
      }
      setProposals(proposals);
      return proposals;
    } catch (error) {
      console.error(error);
    }
  }

  const voteOnProposal = async(_proposalId,_vote) => {
    try {
      const signer = await getProviderOrSigner(true);
      const daoContract = getDaoContractInstance(signer);
      let vote = _vote === "YAY" ? 0 : 1;
      const txn = await daoContract.voteOnProposal(_proposalId,vote);
      setLoading(true);
      await txn.wait();
      setLoading(false);
      await fetchAllProposals();
    } catch (error) {
      console.error(error);
      window.alert(error.reason);
    }
  }

  const executeProposal = async(_proposalId) => {
    try {
      const signer = await getProviderOrSigner(true);
      const daoContract = getDaoContractInstance(signer);
      
      const txn = await daoContract.executeProposal(_proposalId);
      setLoading(true);
      await txn.wait();
      setLoading(false);
      await fetchAllProposals();
      getDAOTreasuryBalance();
    } catch (error) {
      console.error(error);
      window.alert(error.reason);
    }
  }

  useEffect(() => {
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "goerli",
        providerOptions: {},
        disableInjectedProvider: false,
      });

      connectWallet().then(() => {
        getDAOTreasuryBalance();
        getUserNFTBalance();
        getNumProposalsInDAO();
        getDAOOwner();
      });
    }
  }, [walletConnected]);

  // Piece of code that runs everytime the value of `selectedTab` changes
  // Used to re-fetch all proposals in the DAO when user switches
  // to the 'View Proposals' tab
  useEffect(() => {
    if (selectedTab === "View Proposals") {
      fetchAllProposals();
    }
  }, [selectedTab]);

  function renderTabs() {
    if (selectedTab === "Create Proposal") {
      return renderCreateProposalTab();
    } else if (selectedTab === "View Proposals") {
      return renderViewProposalsTab();
    }
    return null;
  }

  // Renders the 'Create Proposal' tab content
  function renderCreateProposalTab() {
    if (loading) {
      return (
        <div className={styles.description}>
          Loading... Waiting for transaction...
        </div>
      );
    } else if (nftBalance === 0) {
      return (
        <div className={styles.description}>
          You do not own any CryptoDevs NFTs. <br />
          <b>You cannot create or vote on proposals</b>
        </div>
      );
    } else {
      return (
        <div className={styles.container}>
          <label>Fake NFT Token ID to Purchase: </label>
          <input
            placeholder="0"
            type="number"
            onChange={(e) => setFakeNftTokenId(e.target.value)}
          />
          <button className={styles.button2} onClick={createProposal}>
            Create
          </button>
        </div>
      );
    }
  }

  // Renders the 'View Proposals' tab content
  function renderViewProposalsTab() {
    if (loading) {
      return (
        <div className={styles.description}>
          Loading... Waiting for transaction...
        </div>
      );
    } else if (proposals.length === 0) {
      return (
        <div className={styles.description}>No proposals have been created</div>
      );
    } else {
      return (
        <div>
          {proposals.map((p, index) => (
            <div key={index} className={styles.proposalCard}>
              <p>Proposal ID: {p.proposalId}</p>
              <p>Fake NFT to Purchase: {p.nftTokenId}</p>
              <p>Deadline: {p.deadline.toLocaleString()}</p>
              <p>Yay Votes: {p.yayVotes}</p>
              <p>Nay Votes: {p.nayVotes}</p>
              <p>Executed?: {p.executed.toString()}</p>
              {p.deadline.getTime() > Date.now() && !p.executed ? (
                <div className={styles.flex}>
                  <button
                    className={styles.button2}
                    onClick={() => voteOnProposal(p.proposalId, "YAY")}
                  >
                    Vote YAY
                  </button>
                  <button
                    className={styles.button2}
                    onClick={() => voteOnProposal(p.proposalId, "NAY")}
                  >
                    Vote NAY
                  </button>
                </div>
              ) : p.deadline.getTime() < Date.now() && !p.executed ? (
                <div className={styles.flex}>
                  <button
                    className={styles.button2}
                    onClick={() => executeProposal(p.proposalId)}
                  >
                    Execute Proposal{" "}
                    {p.yayVotes > p.nayVotes ? "(YAY)" : "(NAY)"}
                  </button>
                </div>
              ) : (
                <div className={styles.description}>Proposal Executed</div>
              )}
            </div>
          ))}
        </div>
      );
    }
  }

  return (
    <div>
      <Head>
        <title>CryptoDevs DAO</title>
        <meta name="description" content="CryptoDevs DAO" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Crypto Devs!</h1>
          <div className={styles.description}>Welcome to the DAO!</div>
          <div className={styles.description}>
            Your CryptoDevs NFT Balance: {nftBalance}
            <br />
            Treasury Balance: {formatEther(treasuryBalance)} ETH
            <br />
            Total Number of Proposals: {numProposals}
          </div>
          <div className={styles.flex}>
            <button
              className={styles.button}
              onClick={() => setSelectedTab("Create Proposal")}
            >
              Create Proposal
            </button>
            <button
              className={styles.button}
              onClick={() => setSelectedTab("View Proposals")}
            >
              View Proposals
            </button>
          </div>
          {renderTabs()}
          {/* Display additional withdraw button if connected wallet is owner */}
          {isOwner ? (
            <div>
            {loading ? <button className={styles.button}>Loading...</button>
                     : <button className={styles.button} onClick={withdrawDAOEther}>
                         Withdraw DAO ETH
                       </button>
            }
            </div>
            ) : ("")
          }
        </div>
        <div>
          <img className={styles.image} src="/cryptodevs/0.svg" />
        </div>
      </div>

      <footer className={styles.footer}>
        Made with &#10084; by Crypto Devs
      </footer>
    </div>
  );
}
