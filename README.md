# ORQELI — full-site starter

English-only responsive NFT website using the five supplied ORQELI artwork files. The frontend is built with Vite + React + RainbowKit/Wagmi, configured for BNB Smart Chain (chain ID 56). RainbowKit exposes a broad wallet selector using injected wallets and WalletConnect-compatible wallets.

## Run locally
1. Install Node.js 20+.
2. In this folder run `npm install`.
3. Copy `.env.example` to `.env` and set `VITE_WALLETCONNECT_PROJECT_ID` from https://cloud.walletconnect.com/.
4. Run `npm run dev`.
5. Run `npm run build` for production files in `dist/`.

## Cloudflare Pages + API
- Deploy the Vite project to Cloudflare Pages. Build command: `npm run build`; output directory: `dist`.
- Create a Cloudflare D1 database named `orqeli-whitelist`, execute `worker/schema.sql`, and replace `database_id` in `wrangler.toml`.
- Deploy the Worker in `worker/` and set `VITE_API_BASE` to its URL, then rebuild Pages.

## Required before real public launch
This is a functioning visual/frontend starter, NOT a live whitelist or mint system yet. The Worker intentionally rejects applications and mint calls until the security integrations below are implemented. Do not open public applications using the placeholder handlers.

1. **Whitelist security:** implement EIP-191 wallet-signature challenge with nonce/expiry/replay protection; verify X OAuth identity and actual follow/like/repost task completion using an approved X API access level; enforce one wallet ↔ one X account with D1 unique constraints; use Cloudflare Turnstile, per-IP rate limits and privacy-safe abuse signals. IP/device checks are signals, not foolproof identity. Assign rank atomically in a D1 transaction only after verification; cap at 1,000 (ranks 1–200 OG, 201–1,000 Regular); lock list on closure.
2. **Wallet UX:** create a WalletConnect/Reown project ID. Wallet selector is configured for BNB Smart Chain; wallet must switch to chain ID 56 before transactions. Do not request seed phrases or private keys.
3. **Mint:** contract is intentionally not deployed yet. At launch, set deployed contract address and ABI, then implement phase/eligibility checks, price/quantity display, `simulateContract` + `writeContract`, receipt confirmation, supply refresh, and user-facing transaction errors. Never put owner keys or API secrets in frontend env vars.
4. **Social tasks:** replace placeholder task links with the official X profile and campaign post URLs. Do not mark tasks verified based only on client-side clicks.
5. **Content check:** the supplied contract plan prices are shown as OG 0.0018 BNB, Regular 0.0035 BNB and Public 0.005 BNB. Confirm these still match the final contract before launch.

## Project structure
- `src/main.jsx`, `src/style.css`: English site UI, wallet selector, whitelist and mint views.
- `public/artwork/`: supplied Common, Uncommon, Rare, Epic and Legendary character images.
- `worker/`: Cloudflare Worker API scaffold.
- `worker/schema.sql`: D1 schema with unique wallet/X constraints.

The whitelist form and mint CTA are deliberately non-live until backend verification and contract deployment are completed.
