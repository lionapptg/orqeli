import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  WagmiProvider, useAccount, useSignMessage
} from 'wagmi';
import { bsc } from 'wagmi/chains';
import {
  getDefaultConfig as getRainbowConfig,
  RainbowKitProvider, ConnectButton
} from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@rainbow-me/rainbowkit/styles.css';
import './style.css';

const API_BASE = 'https://orqeli-api.mizahhesabimm.workers.dev';
const X_PROFILE_URL = '';
const X_CAMPAIGN_URL = '';
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_WALLETCONNECT_PROJECT_ID';
const config = getRainbowConfig({
  appName: 'ORQELI',
  projectId,
  chains: [bsc],
  ssr: false
});
const queryClient = new QueryClient();

const tiers = [
  ['Common', '1,100', '55%', 'common', '#b9c2ce', 'Quiet beginnings. A familiar soul from another world.'],
  ['Uncommon', '500', '25%', 'uncommon', '#48d6a0', 'Rooted in nature, touched by something ancient.'],
  ['Rare', '250', '12.5%', 'rare', '#53c9ff', 'A celestial presence beneath a veil of stars.'],
  ['Epic', '120', '6%', 'epic', '#b98aff', 'Forged in shadow. Charged with violet energy.'],
  ['Legendary', '30', '1.5%', 'legendary', '#eac16e', 'The rarest light in the ORQELI universe.']
];

async function readResponse(response) {
  const raw = await response.text();
  let data;
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    throw new Error(`API geçersiz yanıt döndürdü (HTTP ${response.status}).`);
  }
  if (!response.ok) throw new Error(data.error || `API isteği başarısız (HTTP ${response.status}).`);
  return data;
}

function App() {
  const account = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [wallet, setWallet] = useState('');
  const [xUsername, setXUsername] = useState('');
  const [tasksConfirmed, setTasksConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [wlStatus, setWlStatus] = useState({ verified: 0, capacity: 1000, open: true });

  useEffect(() => setWallet(account.address || ''), [account.address]);

  useEffect(() => {
    let active = true;
    fetch(`${API_BASE}/api/status`)
      .then(readResponse)
      .then(data => { if (active) setWlStatus(data); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  async function applyWhitelist() {
    if (!account.address) return setStatus('Önce cüzdanını bağla.');
    if (account.chainId !== 56) return setStatus('Lütfen Rabby üzerinden BNB Smart Chain ağına geç.');
    if (!xUsername.trim()) return setStatus('X kullanıcı adını gir.');
    if (!tasksConfirmed) return setStatus('Önce X görevlerini tamamladığını onayla.');
    if (!wlStatus.open) return setStatus('Whitelist başvuruları doldu.');

    setBusy(true);
    setStatus('');
    try {
      const challengeResponse = await fetch(`${API_BASE}/api/whitelist/challenge`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ wallet: account.address })
      });
      const challenge = await readResponse(challengeResponse);
      if (!challenge.message) throw new Error('Worker imza mesajı döndürmedi.');

      const signature = await signMessageAsync({ message: challenge.message });
      const applyResponse = await fetch(`${API_BASE}/api/whitelist/apply`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          wallet: account.address,
          xUsername: xUsername.trim().replace(/^@/, ''),
          tasksConfirmed: true,
          signature
        })
      });
      const result = await readResponse(applyResponse);
      setStatus(`Başvurun alındı! Sıra: #${result.rank} · ${result.tier} WL`);
      const statusResponse = await fetch(`${API_BASE}/api/status`);
      const updated = await readResponse(statusResponse);
      setWlStatus(updated);
    } catch (error) {
      setStatus(error?.message || 'Başvuru sırasında beklenmeyen bir hata oluştu.');
    } finally {
      setBusy(false);
    }
  }

  const openX = (url) => {
    if (!url) {
      setStatus('X bağlantısı henüz eklenmedi. Kampanya başladığında burada olacak.');
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return <>
    <header>
      <a className="brand" href="#top"><span>✧</span> ORQELI</a>
      <nav>
        <a href="#about">ABOUT</a><a href="#souls">CHARACTERS</a>
        <a href="#whitelist">WHITELIST</a><a href="#mint">MINT</a><a href="#faq">FAQ</a>
      </nav>
      <div className="connect"><ConnectButton chainStatus="icon" showBalance={false}/></div>
    </header>

    <main id="top">
      <section className="hero">
        <div className="hero-bg"></div>
        <div className="hero-copy">
          <p className="eyebrow">FIVE SOULS. ONE LEGEND.</p>
          <h1>ORQELI</h1><p className="sub">NFT COLLECTION</p>
          <p className="intro">Five unique souls. Five different paths.<br/>One universe. ORQELI.</p>
          <a className="goldbtn" href="#whitelist">JOIN THE WHITELIST <b>↗</b></a>
        </div>
        <div className="hero-crew">{['common','epic','legendary','rare','uncommon'].map(n =>
          <img key={n} src={`/artwork/${n}.png`} alt={`${n} ORQELI character`}/>)}</div>
        <div className="hero-note">BUILT ON BNB SMART CHAIN</div>
      </section>

      <section className="ticker"><span>2,000 UNIQUE NFTs</span><i>✦</i><span>5 RARITY TIERS</span><i>✦</i><span>BNB SMART CHAIN</span><i>✦</i><span>ONE UNIVERSE</span></section>

      <section className="about" id="about">
        <div><p className="eyebrow">THE COLLECTION</p><h2>Small beings.<br/><em>Infinite character.</em></h2></div>
        <p>ORQELI is a limited collection of 2,000 original characters. Each NFT carries its own identity and rarity. Discover the five souls and find your place in the universe.</p>
        <div className="stats"><div><b>2,000</b><small>MAXIMUM SUPPLY</small></div><div><b>05</b><small>RARITY LEVELS</small></div><div><b>BNB</b><small>BLOCKCHAIN</small></div></div>
      </section>

      <section className="souls" id="souls">
        <div className="sectionhead"><div><p className="eyebrow">DISCOVER THE TIERS</p><h2>Five forms. <em>One universe.</em></h2></div><p>Every ORQELI carries a different presence. Which one will find you?</p></div>
        <div className="cards">{tiers.map(([name,count,pct,file,color,desc]) =>
          <article className="tier" key={name} style={{'--tier':color}}>
            <div className="tierimage"><img src={`/artwork/${file}.png`} alt={`${name} ORQELI NFT`}/></div>
            <div className="tierinfo"><div><span>{name.toUpperCase()}</span><b>{pct}</b></div><p>{desc}</p><small>{count} NFTs</small></div>
          </article>)}</div>
      </section>

      <section className="portal" id="whitelist">
        <div className="portalcopy">
          <p className="eyebrow">ORQELI WHITELIST · FREE ENTRY</p>
          <h2>Your journey<br/><em>starts here.</em></h2>
          <p>Joining the whitelist is completely free. Connect your wallet, complete the community tasks and submit one application. A whitelist spot gives you access to a future paid mint phase — it does not mean a free NFT.</p>
          <div className="rules">
            <div><b>01</b><span><strong>Connect your wallet</strong><small>Use the wallet you intend to mint with.</small></span></div>
            <div><b>02</b><span><strong>Complete the X tasks</strong><small>Follow, like and repost the official campaign post.</small></span></div>
            <div><b>03</b><span><strong>Submit your free application</strong><small>No payment or mint is required to apply.</small></span></div>
            <div><b>04</b><span><strong>Receive your WL tier</strong><small>First 200 valid entries: OG WL. Next 800: Regular WL.</small></span></div>
          </div>
        </div>
        <div className="panel">
          <div className="paneltop"><span>WHITELIST PORTAL</span><i>✦ FREE APPLICATION</i></div>
          <h3>Get on the list</h3>
          <div className="wl-counter"><b>{wlStatus.verified}</b><span> / {wlStatus.capacity} WHITELIST PLACES FILLED</span></div>
          <div className="walletline"><span>WALLET STATUS</span><ConnectButton chainStatus="none" showBalance={false}/></div>
          <label>X USERNAME</label>
          <input placeholder="@yourusername" value={xUsername} onChange={e=>setXUsername(e.target.value)}/>
          <label>WALLET ADDRESS</label>
          <input placeholder="Connect wallet to fill this field" value={wallet} readOnly/>
          <div className="tasklinks">
            <a href="#" onClick={e=>{e.preventDefault();openX(X_PROFILE_URL)}}>↗ Follow on X</a>
            <a href="#" onClick={e=>{e.preventDefault();openX(X_CAMPAIGN_URL)}}>♡ Like campaign post</a>
            <a href="#" onClick={e=>{e.preventDefault();openX(X_CAMPAIGN_URL)}}>⤴ Repost campaign post</a>
          </div>
          <label className="task-confirm"><input type="checkbox" checked={tasksConfirmed} onChange={e=>setTasksConfirmed(e.target.checked)}/><span>I confirm that I completed the X tasks above.</span></label>
          <button className="goldbtn wide" disabled={busy || !wlStatus.open} onClick={applyWhitelist}>{busy?'SUBMITTING…':wlStatus.open?'VERIFY TASKS & APPLY':'WHITELIST FULL'}</button>
          <p className="fine">Applying is free. One X account per wallet. Duplicate and suspicious applications may be rejected. A WL spot grants access to its scheduled paid mint phase, not a free NFT.</p>
        </div>
      </section>

      <section className="mint" id="mint">
        <div>
          <p className="eyebrow">THE MINT JOURNEY</p>
          <h2>Three stages.<br/><em>One collection.</em></h2>
          <p>Whitelist applications are free. NFT minting will open later in three sequential phases. Each phase begins only after the previous phase is complete.</p>
          <p className="mint-note">No mint is live right now. You do not need to pay anything to join the whitelist.</p>
        </div>
        <div className="mintbox mint-roadmap">
          <div className="phase-card phase-og">
            <div className="phase-heading"><span>PHASE 01</span><b>200 SUPPLY</b></div>
            <h3>OG WHITELIST</h3>
            <p>OG members mint first. This phase must sell out before Regular WL mint begins.</p>
            <div className="phase-price"><span>PLANNED MINT PRICE</span><strong>0.0018 BNB</strong></div>
            <small>NOT OPEN · FIRST PHASE</small>
          </div>
          <div className="phase-connector">↓</div>
          <div className="phase-card">
            <div className="phase-heading"><span>PHASE 02</span><b>800 SUPPLY</b></div>
            <h3>REGULAR WHITELIST</h3>
            <p>Regular WL members mint after all 200 OG allocations are completed.</p>
            <div className="phase-price"><span>PLANNED MINT PRICE</span><strong>0.0035 BNB</strong></div>
            <small>LOCKED · OPENS AFTER OG</small>
          </div>
          <div className="phase-connector">↓</div>
          <div className="phase-card">
            <div className="phase-heading"><span>PHASE 03</span><b>REMAINING SUPPLY</b></div>
            <h3>PUBLIC MINT</h3>
            <p>After the whitelist phases are complete, remaining NFTs become available to everyone.</p>
            <div className="phase-price"><span>PLANNED MINT PRICE</span><strong>0.005 BNB</strong></div>
            <small>LOCKED · OPENS AFTER WL</small>
          </div>
          <p className="fine">All phases are planned for BNB Smart Chain. Prices and activation dates will be confirmed in the official launch announcement. Minting is currently unavailable.</p>
        </div>
      </section>

      <section className="faq" id="faq">
        <p className="eyebrow">NEED TO KNOW</p><h2>Frequently asked <em>questions.</em></h2>
        <details><summary>Is joining the whitelist free?</summary><p>Yes. Submitting a whitelist application is completely free. No BNB payment or NFT mint is required to apply.</p></details>
        <details><summary>Does whitelist access include a free NFT?</summary><p>No. A whitelist spot grants access to a reserved, paid mint phase. The NFT itself must be minted at the listed phase price.</p></details>
        <details><summary>What is the mint order?</summary><p>OG WL mints first (200 allocations), then Regular WL (800 allocations), and finally Public Mint opens for the remaining supply. Each phase waits for the previous phase to finish.</p></details>
        <details><summary>What are the planned mint prices?</summary><p>Planned prices are 0.0018 BNB for OG WL, 0.0035 BNB for Regular WL and 0.005 BNB for Public Mint. Dates and activation will be announced later.</p></details>
        <details><summary>Which network does ORQELI use?</summary><p>BNB Smart Chain. Supported EVM wallets can connect through the wallet selector.</p></details>
        <details><summary>Can I apply more than once?</summary><p>No. One X account is paired with one wallet. Duplicate applications are not accepted.</p></details>
      </section>
    </main>
    <footer><a className="brand" href="#top">✧ ORQELI</a><span>FIVE SOULS. ONE LEGEND.</span><small>© 2026 ORQELI. ALL RIGHTS RESERVED.</small></footer>
    {status && <div className="toast" onClick={()=>setStatus('')}>{status} <b>×</b></div>}
  </>;
}

createRoot(document.getElementById('root')).render(
  <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      <RainbowKitProvider><App/></RainbowKitProvider>
    </QueryClientProvider>
  </WagmiProvider>
);
