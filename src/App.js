import React, { useState } from "react";
import twitterLogo from "./assets/twitter-logo.svg";
import "./App.css";
import { AnchorProvider, Program, web3 } from "@project-serum/anchor";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import idl from "./utils/solanabackend.json";
import kp from "./keypair.json";

// Constants
const TWITTER_HANDLE = "_buildspace";
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const TEST_GIFS = [
  "https://i.giphy.com/media/eIG0HfouRQJQr1wBzz/giphy.webp",
  "https://media3.giphy.com/media/L71a8LW2UrKwPaWNYM/giphy.gif?cid=ecf05e47rr9qizx2msjucl1xyvuu47d7kf25tqt2lvo024uo&rid=giphy.gif&ct=g",
  "https://media4.giphy.com/media/AeFmQjHMtEySooOc8K/giphy.gif?cid=ecf05e47qdzhdma2y3ugn32lkgi972z9mpfzocjj6z1ro4ec&rid=giphy.gif&ct=g",
  "https://i.giphy.com/media/PAqjdPkJLDsmBRSYUp/giphy.webp",
];

// SystemProgram is a reference to the Solana runtime!
const { SystemProgram, Keypair } = web3;

// Create a keypair for the account that will hold the GIF data.
const arr = Object.values(kp._keypair.secretKey);
const secret = new Uint8Array(arr);
const baseAccount = Keypair.fromSecretKey(secret);

// Get our program's id from the IDL file.
const programID = new PublicKey(idl.metadata.address);

// Set our network to devnet.
const network = clusterApiUrl("devnet");

// Controls how we want to acknowledge when a transaction is "done".
const opts = {
  preflightCommitment: "processed",
};

const App = () => {
  const [address, setAddress] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [gifList, setGifList] = useState([]);

  const walletConnectCheck = async () => {
    try {
      const { solana } = window;
      if (solana) {
        const res = await solana.connect({ onlyIfTrusted: true });
        if (res.publicKey.toString()) {
          setAddress(res.publicKey.toString());
        } else return setAddress(null);
      } else if (!solana) {
        alert("Install Phantom Wallet");
      }
    } catch (e) {
      console.log(e);
    }
  };

  const connectWallet = async () => {
    const { solana } = window;
    if (!solana) {
      alert("Install a solana Wallet");
    } else {
      const res = await solana.connect();
      setAddress(res?.publicKey?.toString());
    }
  };

  const sendGif = async () => {
    if (inputValue.length === 0) {
      console.log("No GIF link found");
    }
    setInputValue("");
    try {
      const provider = await getProvider();
      const program = new Program(idl, programID, provider);

      await program?.rpc?.addGif(inputValue, {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
        },
      });

      console.log("GIF successfully sent to program", inputValue);

      await getGifList();
    } catch (error) {
      console.log(error);
    }
  };

  const getProvider = async () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new AnchorProvider(
      connection,
      window.solana,
      opts.preflightCommitment
    );
    return provider;
  };

  const createGifAccount = async () => {
    try {
      if (address) {
        const provider = await getProvider();
        const program = new Program(idl, programID, provider);
        console.log("ping");
        await program.rpc.startStuffOff({
          accounts: {
            baseAccount: baseAccount.publicKey,
            user: provider.wallet.publicKey,
            systemProgram: SystemProgram.programId,
          },
          signers: [baseAccount],
        });
      }
      console.log(
        "Created a new BaseAccount w/ address:",
        baseAccount.publicKey.toString()
      );
      await getGifList();
    } catch (e) {
      console.log("error creating base account", e);
    }
  };

  const getGifList = async () => {
    try {
      const provider = await getProvider();
      const program = new Program(idl, programID, provider);
      const account = await program.account.baseAccount.fetch(
        baseAccount.publicKey
      );

      console.log("got to the account", account);
      setGifList(account.gifList);
      console.log(gifList);
    } catch (e) {
      console.log(e);
      setGifList(null);
    }
  };

  const renderConnectedContainer = () => {
    if (gifList === null) {
      return (
        <div className="custom-btn">
          <div
            onClick={createGifAccount}
            className="cta-button submit-gif-button"
          >
            Do One-Time Initialization For GIF Program Account
          </div>
        </div>
        // <div onClick={createGifAccount} className="connected-container">
        //   <button className="cta-button submit-gif-button">
        //     Do One-Time Initialization For GIF Program Account
        //   </button>
        // </div>
      );
    } else
      return (
        <div className="connected-container">
          {/* input */}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              sendGif();
            }}
          >
            <input
              onChange={(e) => setInputValue(e.target.value)}
              type="text"
              placeholder="Enter gif link!"
              value={inputValue}
            />
            <div className="submit-holder">
              <button type="submit" className="cta-button submit-gif-button">
                Submit
              </button>
            </div>
          </form>
          {/* gifs */}
          <div className="gif-grid">
            {gifList.map((gif, i) => (
              <div key={i} className="gif-item">
                <img src={gif.gifLink} alt={gif} />
              </div>
            ))}
          </div>
        </div>
      );
  };

  const renderWalletConnect = () => (
    <div className="custom-btn">
      <div onClick={connectWallet} className="connect-wallet-button cta-button">
        Connect Wallet
      </div>
    </div>
  );

  React.useEffect(() => {
    walletConnectCheck();
    if (address) {
      console.log(address);
      console.log("Fetching GIFs.......");
      getGifList();
      console.log(gifList);
    }
  }, [address]);

  React.useEffect(() => {
    if (address) {
      gifList.map((i) => {
        console.log(i.userAddress.toString());
      });
    }
  }, [gifList]);

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header">🖼 GIF Portal</p>
          <p className="sub-text">
            View your GIF collection in the metaverse ✨
          </p>
          {!address && renderWalletConnect()}
          {address && renderConnectedContainer()}
        </div>
      </div>
      <div className="footer-container">
        <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
        <a
          className="footer-text"
          href={TWITTER_LINK}
          target="_blank"
          rel="noreferrer"
        >{`built on @${TWITTER_HANDLE}`}</a>
      </div>
    </div>
  );
};

export default App;
