import React, { useState } from "react";
import { Contract } from "@ethersproject/contracts";
import { formatEther, parseEther, formatUnits, parseUnits } from "@ethersproject/units";
import { getDefaultProvider, Web3Provider } from "@ethersproject/providers";
import { useQuery } from "@apollo/react-hooks";

import { Body, Button, Header, Image, Link, WallButton, HeaderDegen } from "./components";
import logo from "./ethereumLogo.png";
import useWeb3Modal from "./hooks/useWeb3Modal";

import { addresses, abis } from "@project/contracts";
import GET_TRANSFERS from "./graphql/subgraph";

import Slider from "react-input-slider";

import { css } from "@emotion/react";
import RiseLoader from "react-spinners/PropagateLoader";

import NumericInput from 'react-numeric-input';

import Modal from 'react-modal';


// Set up the address
const addDegenToken = addresses.DegenToken;
const addDegenEscrow = addresses.DegenEscrow;
const addDegenSpinController = addresses.DegenSpinController;
const addBetToken = addresses.WethToken;

// Set up the wives
const abiErc20 = abis.erc20;
const abiDegenSpin = abis.spinController;

function App() {
  // const { loading, error, data } = useQuery(GET_TRANSFERS);
  const [provider, loadWeb3Modal, logoutOfWeb3Modal] = useWeb3Modal();
  const [modalIsOpen,setIsOpen] = useState(false);
  const [wrongNetwork,setwrongNetwork] = useState(false);

  const[balEscrow,setBalEscrow] = useState(null);
  const[balPlayer,setBalPlayer] = useState(null);
  const[balDegPlayer,setDegBalPlayer] = useState(null);
  const[balPool,setBalPool] = useState(null);
  const[betAmount,setBetAmount] = useState(0);

  const[maxBet,setMaxBet] = useState(0);

  const[contractDegen,setcontractDegen] = useState(null);
  const[contractEscrow,setcontractEscrow] = useState(null);
  const[contractSpin,setcontractSpin] = useState(null);
  const[contractBet,setcontractBet] = useState(null);

  const[playerAddress,setplayerAddress] = useState(null);

  const[approved,setApproved] = useState(false);
  const[actualBet,setActualBet] = useState(null);
  const[didWin,setDidWin] = useState(null);
  const[wonAmount,setWonAmount] = useState(0);
  const[resultBox,setResultBox] = useState("hidden");
  const[winRatio,setWinRatio] = useState(null);
  const[chanceDiv,setChanceDiv] = useState(null);
  const[precision,setPrecision] = useState(null);

  const[loader,setLoader] = useState(false);

  function openModal() {
    setIsOpen(true);
  }

  function closeModal(){
    setIsOpen(false);
  }
  
  async function connectionStart(provider) {

    // Get signature
    const signer = await provider.getSigner();
    const network = await provider.getNetwork();

    const chain = network.chainId
    if ( chain !== 137 ) {
      setwrongNetwork(true);
      return
    }
  
    // Create the required contracts
    const Degen = new Contract(addDegenToken, abiErc20, signer);
    const Escrow = new Contract(addDegenEscrow, abiErc20, provider);
    const Spin = new Contract(addDegenSpinController, abiDegenSpin, signer);
    const BetToken = new Contract(addBetToken, abiErc20, signer);

    // Keep the contracts in hooks
    setcontractDegen(Degen);
    setcontractEscrow(Escrow);
    setcontractSpin(Spin);
    setcontractBet(BetToken);

    // Get the player address
    const player = provider.provider.selectedAddress;
    setplayerAddress(player);


  }

  async function updatePool() {
    // Get the current pool balance
    let poolBal = await contractSpin.pool();
    // const converPoolBal = formatEther(poolBal,"ether");
    let converPoolBal = poolBal;
    // setBalPool(converPoolBal.toString());
    setBalPool(converPoolBal);
  }

  async function getInitialData() {

    // Get the players balance of Degen tokens
    const playerBal = await contractDegen.balanceOf(playerAddress);
    // const converPlayBal = formatEther(playerBal,"ether");
    setDegBalPlayer(playerBal);

    // Get the players balance of gambling tokens
    const betBal = await contractBet.balanceOf(playerAddress);
    setBalPlayer(betBal);

    // Get the current pool balance
    let poolBal = await contractSpin.pool();
    // setBalPool(converPoolBal.toString());
    setBalPool(poolBal);

    // Get the maths and do the maths
    let chanceDivision = await contractSpin.chanceDivision();
    let winRatio = await contractSpin.winRatio();
    let precision = await contractSpin.precision();

    setChanceDiv(formatEther(chanceDivision));
    setWinRatio(formatEther(winRatio));
    setPrecision(formatEther(precision));

    // Ensure the bet amount approved
    const approvedBet = await contractBet.allowance(playerAddress, addDegenSpinController);

    // console.log(approvedBet);
    // console.log(betBal);
    if (approvedBet < betBal || betBal == 0) {

      setApproved(false);


    } else {
      
      setApproved(true);

    }
  
    contractSpin.on("BetResolved", (user, amount, won, newPoolSize, rng) => {

      setBalPool(newPoolSize);

      console.log(betBal);
      console.log(newPoolSize);

      (betBal < newPoolSize || formatEther(newPoolSize) == 0) ? setMaxBet(formatEther(betBal)) : setMaxBet(formatEther(newPoolSize));

      // If users transaction then stop loader and update win
      if (user.toUpperCase() == playerAddress.toUpperCase()) {
        setLoader(false);
        setDidWin(won);
        let winAmount = formatEther(amount);
        (won) ? setWonAmount(winAmount) : setWonAmount(0);
        setResultBox(null);
      }
    
    });


    const MaximumBetAmount = (poolBal > betBal) ? betBal : poolBal;
    setMaxBet(formatEther(MaximumBetAmount));
  }
  
  function WalletButton({ provider, loadWeb3Modal, logoutOfWeb3Modal }) {
    return (
      <WallButton
        onClick={() => {
          if (!provider) {
            loadWeb3Modal();
          } else {
            // logoutOfWeb3Modal();
          }
        }}
      >
        {!provider ? "Connect Wallet" : "Connected"}
      </WallButton>
    );
  }

  async function ApproveBet() {

    // Format the bet amount
    let bet = 999999999999;
    let ethBet = parseEther(bet.toString());

    // Approve contract
    const approvBet = await contractBet.approve(addDegenSpinController, ethBet);

      setLoader(true);

      contractBet.on("Approval", (owner, spender, value, event) => {

        // If bet > 0 set approved
        if (owner.toUpperCase() == playerAddress.toUpperCase()) {
          setApproved(true);
          //setActualBet(ethBet);
          setLoader(false);
        }
    
    });    
  }


  async function beDegen(betAmount) {

    betAmount = Math.round(betAmount*100000000000000000)/100000000000000000;

    let ethBet = parseEther(betAmount.toString())
    let rng = Math.floor(Math.random() * 100000000000000000);
    rng = parseEther(rng.toString())

    // Gamble that shit
    const degenerateBet = await contractSpin.spin(ethBet, rng);

    setLoader(true);

    // if (degenerateBet != null) {
    //   setApproved(false);
    // }

  }


  function alterBG() {
    document.getElementById('body-bg').style.backgroundImage="url('DegenBg.png')";
  }


  function doTheMath(bet, pool) {
    let betNum = 0

    if (bet == null || pool == null) {
      return betNum
    } else {
      betNum = Math.round((bet/formatEther(pool,"ether")) * 100)
      return betNum
    }

  }

  React.useEffect(() => {

    // If provider present then run initial load
    if (provider) {

      connectionStart(provider);

      setTimeout(function () {
        alterBG();
      }, 2000);

    } 
    
    if (playerAddress != null) {

      getInitialData();

    }

    setTimeout(function () {
      setResultBox("hidden");
      setDidWin(null);
    }, 4000);

  }, [playerAddress, didWin, provider]);

  return (
    <div className="app-wrap">
      <Header>
        <p className="degen-bags">YOU'RE THIS MUCH OF A DEGEN: { (balDegPlayer != null) ? formatEther(balDegPlayer,"ether") : 0}</p> 
        <div className="group">
          <Button onClick={openModal}>Info</Button>
          <WalletButton provider={provider} loadWeb3Modal={loadWeb3Modal} logoutOfWeb3Modal={logoutOfWeb3Modal} />
        </div>
        <Modal
          isOpen={modalIsOpen}
          onRequestClose={closeModal}
          contentLabel="DEGENERATES UNITE"
          style={{
            overlay: {
              backgroundColor: 'rgba(0, 0, 0, 0.3)'
            },
            content: {
              height: '40%',
              width: '40%',
              margin: 'auto',
              padding: '0',
              border: '2px solid black'
            }
          }}
        >
          <Header>
            <h2>Hello Degens</h2>
            <Button onClick={closeModal}>close</Button>
          </Header>
          <div className="modal-text">
          <div>This is a gambling game that is based on generic RTP based gambling industry mathematics.</div>
          <br />
          <div>EXCEPT, we take the house out of the equation and its only players playing against players with no fees, and minimal transactions fees as this is built on matic!</div>
          <br />
          <div>Currently there is distribution of the degen token which is 1:1 with every eth bet.</div>
          <br />
          <div>Future tokenomics: Staking to take the overflow of the reward pool daily generating REAL apy not like a <span className="degentext">degen</span> ponzi farm</div>
          </div>
        </Modal>
        <Modal
          isOpen={wrongNetwork}
          contentLabel="DEGENERATES UNITE"
          style={{
            overlay: {
              backgroundColor: 'rgba(0, 0, 0, 0.3)'
            },
            content: {
              height: '40%',
              width: '40%',
              margin: 'auto',
              padding: '0',
              border: '2px solid black',
              textAlign: 'center',
            }
          }}
        >
          <HeaderDegen>
            <h2>SILLY DEGEN</h2>
          </HeaderDegen>
          <div className="modal-text">
          <div>CHANGE TO F***ING MATIC NETWORK AND REFRESH THE PAGE YOU ABSOLUTE DEGEN</div>
          </div>
        </Modal>
      </Header>
      <Body id="body-bg">
        <div className="game-container">
          <div className="game-inner-container bets">
            BET AMOUNT <br/> { doTheMath(betAmount, balPool) + '%'} ({(betAmount != null) ? Math.round(betAmount*10000)/10000 : 0} ETH)
            <div className="bet-slider">
              <NumericInput mobile={false} className="bet-input" style={{arrowUp: {borderBottomColor: 'rgba(255, 255, 255, 1)'},arrowDown: {borderTopColor: 'rgba(255, 255, 255, 1)'}}} onChange={(newVal, valStr, comp) => setBetAmount(newVal)} step={0.0001} precision={4} min={ 0 } max={ maxBet } value={ betAmount }/>
              <div className="bet-buttons">
                <Button className="bet-button" onClick={() => setBetAmount(maxBet*0.25)}>25%</Button>
                <Button className="bet-button" onClick={() => setBetAmount(maxBet*0.5)}>50%</Button>
                <Button className="bet-button" onClick={() => setBetAmount(maxBet*0.75)}>75%</Button>
                <Button className="bet-button" onClick={() => setBetAmount(maxBet*1.0)}>100%</Button>
              </div>
            </div>
          </div>
          <div className={"game-win-box " + resultBox}>
            { didWin ? "YOU WON: " + wonAmount : "LOST! YOU DEGEN." }
          </div>
          <div className={"game-inner-container spinner " + loader}>
            <RiseLoader color={"#FFFFFF"} loading={ loader } size={25} />
          </div>
          <div className="game-inner-container pool">
            PRIZE POOL <br />
            { (balPool != null) ? Math.round(formatUnits(balPool.toString())*10000)/10000 : 0} ETH
            <br /> ({ ((Math.round((((betAmount/((balPool != null ) ? formatUnits(balPool.toString()) : 0))*chanceDiv)/precision)*1000000)/10000) > 75 ) ? 75 : (Math.round((((betAmount/((balPool != null ) ? formatUnits(balPool.toString()) : 0))*chanceDiv)/precision)*1000000)/10000)*1.2}
            % TO WIN { Math.round(((winRatio/precision)*((balPool != null ) ? formatUnits(balPool.toString()) : 0) + betAmount )*10000)/10000 })
          </div>
        </div>
        <div className="actions-container">
          <Button className="play" play onClick={() => !approved ? ApproveBet() : beDegen(betAmount)} disabled={ loader} >
            {!approved ? "APPROVE BET" : "BE A DEGEN"}
          </Button>
          <div className="degenBal">
          </div>
        </div>
      </Body>
    </div>
  );
}

export default App;
