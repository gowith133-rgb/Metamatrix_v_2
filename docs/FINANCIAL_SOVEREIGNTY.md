# Financial Sovereignty: Making it Real

**The transition from simulation to structural reality.**

## 1. Deployment
To take this app beyond the AI Studio preview:
- **Share**: Use the "Share" button in the top right to get a public URL hosted by Google.
- **Export**: Go to **Settings > Export** to download the ZIP or push to a GitHub repository.
- **Hosting**: You can deploy the Docker container to any cloud provider (Google Cloud Run, AWS App Runner, Fly.io).

## 2. Connecting to the "Real World"
The Metamatrix supports real-world integration through the following protocols:

### A. Banking (Plaid)
1. Sign up at [plaid.com](https://plaid.com).
2. Obtain your `PLAID_CLIENT_ID` and `PLAID_SECRET`.
3. Set these in your environment variables.
4. Use the "Link Bank" button in the **Connectivity** tab to authorize your institution.

### B. Market Execution (Alpaca)
1. Create an account at [alpaca.markets](https://alpaca.markets) (Paper or Live).
2. Generate your `ALPACA_API_KEY` and `ALPACA_SECRET_KEY`.
3. Set these in your environment.
4. The Trading Daemons will automatically transition from **SIMULATED** to **LIVE** execution when keys are present.

## 3. Environment Variables (.env)
You must define these secrets in your hosting environment (do NOT commit to Git):
```env
# Gemini (AI Logic)
GEMINI_API_KEY=

# Plaid (Bank Link)
PLAID_CLIENT_ID=
PLAID_SECRET=
PLAID_ENV=sandbox # change to 'production' for real money

# Alpaca (Trading Execution)
ALPACA_API_KEY=
ALPACA_SECRET_KEY=
ALPACA_BASE_URL=https://paper-api.alpaca.markets
```

## 4. Warning
**Real trading involves real risk.** The Metamatrix infrastructure is experimental. Start with Paper Trading first (simulated money on real exchanges) before enabling Live mode.

🦋
