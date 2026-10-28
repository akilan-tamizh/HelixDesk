
import { execFile } from "node:child_process";

const P4_PATH = process.env.P4_EXECUTABLE || "p4";
const P4_PORT = process.env.P4PORT || "localhost:1666";
const P4_USER = process.env.P4USER || "Akilan2007";
const P4_CLIENT = process.env.P4CLIENT || "Akilan2007_SCM";

export class PerforceError extends Error {
  constructor(
    message: string,
    public readonly exitCode?: number | string
  ) {
    super(message);
    this.name = "PerforceError";
  }
}

export interface PerforceResult {
  stdout: string;
  stderr: string;
}

/**
 * Execute a Perforce command using the default workspace
 * configured in .env.local.
 */
export function runP4(
  args: string[],
  timeoutMs = 15000
): Promise<PerforceResult> {
  return executeP4(P4_CLIENT, args, timeoutMs);
}

/**
 * Shared Perforce command executor.
 * Uses execFile with shell disabled to avoid shell interpolation.
 */
function executeP4(
  client: string,
  args: string[],
  timeoutMs = 15000
): Promise<PerforceResult> {
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(client)) {
    return Promise.reject(
      new PerforceError("Invalid Perforce workspace name.")
    );
  }

  return new Promise((resolve, reject) => {
    execFile(
      /* turbopackIgnore: true */
      P4_PATH,
      [
        "-p",
        P4_PORT,
        "-u",
        P4_USER,
        "-c",
        client,
        ...args,
      ],
      {
        timeout: timeoutMs,
        windowsHide: true,
        maxBuffer: 2 * 1024 * 1024,
        encoding: "utf8",
        shell: false,
      },
      (error, stdout, stderr) => {
        if (error) {
          const message =
            stderr.trim() ||
            stdout.trim() ||
            error.message ||
            "Perforce command failed.";

          const errorCode =
            typeof error.code === "string" ||
            typeof error.code === "number"
              ? error.code
              : undefined;

          reject(new PerforceError(message, errorCode));
          return;
        }

        resolve({
          stdout: stdout.trim(),
          stderr: stderr.trim(),
        });
      }
    );
  });
}

/**
 * Execute a Perforce command using the default workspace
 * and return standard output.
 */
export async function runP4Text(
  args: string[],
  timeoutMs = 15000
): Promise<string> {
  const result = await runP4(args, timeoutMs);
  return result.stdout;
}

/**
 * Execute a Perforce command using a specified workspace.
 * The configured default workspace remains unchanged.
 */
export function runP4ForClient(
  client: string,
  args: string[],
  timeoutMs = 15000
): Promise<PerforceResult> {
  return executeP4(client, args, timeoutMs);
}

/**
 * Execute a Perforce command using a specified workspace
 * and return standard output.
 */
export async function runP4TextForClient(
  client: string,
  args: string[],
  timeoutMs = 15000
): Promise<string> {
  const result = await runP4ForClient(client, args, timeoutMs);
  return result.stdout;
}

/**
 * Execute a Perforce command with tagged output and parse
 * its fields into records.
 */
export async function runP4Tagged(
  args: string[],
  timeoutMs = 15000
): Promise<Record<string, string>[]> {
  const output = await runP4Text(["-ztag", ...args], timeoutMs);
  const records: Record<string, string>[] = [];
  let current: Record<string, string> = {};

  for (const line of output.split(/\r?\n/)) {
    const match = line.match(/^\.\.\.\s+(\S+)\s*(.*)$/);

    if (!match) {
      continue;
    }

    const [, key, value] = match;

    // A repeated field usually indicates a new record.
    // Description fields may legitimately repeat.
    if (
      Object.prototype.hasOwnProperty.call(current, key) &&
      key !== "desc"
    ) {
      records.push(current);
      current = {};
    }

    current[key] = value;
  }

  if (Object.keys(current).length > 0) {
    records.push(current);
  }

  return records;
}

/**
 * Return tagged output using a specifically selected workspace.
 */
export async function runP4TaggedForClient(
  client: string,
  args: string[],
  timeoutMs = 15000
): Promise<Record<string, string>[]> {
  const output = await runP4TextForClient(
    client,
    ["-ztag", ...args],
    timeoutMs
  );

  const records: Record<string, string>[] = [];
  let current: Record<string, string> = {};

  for (const line of output.split(/\r?\n/)) {
    const match = line.match(/^\.\.\.\s+(\S+)\s*(.*)$/);

    if (!match) {
      continue;
    }

    const [, key, value] = match;

    if (
      Object.prototype.hasOwnProperty.call(current, key) &&
      key !== "desc"
    ) {
      records.push(current);
      current = {};
    }

    current[key] = value;
  }

  if (Object.keys(current).length > 0) {
    records.push(current);
  }

  return records;
}

/**
 * Return the active default Perforce connection configuration.
 */
export function getPerforceConfig() {
  return {
    server: P4_PORT,
    user: P4_USER,
    workspace: P4_CLIENT,
  };
}
