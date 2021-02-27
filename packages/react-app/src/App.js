import React, { useState } from "react";
import { Contract } from "@ethersproject/contracts";
import { formatEther } from "@ethersproject/units";
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


  async function readOnChainData(provider) {

    // Get signature
    const signer = provider.getSigner();
  
    // Create the required contracts
    const Degen = new Contract(addDegenToken, abiErc20, signer);
    const Escrow = new Contract(addDegenEscrow, abiErc20, provider);
    const Spin = new Contract(addDegenSpinController, abiDegenSpin, signer);

    const player = provider.provider.selectedAddress;

    // // Get signature
    // const signer = provider.getSigner();
    // const signature = await signer.signMessage("Hi Cunt");


    // Get the escrow numbers
    const escrowBal = await Degen.balanceOf(addDegenEscrow);
    setBalEscrow(escrowBal.toString());
  
    // Get the players balance of Degen tokens
    const playerBal = await Degen.balanceOf(player);
    const converPlayBal = formatEther(playerBal,"ether");
    setBalPlayer(converPlayBal.toString());

    // Get the current pool balance
    const poolBal = await Spin.pool();
    const converPoolBal = formatEther(poolBal,"ether");
    setBalPool(converPoolBal.toString());

    const MaximumBetAmount = (balPool >= playerBal) ? balPool : playerBal;
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

  async function ApproveBet(provider) {

    // Get signature
    const signer = provider.getSigner();

    const player = provider.provider.selectedAddress;


    // Create the required contracts
    const Degen = new Contract(addDegenToken, abiErc20, signer);

    // Approve contract
    const approvDegen = await Degen.approve(player, "1000000000000000000");

  }


  function alterBG() {
    document.getElementById('body-bg').style.backgroundImage="url('DegenBg.png')";
  }

  React.useEffect(() => {
    if (!loading && !error && data && data.transfers) {
      readOnChainData(provider);

      setTimeout(function () {
        alterBG();
      }, 2000);
    }
  }, [loading, error, data]);

  return (
    <div className="app-wrap">
      <Header>
      <p className="degen-bags">YOU'RE THIS MUCH OF A DEGEN: { balPlayer }</p> <WalletButton provider={provider} loadWeb3Modal={loadWeb3Modal} logoutOfWeb3Modal={logoutOfWeb3Modal} />
      </Header>
      <Body id="body-bg">
        <div className="game-container">
          <div className="game-inner-container bets">
            BET AMOUNT <br/> {betAmount + '%'} <br />({ betAmount/100 * balPool } ETH)
            <div className="bet-slider">
              <Slider
                  axis="x"
                  xstep={1}
                  xmin={0}
                  xmax={ 100 }
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
                  onChange={({ x }) => setBetAmount(parseFloat(x.toFixed(2)))}
                />
            </div>
          </div>
          <div className="game-inner-container spinner">
            SPINNER HERE
          </div>
          <div className="game-inner-container pool">
            PRIZE POOL <br />
            { balPool } ETH
          </div>
        </div>
        <div className="actions-container">
          <Button className="play" play onClick={() => ApproveBet(provider)}>
            BE A DEGEN
          </Button>
          <div className="degenBal">
          </div>
        </div>
      </Body>
    </div>
  );
}

export default App;
