import { NextResponse } from "next/server";
import { runP4Tagged } from "@/lib/perforce";

interface PerforceStream {
  name: string;
  stream: string;
  type: string;
  parent: string;
  description: string;
  owner: string;
  updated: string;
}

function normalizeStream(
  record: Record<string, string>
): PerforceStream {
  return {
    name: record.Name || record.name || record.stream || "Unknown",
    stream: record.Stream || record.stream || "",
    type: record.Type || record.type || "unknown",
    parent: record.Parent || record.parent || "none",
    description: record.desc || record.Description || "",
    owner: record.Owner || record.owner || "",
    updated: record.Updated || record.updated || "",
  };
}

export async function GET() {
  try {
    const records = await runP4Tagged(["streams", "-a", "//..."]);

    const streams = records
      .map(normalizeStream)
      .filter((stream) => stream.stream.startsWith("//"));

    return NextResponse.json({
      success: true,
      count: streams.length,
      streams,
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to retrieve streams.";

    return NextResponse.json(
      {
        success: false,
        message: "Failed to retrieve streams from Perforce.",
        error: message,
      },
      { status: 500 }
    );
  }
}
