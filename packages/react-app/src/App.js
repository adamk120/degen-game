import React, { useState } from "react";
import { Contract } from "@ethersproject/contracts";
import { getDefaultProvider, Web3Provider } from "@ethersproject/providers";
import { useQuery } from "@apollo/react-hooks";

import { Body, Button, Header, Image, Link } from "./components";
import logo from "./ethereumLogo.png";
import useWeb3Modal from "./hooks/useWeb3Modal";

import { addresses, abis } from "@project/contracts";
import GET_TRANSFERS from "./graphql/subgraph";

// Set up the address
const addDegenToken = addresses.DegenToken;
const addDegenEscrow = addresses.DegenEscrow;

// Set up the wives
const abiErc20 = abis.erc20;




function App() {
  const { loading, error, data } = useQuery(GET_TRANSFERS);
  const [provider, loadWeb3Modal, logoutOfWeb3Modal] = useWeb3Modal();

  const[balEscrow,setBalEscrow] = useState(null);
  const[balPlayer,setBalPlayer] = useState(null);
  const[betAmount,setBetAmount] = useState(0);


  async function readOnChainData(provider) {
  
    // Create the required contracts
    const Degen = new Contract(addDegenToken, abiErc20, provider);
    const Escrow = new Contract(addDegenEscrow, abiErc20, provider);
  
    const player = provider.provider.selectedAddress;
  
    // Get the escrow numbers
    const escrowBal = await Degen.balanceOf(addDegenEscrow);
    setBalEscrow(escrowBal.toString());
  
    // Get the players balance of Degen tokens
    const playerBal = await Degen.balanceOf(player);
    setBalPlayer(playerBal.toString());
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
          <div className="bets">
            BET AMOUNT    
            <input className="bet-input" type="text" pattern="[0-9]*" value={ betAmount } onChange={event => setBetAmount(this) } />
          </div>
          <div className="spinner"></div>
          <div className="pool"></div>
        </div>
        <div className="actions-container">
          <Button className="play" play onClick={() => readOnChainData(provider)}>
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
