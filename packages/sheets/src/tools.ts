import type { ToolDefinition } from "@quvantic/mcp-core";
import { z } from "zod";
import type { Cell, SheetsClient } from "./types.js";

const cell = z.union([z.string(), z.number(), z.boolean()]);

export const SHEETS_TOOL_NAMES = ["read_range", "append_rows", "find_rows"] as const;

export function sheetsTools(client: SheetsClient): ToolDefinition[] {
  return [
    {
      name: "read_range",
      title: "Read range",
      description:
        "Read a Google Sheets A1 range, for example Pipeline!A1:D10 or 'Won Deals'!A:F. spreadsheetId defaults to the sandbox workbook revenue-ops, or GOOGLE_SHEETS_SPREADSHEET_ID in live mode.",
      readOnly: true,
      inputSchema: { spreadsheetId: z.string().optional(), range: z.string().min(1) },
      handler: (args) => client.readRange(args as { range: string; spreadsheetId?: string }),
    },
    {
      name: "append_rows",
      title: "Append rows",
      description:
        "Append rows after the last used row of the sheet named in range. Cells are strings, numbers, or booleans. Values are sent as USER_ENTERED in live mode.",
      readOnly: false,
      inputSchema: {
        spreadsheetId: z.string().optional(),
        range: z.string().min(1),
        values: z.array(z.array(cell)).min(1),
      },
      handler: (args) =>
        client.appendRows(args as { range: string; values: Cell[][]; spreadsheetId?: string }),
    },
    {
      name: "find_rows",
      title: "Find rows",
      description:
        "Find rows in a range whose cells contain query, case-insensitive. column may be a header name when the range starts on row 1, or a column letter such as C.",
      readOnly: true,
      inputSchema: {
        spreadsheetId: z.string().optional(),
        range: z.string().min(1),
        query: z.string().min(1),
        column: z.string().optional(),
      },
      handler: (args) =>
        client.findRows(
          args as { range: string; query: string; column?: string; spreadsheetId?: string },
        ),
    },
  ];
}
