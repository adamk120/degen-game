import React, { useState } from "react";
import { Contract } from "@ethersproject/contracts";
import { formatEther, parseEther, formatUnits, parseUnits } from "@ethersproject/units";
import { getDefaultProvider, Web3Provider } from "@ethersproject/providers";
import { useQuery } from "@apollo/react-hooks";

import { Body, Button, Header, Image, Link, WallButton } from "./components";
import logo from "./ethereumLogo.png";
import useWeb3Modal from "./hooks/useWeb3Modal";

import { addresses, abis } from "@project/contracts";
import GET_TRANSFERS from "./graphql/subgraph";

import Slider from "react-input-slider";

import { css } from "@emotion/react";
import RiseLoader from "react-spinners/PropagateLoader";

import NumericInput from 'react-numeric-input';


// Set up the address
const addDegenToken = addresses.DegenToken;
const addDegenEscrow = addresses.DegenEscrow;
const addDegenSpinController = addresses.DegenSpinController;
const addBetToken = addresses.LinkToken;

// Set up the wives
const abiErc20 = abis.erc20;
const abiDegenSpin = abis.spinController;

function App() {
  const { loading, error, data } = useQuery(GET_TRANSFERS);
  const [provider, loadWeb3Modal, logoutOfWeb3Modal] = useWeb3Modal();

  const[balEscrow,setBalEscrow] = useState(null);
  const[balPlayer,setBalPlayer] = useState(null);
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

  async function connectionStart(provider) {

    // Get signature
    const signer = provider.getSigner();

  
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
    const converPlayBal = playerBal;
    setBalPlayer(converPlayBal);

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
  
    contractSpin.on("BetResolved", (user, amount, won, newPoolSize, rng) => {

      updatePool();

      // If users transaction then stop loader and update win
      if (user.toUpperCase() == playerAddress.toUpperCase()) {
        setLoader(false);
        setDidWin(won);
        (won) ? setWonAmount(amount) : setWonAmount(0);
        setResultBox(null);
      }
    
    });

    const MaximumBetAmount = (poolBal < betBal || poolBal == 0) ? betBal : poolBal;
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

  async function ApproveBet(bet) {

    // Format the bet amount
    let ethBet = parseEther(bet.toString());

    // Approve contract
    const approvBet = await contractBet.approve(addDegenSpinController, ethBet);

    // Ensure the bet amount approved
    const approvedBet = await contractDegen.allowance(playerAddress, addDegenSpinController);

    setLoader(true);

    contractBet.on("Approval", (owner, spender, value, event) => {

      // If bet > 0 set approved
      if (owner.toUpperCase() == playerAddress.toUpperCase()) {
        setApproved(true);
        setActualBet(ethBet);
        setLoader(false);
      }
  
  });
}

  async function beDegen() {

    // Gamble that shit
    const degenerateBet = await contractSpin.spin(actualBet, actualBet);

    setLoader(true);

    if (degenerateBet != null) {
      setApproved(false);
    }

  }


  function alterBG() {
    document.getElementById('body-bg').style.backgroundImage="url('DegenBg.png')";
  }


  function doTheMath(bet, pool) {
    let betNum = 0

    if (bet == null || pool == null) {
      return betNum
    } else {
      console.log(parseEther(bet.toString()));
      console.log(pool);
      betNum = Math.round((bet/formatEther(pool,"ether")) * 100)
      return betNum
    }

  }

  React.useEffect(() => {

    // If player address is null then run the initial load
    if (!loading && !error && data && data.transfers) {

      connectionStart(provider);

      setTimeout(function () {
        alterBG();
      }, 2000);

    } 
    
    if (playerAddress != null) {

      getInitialData();

    }

    setTimeout(function () {
      console.log("activated");
      setResultBox("hidden");
      setDidWin(null);
    }, 4000);

  }, [loading, error, data, playerAddress, didWin, provider]);

  return (
    <div className="app-wrap">
      <Header>
        <p className="degen-bags">YOU'RE THIS MUCH OF A DEGEN: { (balPlayer != null) ? formatEther(balPlayer,"ether") : 0}</p> <WalletButton provider={provider} loadWeb3Modal={loadWeb3Modal} logoutOfWeb3Modal={logoutOfWeb3Modal} />
      </Header>
      <Body id="body-bg">
        <div className="game-container">
          <div className="game-inner-container bets">
            BET AMOUNT <br/> {doTheMath(betAmount, balPool) + '%'} ({(betAmount != null) ? Math.round(betAmount*10000)/10000 : 0} ETH)
            <div className="bet-slider">
              <NumericInput mobile={false} className="bet-input" style={{arrowUp: {borderBottomColor: 'rgba(255, 255, 255, 1)'},arrowDown: {borderTopColor: 'rgba(255, 255, 255, 1)'}}} onChange={(newVal, valStr, comp) => setBetAmount(newVal)} step={0.0001} precision={4} min={ 0 } max={ maxBet } value={ betAmount }/>
              <div className="bet-buttons">
                <Button className="bet-button" onClick={() => setBetAmount(maxBet*0.25)}>25%</Button>
                <Button className="bet-button" onClick={() => setBetAmount(maxBet*0.5)}>50%</Button>
                <Button className="bet-button" onClick={() => setBetAmount(maxBet*0.75)}>75%</Button>
                <Button className="bet-button" onClick={() => setBetAmount(maxBet)}>100%</Button>
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
            <br /> ({ Math.round((((betAmount/((balPool != null ) ? formatUnits(balPool.toString()) : 0))/chanceDiv)*precision)*100) }% TO WIN { Math.round((Math.round((100/(winRatio/precision)))/100)*((balPool != null ) ? formatUnits(balPool.toString()) : 0)*10000)/10000 })
          </div>
        </div>
        <div className="actions-container">
          <Button className="play" play onClick={() => !approved ? ApproveBet(betAmount) : beDegen()}>
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
