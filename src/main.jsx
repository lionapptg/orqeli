
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  WagmiProvider,
  useAccount,
  useReadContract,
  useWriteContract
} from 'wagmi';
import { bsc } from 'wagmi/chains';
import {
  getDefaultConfig as getRainbowConfig,
  RainbowKitProvider,
  ConnectButton
} from '@rainbow-me/rainbowkit';
import {
  metaMaskWallet,
  trustWallet,
  binanceWallet,
  rabbyWallet,
  okxWallet,
  bitgetWallet,
  safepalWallet,
  coinbaseWallet,
  tokenPocketWallet,
  oneInchWallet,
  ledgerWallet,
  phantomWallet,
  zerionWallet,
  walletConnectWallet,
  injectedWallet
} from '@rainbow-me/rainbowkit/wallets';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { parseEther } from 'viem';
import '@rainbow-me/rainbowkit/styles.css';
import './style.css';

const API_BASE = 'https://orqeli-api.mizahhesabimm.workers.dev';
const X_PROFILE_URL = 'https://x.com/OrqeliNFT';
const X_CAMPAIGN_URL = 'https://x.com/OrqeliNFT/status/2116580426743509378';

const projectId =
  import.meta.env.VITE_WALLETCONNECT_PROJECT_ID ||
  'YOUR_WALLETCONNECT_PROJECT_ID';

const config = getRainbowConfig({
  appName: 'ORQELI',
  projectId,
  chains: [bsc],
  ssr: false,
  wallets: [
    {
      groupName: 'Popular wallets',
      wallets: [
        metaMaskWallet,
        trustWallet,
        binanceWallet,
        rabbyWallet,
        okxWallet,
        bitgetWallet,
        safepalWallet,
        coinbaseWallet
      ]
    },
    {
      groupName: 'More wallets',
      wallets: [
        tokenPocketWallet,
        oneInchWallet,
        ledgerWallet,
        phantomWallet,
        zerionWallet,
        walletConnectWallet,
        injectedWallet
      ]
    }
  ]
});

const queryClient = new QueryClient();

const NFT_CONTRACT = '0xc141831d7caa2c7cc8a3ddf4050ed866bde97655';

const NFT_ABI = [
  {
    type: 'function',
    name: 'currentPhase',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }]
  },
  {
    type: 'function',
    name: 'totalMinted',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    type: 'function',
    name: 'owner',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }]
  },
  {
    type: 'function',
    name: 'mintOG',
    stateMutability: 'payable',
    inputs: [
      { name: 'proof', type: 'bytes32[]' }
    ],
    outputs: []
  },
  {
    type: 'function',
    name: 'mintRegular',
    stateMutability: 'payable',
    inputs: [
      { name: 'proof', type: 'bytes32[]' }
    ],
    outputs: []
  },
  {
    type: 'function',
    name: 'mintPublic',
    stateMutability: 'payable',
    inputs: [],
    outputs: []
  },
  {
    type: 'function',
    name: 'openOG',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: []
  },
  {
    type: 'function',
    name: 'openRegular',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: []
  },
  {
    type: 'function',
    name: 'openPublic',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: []
  },
  {
    type: 'function',
    name: 'closeMint',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: []
  }
];

const tiers = [
  ['Common', '1,100', '55%', 'common', '#b9c2ce', 'Quiet beginnings. A familiar soul from another world.'],
  ['Uncommon', '500', '25%', 'uncommon', '#48d6a0', 'Rooted in nature, touched by something ancient.'],
  ['Rare', '250', '12.5%', 'rare', '#53c9ff', 'A celestial presence beneath a veil of stars.'],
  ['Epic', '120', '6%', 'epic', '#b98aff', 'Forged in shadow. Charged with violet energy.'],
  ['Legendary', '30', '1.5%', 'legendary', '#eac16e', 'The rarest light in the ORQELI universe.']
];

const mintPhases = [
  {
    id: 1,
    title: 'OG WHITELIST',
    supply: '200 SUPPLY',
    price: '0.0018',
    functionName: 'mintOG',
    description: 'OG members mint first. This phase must finish before Regular WL mint begins.'
  },
  {
    id: 2,
    title: 'REGULAR WHITELIST',
    supply: '800 SUPPLY',
    price: '0.0035',
    functionName: 'mintRegular',
    description: 'Regular WL members mint after the OG allocation is completed.'
  },
  {
    id: 3,
    title: 'PUBLIC MINT',
    supply: '1,000 SUPPLY',
    price: '0.005',
    functionName: 'mintPublic',
    description: 'After the whitelist phases, remaining NFTs become available to everyone.'
  }
];

async function readResponse(response) {
  const raw = await response.text();
  let data;

  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    throw new Error(`API geçersiz yanıt döndürdü (HTTP ${response.status}).`);
  }

  if (!response.ok) {
    throw new Error(data.error || `API isteği başarısız (HTTP ${response.status}).`);
  }

  return data;
}

function App() {
  const account = useAccount();
  const { writeContractAsync } = useWriteContract();

  const [wallet, setWallet] = useState('');
  const [xUsername, setXUsername] = useState('');
  const [tasksConfirmed, setTasksConfirmed] = useState(false);

  const [busy, setBusy] = useState(false);
  const [mintBusy, setMintBusy] = useState(false);
  const [adminBusy, setAdminBusy] = useState(false);
  const [status, setStatus] = useState('');

  const isAdminRoute =
    new URLSearchParams(window.location.search).get('admin') === '1';

  const phaseRead = useReadContract({
    address: NFT_CONTRACT,
    abi: NFT_ABI,
    functionName: 'currentPhase',
    chainId: 56,
    query: { refetchInterval: 10000 }
  });

  const mintedRead = useReadContract({
    address: NFT_CONTRACT,
    abi: NFT_ABI,
    functionName: 'totalMinted',
    chainId: 56,
    query: { refetchInterval: 10000 }
  });

  const ownerRead = useReadContract({
    address: NFT_CONTRACT,
    abi: NFT_ABI,
    functionName: 'owner',
    chainId: 56,
    query: { refetchInterval: 30000 }
  });

  const chainPhase =
    phaseRead.data === undefined ? null : Number(phaseRead.data);

  const totalMinted =
    mintedRead.data === undefined ? null : Number(mintedRead.data);

  const ownerAddress = ownerRead.data;

  const isOwner =
    Boolean(account.address && ownerAddress) &&
    account.address.toLowerCase() === ownerAddress.toLowerCase();

  const isCorrectNetwork = account.chainId === 56;

  const [wlStatus, setWlStatus] = useState({
    verified: 0,
    capacity: 1000,
    open: true
  });

  useEffect(() => {
    let active = true;

    fetch(`${API_BASE}/api/status`)
      .then(readResponse)
      .then(data => {
        if (active) setWlStatus(data);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  async function applyWhitelist() {
    const cleanWallet = wallet.trim();

    if (!/^0x[a-fA-F0-9]{40}$/.test(cleanWallet)) {
      return setStatus('Please enter a valid wallet address.');
    }

    if (!xUsername.trim()) {
      return setStatus('Enter your X username.');
    }

    if (!tasksConfirmed) {
      return setStatus('Please confirm that you completed the X tasks.');
    }

    if (!wlStatus.open) {
      return setStatus('Whitelist applications are closed.');
    }

    setBusy(true);
    setStatus('');

    try {
      const response = await fetch(`${API_BASE}/api/whitelist/apply`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          wallet: cleanWallet,
          xUsername: xUsername.trim().replace(/^@/, ''),
          tasksConfirmed: true
        })
      });

      const result = await readResponse(response);

      setStatus(
        `Application received! Rank: #${result.rank} · ${result.tier} WL`
      );

      const statusResponse = await fetch(`${API_BASE}/api/status`);
      const updated = await readResponse(statusResponse);
      setWlStatus(updated);
    } catch (error) {
      setStatus(
        error?.message ||
        'An unexpected error occurred while submitting your application.'
      );
    } finally {
      setBusy(false);
    }
  }

  async function mint(phase) {
    if (!account.address) {
      return setStatus('Connect your wallet first.');
    }

    if (!isCorrectNetwork) {
      return setStatus('Please switch to BNB Smart Chain (Chain ID 56).');
    }

    if (chainPhase !== phase.id) {
      return setStatus('This mint phase is not currently open.');
    }

    setMintBusy(true);
    setStatus('');

    try {
      let args = [];

      if (phase.id === 1 || phase.id === 2) {
        const proofUrl =
          `${API_BASE}/api/whitelist/proof?wallet=${encodeURIComponent(account.address)}`;

        const proofResponse = await fetch(proofUrl);
        const proofResult = await readResponse(proofResponse);

        if (!Array.isArray(proofResult.proof)) {
          throw new Error('Whitelist proof could not be found for this wallet.');
        }

        args = [proofResult.proof];
      }

      const hash = await writeContractAsync({
        address: NFT_CONTRACT,
        abi: NFT_ABI,
        functionName: phase.functionName,
        args,
        value: parseEther(phase.price),
        chainId: 56
      });

      setStatus(`Mint transaction submitted: ${hash}`);

      await phaseRead.refetch();
      await mintedRead.refetch();
    } catch (error) {
      setStatus(error?.shortMessage || error?.message || 'Mint failed.');
    } finally {
      setMintBusy(false);
    }
  }

  async function adminAction(functionName, label) {
    if (!account.address) {
      return setStatus('Connect the owner wallet first.');
    }

    if (!isCorrectNetwork) {
      return setStatus('Switch to BNB Smart Chain first.');
    }

    if (!isOwner) {
      return setStatus('This wallet is not the contract owner.');
    }

    setAdminBusy(true);
    setStatus('');

    try {
      const hash = await writeContractAsync({
        address: NFT_CONTRACT,
        abi: NFT_ABI,
        functionName,
        args: [],
        chainId: 56
      });

      setStatus(`${label} transaction submitted: ${hash}`);

      await phaseRead.refetch();
      await mintedRead.refetch();
    } catch (error) {
      setStatus(error?.shortMessage || error?.message || 'Admin action failed.');
    } finally {
      setAdminBusy(false);
    }
  }

  return (
    <>
      <header>
        <a className="brand" href="#top">
          <span>✧</span> ORQELI
        </a>

        <nav>
          <a href="#about">ABOUT</a>
          <a href="#souls">CHARACTERS</a>
          <a href="#whitelist">WHITELIST</a>
          <a href="#mint">MINT</a>
          <a href="#faq">FAQ</a>
        </nav>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-bg"></div>

          <div className="hero-copy">
            <p className="eyebrow">FIVE SOULS. ONE LEGEND.</p>
            <h1>ORQELI</h1>
            <p className="sub">NFT COLLECTION</p>

            <p className="intro">
              Five unique souls. Five different paths.
              <br />
              One universe. ORQELI.
            </p>

            <a className="goldbtn" href="#whitelist">
              JOIN THE WHITELIST <b>↗</b>
            </a>
          </div>

          <div className="hero-crew">
            {['common', 'epic', 'legendary', 'rare', 'uncommon'].map(n => (
              <img
                key={n}
                src={`/artwork/${n}.png`}
                alt={`${n} ORQELI character`}
              />
            ))}
          </div>

          <div className="hero-note">
            BUILT ON BNB SMART CHAIN
          </div>
        </section>

        <section className="ticker">
          <span>2,000 UNIQUE NFTs</span>
          <i>✦</i>
          <span>5 RARITY TIERS</span>
          <i>✦</i>
          <span>BNB SMART CHAIN</span>
          <i>✦</i>
          <span>ONE UNIVERSE</span>
        </section>

        <section className="about" id="about">
          <div>
            <p className="eyebrow">THE COLLECTION</p>
            <h2>
              Small beings.
              <br />
              <em>Infinite character.</em>
            </h2>
          </div>

          <p>
            ORQELI is a limited collection of 2,000 original characters.
            Each NFT carries its own identity and rarity. Discover the five
            souls and find your place in the universe.
          </p>

          <div className="stats">
            <div>
              <b>2,000</b>
              <small>MAXIMUM SUPPLY</small>
            </div>
            <div>
              <b>05</b>
              <small>RARITY LEVELS</small>
            </div>
            <div>
              <b>BNB</b>
              <small>BLOCKCHAIN</small>
            </div>
          </div>
        </section>

        <section className="souls" id="souls">
          <div className="sectionhead">
            <div>
              <p className="eyebrow">DISCOVER THE TIERS</p>
              <h2>
                Five forms. <em>One universe.</em>
              </h2>
            </div>

            <p>
              Every ORQELI carries a different presence. Which one will find you?
            </p>
          </div>

          <div className="cards">
            {tiers.map(([name, count, pct, file, color, desc]) => (
              <article
                className="tier"
                key={name}
                style={{ '--tier': color }}
              >
                <div className="tierimage">
                  <img
                    src={`/artwork/${file}.png`}
                    alt={`${name} ORQELI NFT`}
                  />
                </div>

                <div className="tierinfo">
                  <div>
                    <span>{name.toUpperCase()}</span>
                    <b>{pct}</b>
                  </div>

                  <p>{desc}</p>
                  <small>{count} NFTs</small>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="portal" id="whitelist">
          <div className="portalcopy">
            <p className="eyebrow">ORQELI WHITELIST · FREE ENTRY</p>

            <h2>
              Your journey
              <br />
              <em>starts here.</em>
            </h2>

            <p>
              Joining the whitelist is completely free. Enter your wallet
              address manually, complete the community tasks and submit
              one application. A whitelist spot gives you access to a future
              paid mint phase — it does not mean a free NFT.
            </p>

            <div className="rules">
              <div>
                <b>01</b>
                <span>
                  <strong>Enter your wallet address</strong>
                  <small>Use the wallet you intend to mint with.</small>
                </span>
              </div>

              <div>
                <b>02</b>
                <span>
                  <strong>Complete the X tasks</strong>
                  <small>Follow, like and repost the official campaign post.</small>
                </span>
              </div>

              <div>
                <b>03</b>
                <span>
                  <strong>Submit your free application</strong>
                  <small>No payment or mint is required to apply.</small>
                </span>
              </div>

              <div>
                <b>04</b>
                <span>
                  <strong>Receive your WL tier</strong>
                  <small>
                    First 200 valid entries: OG WL. Next 800: Regular WL.
                  </small>
                </span>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="paneltop">
              <span>WHITELIST PORTAL</span>
              <i>✦ FREE APPLICATION</i>
            </div>

            <h3>Get on the list</h3>

            <div className="wl-counter">
              <b>{wlStatus.verified}</b>
              <span> / {wlStatus.capacity} WHITELIST PLACES FILLED</span>
            </div>

            <label>X USERNAME</label>
            <input
              placeholder="@yourusername"
              value={xUsername}
              onChange={e => setXUsername(e.target.value)}
            />

            <label>WALLET ADDRESS</label>
            <input
              placeholder="0x..."
              value={wallet}
              onChange={e => setWallet(e.target.value)}
              spellCheck="false"
              autoComplete="off"
            />

            <div className="tasklinks">
              <a
                href={X_PROFILE_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                ↗ Follow on X
              </a>

              <a
                href={X_CAMPAIGN_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                ♡ Like campaign post
              </a>

              <a
                href={X_CAMPAIGN_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                ⤴ Repost campaign post
              </a>
            </div>

            <label className="task-confirm">
              <input
                type="checkbox"
                checked={tasksConfirmed}
                onChange={e => setTasksConfirmed(e.target.checked)}
              />
              <span>I confirm that I completed the X tasks above.</span>
            </label>

            <button
              className="goldbtn wide"
              disabled={busy || !wlStatus.open}
              onClick={applyWhitelist}
            >
              {busy
                ? 'SUBMITTING…'
                : wlStatus.open
                  ? 'VERIFY TASKS & APPLY'
                  : 'WHITELIST FULL'}
            </button>

            <p className="fine">
              Applying is free. One X account per wallet. Duplicate and
              suspicious applications may be rejected. A WL spot grants
              access to its scheduled paid mint phase, not a free NFT.
            </p>
          </div>
        </section>

        <section className="mint" id="mint">
          <div>
            <p className="eyebrow">THE MINT JOURNEY</p>

            <h2>
              Three stages.
              <br />
              <em>One collection.</em>
            </h2>

            <p>
              Whitelist entry is free. Paid minting follows three sequential
              phases: OG, Regular and Public. Each phase is controlled by
              the smart contract.
            </p>

            <p className="mint-note">
              Connect your wallet only after the relevant mint phase opens.
              Minting is available only while that phase is live on-chain.
            </p>
          </div>

          <div className="mintbox mint-roadmap">
            {mintPhases.map((phase, index) => {
              const live = chainPhase === phase.id;
              const completed =
                chainPhase !== null && chainPhase > phase.id;

              const enabled =
                live &&
                Boolean(account.address) &&
                isCorrectNetwork &&
                !mintBusy;

              return (
                <React.Fragment key={phase.id}>
                  <div className={`phase-card ${phase.id === 1 ? 'phase-og' : ''}`}>
                    <div className="phase-heading">
                      <span>PHASE 0{phase.id}</span>
                      <b>{phase.supply}</b>
                    </div>

                    <h3>{phase.title}</h3>
                    <p>{phase.description}</p>

                    <div className="phase-price">
                      <span>MINT PRICE</span>
                      <strong>{phase.price} BNB</strong>
                    </div>

                    <small>
                      {completed
                        ? 'COMPLETED'
                        : live
                          ? 'LIVE ON-CHAIN'
                          : chainPhase === null
                            ? (phaseRead.isError
                              ? 'STATUS UNAVAILABLE'
                              : 'READING CONTRACT…')
                            : chainPhase === 0
                              ? 'NOT OPEN'
                              : 'LOCKED · PREVIOUS PHASE'}
                    </small>

                    {live ? (
                      <>
                        <div className="phase-wallet">
                          <ConnectButton
                            chainStatus="none"
                            showBalance={false}
                          />
                        </div>

                        {account.address && !isCorrectNetwork && (
                          <p className="fine">
                            Switch to BNB Smart Chain to mint.
                          </p>
                        )}

                        <button
                          className="goldbtn wide"
                          disabled={!enabled}
                          onClick={() => mint(phase)}
                        >
                          {mintBusy
                            ? 'PROCESSING…'
                            : !account.address
                              ? 'CONNECT WALLET TO MINT'
                              : !isCorrectNetwork
                                ? 'WRONG NETWORK'
                                : 'MINT NOW'}
                        </button>
                      </>
                    ) : (
                      <button className="goldbtn wide" disabled>
                        {completed
                          ? 'PHASE COMPLETED'
                          : 'MINT NOT OPEN'}
                      </button>
                    )}
                  </div>

                  {index !== mintPhases.length - 1 && (
                    <div className="phase-connector">↓</div>
                  )}
                </React.Fragment>
              );
            })}

            <p className="fine">
              BNB Smart Chain · Contract:{' '}
              <a
                href={`https://bscscan.com/address/${NFT_CONTRACT}`}
                target="_blank"
                rel="noreferrer"
              >
                View on BscScan ↗
              </a>
              {totalMinted !== null
                ? ` · ${totalMinted.toLocaleString()} / 2,000 minted`
                : ' · Supply data loading'}.
              Phase status refreshes automatically.
            </p>
          </div>
        </section>

        {isAdminRoute && (
          <section className="admin-section">
            {isOwner ? (
              <div className="panel admin-panel">
                <div className="paneltop">
                  <span>ORQELI ADMIN PANEL</span>
                  <i>✦ OWNER VERIFIED</i>
                </div>

                <h3>Contract controls</h3>

                <p className="fine">
                  Connected wallet matches the smart contract owner.
                  Use these controls to change the live mint phase.
                </p>

                <div className="admin-wallet">
                  <span>OWNER WALLET</span>
                  <code>{account.address}</code>
                </div>

                <div className="admin-current">
                  CURRENT PHASE:{' '}
                  {chainPhase === null
                    ? 'LOADING'
                    : ['CLOSED', 'OG', 'REGULAR', 'PUBLIC'][chainPhase] || 'UNKNOWN'}
                </div>

                <div className="admin-actions">
                  <button
                    className="goldbtn wide"
                    disabled={adminBusy}
                    onClick={() => adminAction('openOG', 'Open OG')}
                  >
                    OPEN OG MINT
                  </button>

                  <button
                    className="goldbtn wide"
                    disabled={adminBusy}
                    onClick={() => adminAction('openRegular', 'Open Regular')}
                  >
                    OPEN REGULAR MINT
                  </button>

                  <button
                    className="goldbtn wide"
                    disabled={adminBusy}
                    onClick={() => adminAction('openPublic', 'Open Public')}
                  >
                    OPEN PUBLIC MINT
                  </button>

                  <button
                    className="goldbtn wide admin-close"
                    disabled={adminBusy}
                    onClick={() => adminAction('closeMint', 'Close mint')}
                  >
                    CLOSE MINT
                  </button>
                </div>
              </div>
            ) : (
              <div className="panel admin-panel">
                <div className="paneltop">
                  <span>ORQELI ADMIN PANEL</span>
                  <i>✦ OWNER ACCESS</i>
                </div>

                <h3>Owner wallet required</h3>

                <p className="fine">
                  Connect the contract owner wallet to access the admin controls.
                </p>

                <ConnectButton
                  chainStatus="none"
                  showBalance={false}
                />

                {account.address && ownerAddress && !isOwner && (
                  <p className="fine">
                    This connected wallet is not the contract owner.
                  </p>
                )}

                {ownerRead.isError && (
                  <p className="fine">
                    Could not read the contract owner. Check the contract connection.
                  </p>
                )}
              </div>
            )}
          </section>
        )}

        <section className="faq" id="faq">
          <p className="eyebrow">NEED TO KNOW</p>
          <h2>
            Frequently asked <em>questions.</em>
          </h2>

          <details>
            <summary>Is joining the whitelist free?</summary>
            <p>
              Yes. Submitting a whitelist application is completely free.
              No BNB payment or NFT mint is required to apply.
            </p>
          </details>

          <details>
            <summary>Does whitelist access include a free NFT?</summary>
            <p>
              No. A whitelist spot grants access to a reserved, paid mint
              phase. The NFT itself must be minted at the listed phase price.
            </p>
          </details>

          <details>
            <summary>What is the mint order?</summary>
            <p>
              OG WL mints first (200 allocations), then Regular WL
              (800 allocations), and finally Public Mint opens for the
              remaining supply. Each phase waits for the previous phase
              to finish.
            </p>
          </details>

          <details>
            <summary>What are the planned mint prices?</summary>
            <p>
              Prices are 0.0018 BNB for OG WL, 0.0035 BNB for
              Regular WL and 0.005 BNB for Public Mint.
            </p>
          </details>

          <details>
            <summary>Which network does ORQELI use?</summary>
            <p>
              BNB Smart Chain. Supported EVM wallets can connect through
              the wallet selector.
            </p>
          </details>

          <details>
            <summary>Can I apply more than once?</summary>
            <p>
              No. One X account is paired with one wallet. Duplicate
              applications are not accepted.
            </p>
          </details>
        </section>
      </main>

      <footer>
        <a className="brand" href="#top">✧ ORQELI</a>
        <span>FIVE SOULS. ONE LEGEND.</span>
        <small>© 2026 ORQELI. ALL RIGHTS RESERVED.</small>
      </footer>

      {status && (
        <div className="toast" onClick={() => setStatus('')}>
          {status} <b>×</b>
        </div>
      )}
    </>
  );
}

createRoot(document.getElementById('root')).render(
  <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      <RainbowKitProvider>
        <App />
      </RainbowKitProvider>
    </QueryClientProvider>
  </WagmiProvider>
);
