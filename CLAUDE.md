# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

```bash
npm run build       # Compile TypeScript to dist/
npm run dev         # Watch mode for development
npm start           # Run the compiled MCP server
npm run inspect     # Test with MCP Inspector tool
```

## Architecture

This is an MCP (Model Context Protocol) server that provides access to Bank of Thailand Exchange Rate APIs via stdio transport.

### Single Source File

All logic resides in `src/index.ts`:
- **API Configuration**: Base URLs and supported currencies at top
- **Helper Functions**: `makeApiRequest()` for authenticated API calls, `formatResponse()` for output
- **MCP Tools**: 8 tools registered via `server.tool()` - 4 for THB/USD interbank rates, 4 for THB/foreign currency rates
- **MCP Resources**: 2 static resources (`bot://currencies`, `bot://api-info`)

### External APIs

Two Bank of Thailand API endpoints:
- `https://gateway.api.bot.or.th/Stat-ReferenceRate/v2` - Weighted-average interbank THB/USD rates
- `https://gateway.api.bot.or.th/Stat-ExchangeRate/v2` - Average exchange rates for 20 currencies

API documentation in OpenAPI format located in `/documents/`.

### Environment Variables

- `BOT_API_KEY` (required) - Bank of Thailand API key passed via Authorization header

### Adding to Claude Code

```bash
claude mcp add bot-api-mcp node /path/to/dist/index.js -e BOT_API_KEY=your-key
```
