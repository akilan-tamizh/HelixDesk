
import { NextResponse } from "next/server";
import { runP4Tagged, runP4Text } from "@/lib/perforce";

function cleanPath(value: unknown): string {
  const path = typeof value === "string" ? value.trim() : "";

  if (
    !path.startsWith("//") ||
    /[\r\n]/.test(path) ||
    path.includes("...")
  ) {
    throw new Error(
      "Provide a valid Perforce depot file path beginning with //."
    );
  }

  return path;
}

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Perforce request failed.";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const action = url.searchParams.get("action") || "changelists";

  try {
    switch (action) {
      case "changelists": {
        const [pending, submitted] = await Promise.all([
          runP4Tagged(["changes", "-s", "pending", "-m", "100"]),
          runP4Tagged(["changes", "-s", "submitted", "-m", "100"]),
        ]);

        return NextResponse.json({
          success: true,
          pending,
          submitted,
          count: pending.length + submitted.length,
        });
      }

      case "changefiles": {
        const change = (url.searchParams.get("change") || "").trim();

        if (!/^\d+$/.test(change) || Number(change) < 1) {
          return NextResponse.json(
            {
              success: false,
              message: "Provide a valid positive changelist number.",
            },
            { status: 400 }
          );
        }

        // `describe -s` returns file details in text output.
        // Parse those lines directly instead of assuming the tagged
        // output contains one record per affected file.
        const output = await runP4Text(["describe", "-s", change]);

        const files: {
          depotFile: string;
          action: string;
          rev: string;
        }[] = [];

        for (const line of output.split(/\r?\n/)) {
          const match = line.match(
            /^\.\.\.\s+(\/\/\S+?)#(\d+)\s+(\S+)\s*$/
          );

          if (!match) {
            continue;
          }

          files.push({
            depotFile: match[1],
            rev: match[2],
            action: match[3],
          });
        }

        return NextResponse.json({
          success: true,
          change,
          files,
          count: files.length,
        });
      }

      case "history": {
        const path = cleanPath(url.searchParams.get("path"));

        const records = await runP4Tagged([
          "filelog",
          "-m",
          "20",
          path,
        ]);

        const history: Record<string, string>[] = [];

        for (const record of records) {
          const depotFile = String(record.depotFile || path);

          for (let i = 0; i < 20; i++) {
            const revision = record[`rev${i}`];

            if (revision === undefined) {
              break;
            }

            const timestamp = Number(record[`time${i}`] || 0);

            history.push({
              depotFile,
              revision: String(revision),
              change: String(record[`change${i}`] || ""),
              action: String(record[`action${i}`] || ""),
              user: String(record[`user${i}`] || ""),
              client: String(record[`client${i}`] || ""),
              date: timestamp
                ? new Date(timestamp * 1000).toISOString()
                : "",
              description: String(record[`desc${i}`] || ""),
              type: String(record[`type${i}`] || ""),
            });
          }
        }

        return NextResponse.json({
          success: true,
          path,
          history,
          count: history.length,
        });
      }

      case "locks": {
        // The text output from `p4 opened -a` contains the *locked*
        // marker, even when tagged output omits the lock field.
        const [openedOutput, openedRecords] = await Promise.all([
          runP4Text(["opened", "-a"]),
          runP4Tagged(["opened", "-a"]),
        ]);

        const openedLines = openedOutput
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean);

        const lockedPaths = new Set<string>();

        for (const line of openedLines) {
          if (!/\*locked\*/i.test(line)) {
            continue;
          }

          const match = line.match(/^(.*?)#\d+\s+-/);

          if (match?.[1]) {
            lockedPaths.add(match[1].trim());
          }
        }

        const opened = openedRecords.map((record) => {
          const depotFile = String(record.depotFile || "");
          const isLocked = lockedPaths.has(depotFile);

          return {
            ...record,
            depotFile,
            ourLock: isLocked ? "locked" : "",
            otherLock: "",
            locked: isLocked,
          };
        });

        const locks = opened.filter((record) => record.locked);

        return NextResponse.json({
          success: true,
          opened,
          locks,
          count: locks.length,
          openedCount: opened.length,
        });
      }

      case "reconcile": {
        const output = await runP4Text([
          "reconcile",
          "-n",
          "//...",
        ]);

        const files = output
          ? output.split(/\r?\n/).filter(Boolean)
          : [];

        return NextResponse.json({
          success: true,
          previewOnly: true,
          output,
          files,
          count: files.length,
        });
      }

      case "search": {
        const query = (url.searchParams.get("q") || "")
          .trim()
          .toLowerCase();

        if (!query) {
          return NextResponse.json({
            success: true,
            query: "",
            files: [],
            count: 0,
          });
        }

        if (query.length > 200 || /[\r\n]/.test(query)) {
          return NextResponse.json(
            {
              success: false,
              message: "Invalid search query.",
            },
            { status: 400 }
          );
        }

        const files = await runP4Tagged(["files", "//..."]);

        const matches = files.filter((file) =>
          String(file.depotFile || "")
            .toLowerCase()
            .includes(query)
        );

        const limitedMatches = matches.slice(0, 200);

        return NextResponse.json({
          success: true,
          query,
          files: limitedMatches,
          count: limitedMatches.length,
        });
      }

      default:
        return NextResponse.json(
          {
            success: false,
            message:
              "Unknown action. Use changelists, changefiles, history, locks, reconcile, or search.",
          },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: errorMessage(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    if (
      !body ||
      typeof body !== "object" ||
      !("action" in body) ||
      !("path" in body)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Provide an action and file path.",
        },
        { status: 400 }
      );
    }

    const { action, path: rawPath } = body as {
      action: unknown;
      path: unknown;
    };

    if (action !== "lock" && action !== "unlock") {
      return NextResponse.json(
        {
          success: false,
          message: "Action must be lock or unlock.",
        },
        { status: 400 }
      );
    }

    const path = cleanPath(rawPath);
    const output = await runP4Text([action, path]);

    return NextResponse.json({
      success: true,
      action,
      path,
      message:
        action === "lock"
          ? "Lock operation completed successfully."
          : "Unlock operation completed successfully.",
      output,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: errorMessage(error),
      },
      { status: 400 }
    );
  }
}
