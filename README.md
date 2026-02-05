# Bank of Thailand MCP Server

An MCP (Model Context Protocol) server that provides access to Bank of Thailand Exchange Rate APIs.

## Features

- **Weighted-average Interbank Exchange Rate (THB/USD)**: Daily, monthly, quarterly, and annual rates from interbank transactions
- **Average Exchange Rate (THB/Foreign Currency)**: Spot market rates for 20 foreign currencies including USD, EUR, GBP, JPY, CNY, and more

## Installation

```bash
npm install
npm run build
```

## Configuration

Obtain an API key from [Bank of Thailand API Portal](https://apiportal.bot.or.th/) and set it as an environment variable:

```bash
export BOT_API_KEY=your-api-key-here
```

## Usage

### Add to Claude Code

```bash
claude mcp add bot-api-mcp node /path/to/dist/index.js -e BOT_API_KEY=your-api-key
```

### Run Standalone

```bash
npm start
```

### Test with MCP Inspector

```bash
npm run inspect
```

## Available Tools

### Interbank Rate (THB/USD)

| Tool | Description | Period Format |
|------|-------------|---------------|
| `get_daily_interbank_rate` | Daily weighted-average rate | YYYY-MM-DD |
| `get_monthly_interbank_rate` | Monthly averaged rate | YYYY-MM |
| `get_quarterly_interbank_rate` | Quarterly averaged rate | YYYY-QN |
| `get_annual_interbank_rate` | Annual averaged rate | YYYY |

### Exchange Rate (THB/Foreign Currency)

| Tool | Description | Period Format |
|------|-------------|---------------|
| `get_daily_exchange_rate` | Daily average rate | YYYY-MM-DD |
| `get_monthly_exchange_rate` | Monthly average rate | YYYY-MM |
| `get_quarterly_exchange_rate` | Quarterly average rate | YYYY-QN |
| `get_annual_exchange_rate` | Annual average rate | YYYY |

## Supported Currencies

USD, GBP, EUR, JPY, CNY, HKD, SGD, MYR, TWD, KRW, IDR, INR, AUD, NZD, CHF, DKK, NOK, SEK, AED, PKR

## Resources

- `bot://currencies` - List of supported currencies with descriptions
- `bot://api-info` - API documentation and period format reference

## License

MIT
