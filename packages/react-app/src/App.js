import React, { useState } from "react";
import { Contract } from "@ethersproject/contracts";
import { formatEther, parseEther, formatUnits, parseUnits } from "@ethersproject/units";
import { getDefaultProvider, Web3Provider } from "@ethersproject/providers";
import { useQuery } from "@apollo/react-hooks";

import { Body, Button, Header, Image, Link } from "./components";
import logo from "./ethereumLogo.png";
import useWeb3Modal from "./hooks/useWeb3Modal";

import { addresses, abis } from "@project/contracts";
import GET_TRANSFERS from "./graphql/subgraph";

import Slider from "react-input-slider";

// Set up the address
const addDegenToken = addresses.DegenToken;
const addDegenEscrow = addresses.DegenEscrow;
const addDegenSpinController = addresses.DegenSpinController;

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

  const[playerAddress,setplayerAddress] = useState(null);

  const[approved,setApproved] = useState(false);
  const[actualBet,setActualBet] = useState(null);

  async function connectionStart(provider) {

    // Get signature
    const signer = provider.getSigner();

  
    // Create the required contracts
    const Degen = new Contract(addDegenToken, abiErc20, signer);
    const Escrow = new Contract(addDegenEscrow, abiErc20, provider);
    const Spin = new Contract(addDegenSpinController, abiDegenSpin, signer);

    // Keep the contracts in hooks
    setcontractDegen(Degen);
    setcontractEscrow(Escrow);
    setcontractSpin(Spin);

    // Get the player address
    const player = provider.provider.selectedAddress;
    setplayerAddress(player);

  }

  async function getInitialData() {

    // Get the escrow numbers
    // const escrowBal = await contractDegen.balanceOf(addDegenEscrow);
    // setBalEscrow(escrowBal.toString());
  
    // Get the players balance of Degen tokens
    const playerBal = await contractDegen.balanceOf(playerAddress);
    // const converPlayBal = formatEther(playerBal,"ether");
    const converPlayBal = playerBal;
    setBalPlayer(converPlayBal);

    // Get the current pool balance
    const poolBal = await contractSpin.pool();
    // const converPoolBal = formatEther(poolBal,"ether");
    const converPoolBal = poolBal;
    // setBalPool(converPoolBal.toString());
    setBalPool(converPoolBal);

    const MaximumBetAmount = (converPoolBal.toString() >= converPlayBal.toString()) ? converPoolBal : converPlayBal;
    setMaxBet(MaximumBetAmount);


  }
  
  function WalletButton({ provider, loadWeb3Modal, logoutOfWeb3Modal }) {
    return (
      <Button
        onClick={() => {
          if (!provider) {
            loadWeb3Modal();
          } else {
            logoutOfWeb3Modal();
          }
        }}
      >
        {!provider ? "Connect Wallet" : "Disconnect Wallet"}
      </Button>
    );
  }

  async function ApproveBet(bet) {

    // Format the bet amount
    let betAm = formatUnits(bet.toString());
    let ethBet = parseEther(betAm);

    // Approve contract
    const approvDegen = await contractDegen.approve(addDegenSpinController, ethBet);

    // Ensure the bet amount approved
    const approvedBet = await contractDegen.allowance(playerAddress, addDegenSpinController);
    let finalBet = formatEther(approvedBet);

    // If bet > 0 set approved
    if (finalBet > 0) {
      setApproved(true);
      setActualBet(ethBet);
    }
  
  }

  async function beDegen(bet) {

    // Format the bet amount
    let betAm = formatUnits(bet.toString());
    let ethBet = parseEther(betAm);

    // Gamble that shit
    const degenerateBet = await contractSpin.spin(ethBet, ethBet);

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
      betNum = Math.round((formatUnits(bet.toString())/formatEther(pool,"ether")) * 100)
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

  }, [loading, error, data, playerAddress]);

  return (
    <div className="app-wrap">
      <Header>
      <p className="degen-bags">YOU'RE THIS MUCH OF A DEGEN: { (balPlayer != null) ? formatEther(balPlayer,"ether") : 0}</p> <WalletButton provider={provider} loadWeb3Modal={loadWeb3Modal} logoutOfWeb3Modal={logoutOfWeb3Modal} />
      </Header>
      <Body id="body-bg">
        <div className="game-container">
          <div className="game-inner-container bets">
            BET AMOUNT <br/> {doTheMath(betAmount, balPool) + '%'} <br />({(betAmount != null) ? formatUnits(betAmount.toString()) : 0} ETH)
            <div className="bet-slider">
              <Slider
                  axis="x"
                  xstep={1}
                  xmin={0}
                  xmax={ maxBet }
                  x={ betAmount }
                  styles={{
                    track: {
                      backgroundColor: '#FAAF40'
                    },
                    active: {
                      backgroundColor: '#618b2a'
                    },
                    thumb: {
                      width: 30,
                      height: 30,
                      opacity: 0.8
                    }
                  }}
                  onChange={({ x }) => setBetAmount(x)}
                />
            </div>
          </div>
          <div className="game-inner-container spinner">
            SPINNER HERE
          </div>
          <div className="game-inner-container pool">
            PRIZE POOL <br />
            { (balPool != null) ? formatEther(balPool,"ether") : 0} ETH
          </div>
        </div>
        <div className="actions-container">
          <Button className="play" play onClick={() => !approved ? ApproveBet(betAmount) : beDegen(betAmount)}>
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
