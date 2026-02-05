#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// API Base URLs
const REFERENCE_RATE_BASE_URL = "https://gateway.api.bot.or.th/Stat-ReferenceRate/v2";
const EXCHANGE_RATE_BASE_URL = "https://gateway.api.bot.or.th/Stat-ExchangeRate/v2";

// Supported currencies for Average Exchange Rate API
const SUPPORTED_CURRENCIES = [
  "USD", "GBP", "EUR", "JPY", "CNY", "HKD", "SGD", "MYR", "TWD", "KRW",
  "IDR", "INR", "AUD", "NZD", "CHF", "DKK", "NOK", "SEK", "AED", "PKR"
] as const;

// Zod schemas for date/period validation
const dailyPeriodSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format");
const monthlyPeriodSchema = z.string().regex(/^\d{4}-\d{2}$/, "Must be YYYY-MM format");
const quarterlyPeriodSchema = z.string().regex(/^\d{4}-Q[1-4]$/, "Must be YYYY-QN format (e.g., 2024-Q1)");
const annualPeriodSchema = z.string().regex(/^\d{4}$/, "Must be YYYY format");
const currencySchema = z.enum(SUPPORTED_CURRENCIES).optional();

// Request timeout in milliseconds
const REQUEST_TIMEOUT_MS = 30000;

// Helper function to make API requests
async function makeApiRequest(baseUrl: string, endpoint: string, params: Record<string, string>): Promise<unknown> {
  const apiKey = process.env.BOT_API_KEY;
  if (!apiKey) {
    throw new Error("BOT_API_KEY environment variable is not set. Please set it with your Bank of Thailand API key.");
  }

  const url = new URL(`${baseUrl}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      url.searchParams.append(key, value);
    }
  });

  // Add timeout using AbortController
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Authorization": apiKey,
        "Accept": "application/json",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      // Sanitize error message - don't expose full API response details
      throw new Error(`API request failed with status ${response.status}`);
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("API request timed out");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Format response data for display
function formatResponse(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

// Initialize MCP Server
const server = new McpServer({
  name: "bot-api-mcp",
  version: "1.0.0",
});

// ============================================
// Weighted-average Interbank Exchange Rate Tools (THB/USD)
// ============================================

server.tool(
  "get_daily_interbank_rate",
  "Get daily weighted-average interbank exchange rate THB/USD. Data from interbank purchases/sales of USD >= 1 million.",
  {
    start_period: dailyPeriodSchema.describe("Start date in YYYY-MM-DD format (e.g., 2024-01-01)"),
    end_period: dailyPeriodSchema.describe("End date in YYYY-MM-DD format (e.g., 2024-01-31)"),
  },
  async ({ start_period, end_period }) => {
    try {
      const data = await makeApiRequest(REFERENCE_RATE_BASE_URL, "/DAILY_REF_RATE/", {
        start_period,
        end_period,
      });
      return {
        content: [{ type: "text", text: formatResponse(data) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  "get_monthly_interbank_rate",
  "Get monthly weighted-average interbank exchange rate THB/USD. Averaged from daily rates.",
  {
    start_period: monthlyPeriodSchema.describe("Start month in YYYY-MM format (e.g., 2024-01)"),
    end_period: monthlyPeriodSchema.describe("End month in YYYY-MM format (e.g., 2024-12)"),
  },
  async ({ start_period, end_period }) => {
    try {
      const data = await makeApiRequest(REFERENCE_RATE_BASE_URL, "/MONTHLY_REF_RATE/", {
        start_period,
        end_period,
      });
      return {
        content: [{ type: "text", text: formatResponse(data) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  "get_quarterly_interbank_rate",
  "Get quarterly weighted-average interbank exchange rate THB/USD. Averaged from monthly rates.",
  {
    start_period: quarterlyPeriodSchema.describe("Start quarter in YYYY-QN format (e.g., 2024-Q1)"),
    end_period: quarterlyPeriodSchema.describe("End quarter in YYYY-QN format (e.g., 2024-Q4)"),
  },
  async ({ start_period, end_period }) => {
    try {
      const data = await makeApiRequest(REFERENCE_RATE_BASE_URL, "/QUARTERLY_REF_RATE/", {
        start_period,
        end_period,
      });
      return {
        content: [{ type: "text", text: formatResponse(data) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  "get_annual_interbank_rate",
  "Get annual weighted-average interbank exchange rate THB/USD. Averaged from quarterly rates.",
  {
    start_period: annualPeriodSchema.describe("Start year in YYYY format (e.g., 2020)"),
    end_period: annualPeriodSchema.describe("End year in YYYY format (e.g., 2024)"),
  },
  async ({ start_period, end_period }) => {
    try {
      const data = await makeApiRequest(REFERENCE_RATE_BASE_URL, "/ANNUAL_REF_RATE/", {
        start_period,
        end_period,
      });
      return {
        content: [{ type: "text", text: formatResponse(data) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
      };
    }
  }
);

// ============================================
// Average Exchange Rate Tools (THB/Foreign Currency)
// ============================================

server.tool(
  "get_daily_exchange_rate",
  "Get daily average exchange rate THB vs foreign currencies. Includes buying/selling rates for 19+ currencies.",
  {
    start_period: dailyPeriodSchema.describe("Start date in YYYY-MM-DD format (e.g., 2024-01-01)"),
    end_period: dailyPeriodSchema.describe("End date in YYYY-MM-DD format (e.g., 2024-01-31)"),
    currency: currencySchema.describe(`Optional currency code: ${SUPPORTED_CURRENCIES.join(", ")}. If omitted, returns all currencies.`),
  },
  async ({ start_period, end_period, currency }) => {
    try {
      const data = await makeApiRequest(EXCHANGE_RATE_BASE_URL, "/DAILY_AVG_EXG_RATE/", {
        start_period,
        end_period,
        currency: currency || "",
      });
      return {
        content: [{ type: "text", text: formatResponse(data) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  "get_monthly_exchange_rate",
  "Get monthly average exchange rate THB vs foreign currencies. Includes buying/selling rates.",
  {
    start_period: monthlyPeriodSchema.describe("Start month in YYYY-MM format (e.g., 2024-01)"),
    end_period: monthlyPeriodSchema.describe("End month in YYYY-MM format (e.g., 2024-12)"),
    currency: currencySchema.describe(`Optional currency code: ${SUPPORTED_CURRENCIES.join(", ")}. If omitted, returns all currencies.`),
  },
  async ({ start_period, end_period, currency }) => {
    try {
      const data = await makeApiRequest(EXCHANGE_RATE_BASE_URL, "/MONTHLY_AVG_EXG_RATE/", {
        start_period,
        end_period,
        currency: currency || "",
      });
      return {
        content: [{ type: "text", text: formatResponse(data) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  "get_quarterly_exchange_rate",
  "Get quarterly average exchange rate THB vs foreign currencies. Includes buying/selling rates.",
  {
    start_period: quarterlyPeriodSchema.describe("Start quarter in YYYY-QN format (e.g., 2024-Q1)"),
    end_period: quarterlyPeriodSchema.describe("End quarter in YYYY-QN format (e.g., 2024-Q4)"),
    currency: currencySchema.describe(`Optional currency code: ${SUPPORTED_CURRENCIES.join(", ")}. If omitted, returns all currencies.`),
  },
  async ({ start_period, end_period, currency }) => {
    try {
      const data = await makeApiRequest(EXCHANGE_RATE_BASE_URL, "/QUARTERLY_AVG_EXG_RATE/", {
        start_period,
        end_period,
        currency: currency || "",
      });
      return {
        content: [{ type: "text", text: formatResponse(data) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  "get_annual_exchange_rate",
  "Get annual average exchange rate THB vs foreign currencies. Includes buying/selling rates.",
  {
    start_period: annualPeriodSchema.describe("Start year in YYYY format (e.g., 2020)"),
    end_period: annualPeriodSchema.describe("End year in YYYY format (e.g., 2024)"),
    currency: currencySchema.describe(`Optional currency code: ${SUPPORTED_CURRENCIES.join(", ")}. If omitted, returns all currencies.`),
  },
  async ({ start_period, end_period, currency }) => {
    try {
      const data = await makeApiRequest(EXCHANGE_RATE_BASE_URL, "/ANNUAL_AVG_EXG_RATE/", {
        start_period,
        end_period,
        currency: currency || "",
      });
      return {
        content: [{ type: "text", text: formatResponse(data) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
      };
    }
  }
);

// ============================================
// Resources
// ============================================

server.resource(
  "supported-currencies",
  "bot://currencies",
  { description: "List of supported foreign currencies for exchange rate queries", mimeType: "application/json" },
  async () => {
    const currencyInfo = SUPPORTED_CURRENCIES.map(code => ({
      code,
      description: getCurrencyDescription(code),
    }));
    return {
      contents: [{
        uri: "bot://currencies",
        mimeType: "application/json",
        text: JSON.stringify(currencyInfo, null, 2),
      }],
    };
  }
);

server.resource(
  "api-info",
  "bot://api-info",
  { description: "Information about Bank of Thailand Exchange Rate APIs", mimeType: "text/plain" },
  async () => {
    return {
      contents: [{
        uri: "bot://api-info",
        mimeType: "text/plain",
        text: `Bank of Thailand Exchange Rate APIs

1. Weighted-average Interbank Exchange Rate (THB/USD)
   - Data from interbank transactions >= 1 million USD
   - Updated daily at 6:00 PM (BKK time)
   - Available frequencies: Daily, Monthly, Quarterly, Annual

2. Average Exchange Rate (THB/Foreign Currency)
   - Spot market rates for THB vs 19+ foreign currencies
   - Data from commercial bank transaction reports
   - Updated daily at 6:00 PM (BKK time)
   - Available frequencies: Daily, Monthly, Quarterly, Annual

Data Source: Bank of Thailand (Commercial Banks, Foreign Bank Branches, Special-purpose Financial Institutions)

Period Formats:
- Daily: YYYY-MM-DD (e.g., 2024-01-15)
- Monthly: YYYY-MM (e.g., 2024-01)
- Quarterly: YYYY-QN (e.g., 2024-Q1)
- Annual: YYYY (e.g., 2024)`,
      }],
    };
  }
);

// Helper function for currency descriptions
function getCurrencyDescription(code: string): string {
  const descriptions: Record<string, string> = {
    USD: "United States Dollar",
    GBP: "British Pound Sterling",
    EUR: "Euro",
    JPY: "Japanese Yen",
    CNY: "Chinese Yuan Renminbi",
    HKD: "Hong Kong Dollar",
    SGD: "Singapore Dollar",
    MYR: "Malaysian Ringgit",
    TWD: "Taiwan Dollar",
    KRW: "South Korean Won",
    IDR: "Indonesian Rupiah",
    INR: "Indian Rupee",
    AUD: "Australian Dollar",
    NZD: "New Zealand Dollar",
    CHF: "Swiss Franc",
    DKK: "Danish Krone",
    NOK: "Norwegian Krone",
    SEK: "Swedish Krona",
    AED: "UAE Dirham",
    PKR: "Pakistani Rupee",
  };
  return descriptions[code] || code;
}

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Bank of Thailand MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
