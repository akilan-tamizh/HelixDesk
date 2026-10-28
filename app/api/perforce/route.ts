
import { NextResponse } from "next/server";
import {
  getPerforceConfig,
  runP4Text,
} from "@/lib/perforce";

export async function GET() {
  try {
    const output = await runP4Text(["info"]);
    const details: Record<string, string> = {};

    for (const line of output.split(/\r?\n/)) {
      const separator = line.indexOf(":");

      if (separator > 0) {
        const key = line.slice(0, separator).trim();
        const value = line.slice(separator + 1).trim();
        details[key] = value;
      }
    }

    const config = getPerforceConfig();

    return NextResponse.json({
      connected: true,
      message: "Perforce CLI responded successfully.",
      server: details["Server address"] || config.server,
      user: details["User name"] || config.user,
      workspace: details["Client name"] || config.workspace,
      stream: details["Client stream"] || "Not reported",
      workspaceRoot: details["Client root"] || "Not reported",
      serverVersion: details["Server version"] || "Not reported",
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown connection error";

    return NextResponse.json(
      {
        connected: false,
        message: "Unable to retrieve Perforce server information.",
        error: message,
        server: getPerforceConfig().server,
        checkedAt: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
