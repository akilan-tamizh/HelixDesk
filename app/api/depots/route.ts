
import { NextResponse } from "next/server";

import { runP4Tagged } from "@/lib/perforce";
interface Depot {
  name: string;
  type: string;
  map: string;
  description: string;
  address: string;
}

function normalizeDepot(record: Record<string, string>): Depot {
  return {
    name: record.name || record.depot || "Unknown",
    type: record.type || "local",
    map: record.map || "",
    description: record.desc || record.description || "",
    address: record.Address || record.address || "",
  };
}

export async function GET() {
  try {
    // Read the depot list using Perforce's tagged output.
    const records = await runP4Tagged(["depots"]);

    const depots = records
      .map(normalizeDepot)
      .filter((depot) => depot.name !== "Unknown");

    return NextResponse.json({
      success: true,
      count: depots.length,
      depots,
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to retrieve depots.";

    return NextResponse.json(
      {
        success: false,
        message: "Failed to retrieve depots from Perforce.",
        error: message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    if (
      typeof body !== "object" ||
      body === null ||
      !("name" in body) ||
      typeof body.name !== "string"
    ) {
      return NextResponse.json(
        { success: false, message: "A depot name is required." },
        { status: 400 }
      );
    }

    const name = body.name.trim();
    const description =
      "description" in body && typeof body.description === "string"
        ? body.description.trim()
        : "";

    // Restrict names to a conservative, predictable format.
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(name)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Depot names must be 1–64 characters and contain only letters, numbers, underscores, or hyphens.",
        },
        { status: 400 }
      );
    }

    if (description.length > 250) {
      return NextResponse.json(
        {
          success: false,
          message: "The description cannot exceed 250 characters.",
        },
        { status: 400 }
      );
    }

    // Avoid duplicate names before attempting creation.
    const existingRecords = await runP4Tagged(["depots"]);
    const exists = existingRecords.some(
      (record) => (record.name || record.depot) === name
    );

    if (exists) {
      return NextResponse.json(
        {
          success: false,
          message: `A depot named "${name}" already exists.`,
        },
        { status: 409 }
      );
    }

    // Build the spec without invoking a shell.
    const spec = [
      `Depot: ${name}`,
      `Owner: ${process.env.P4USER || "Akilan2007"}`,
      `Date:`,
      `Description: ${description || `Depot ${name}`}`,
      `Type: local`,
      `Map: ${name}/...`,
      "",
    ].join("\n");

    // p4 depot -i reads a depot specification from standard input.
    // Use a dedicated stdin-capable helper rather than interpolating
    // user-controlled text into a shell command.
    const { createDepotFromSpec } = await import("@/lib/perforce-depot");
    await createDepotFromSpec(spec);

    return NextResponse.json(
      {
        success: true,
        message: `Depot "${name}" was created successfully.`,
        depot: {
          name,
          type: "local",
          map: `${name}/...`,
          description: description || `Depot ${name}`,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Depot creation failed.";

    return NextResponse.json(
      {
        success: false,
        message: "Unable to create the depot. Check your Perforce permissions.",
        error: message,
      },
      { status: 500 }
    );
  }
}
