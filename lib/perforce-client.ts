import { execFile, spawn } from "node:child_process";

const P4_PATH = process.env.P4_EXECUTABLE || "p4";

const BASE_ARGS = [
  "-p", process.env.P4PORT || "localhost:1666",
  "-u", process.env.P4USER || "Akilan2007",
  "-c", process.env.P4CLIENT || "Akilan2007_SCM",
];

function getP4Output(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(
      P4_PATH,
      [...BASE_ARGS, ...args],
      { windowsHide: true, maxBuffer: 2 * 1024 * 1024, encoding: "utf8" },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(stderr.trim() || stdout.trim() || error.message));
          return;
        }
        resolve(stdout);
      }
    );
  });
}

function replaceField(
  spec: string,
  field: string,
  value: string
): string {
  const escaped = field.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`^${escaped}:.*$`, "m");

  if (!pattern.test(spec)) {
    throw new Error(`The generated Perforce spec has no ${field} field.`);
  }

  return spec.replace(pattern, `${field}: ${value}`);
}

function saveSpec(spec: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      P4_PATH,
      [...BASE_ARGS, "client", "-i"],
      { windowsHide: true, shell: false }
    );

    let stdout = "";
    let stderr = "";
    let settled = false;

    const fail = (error: Error) => {
      if (!settled) {
        settled = true;
        reject(error);
      }
    };

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");

    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });

    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });

    child.on("error", fail);

    child.on("close", (code) => {
      if (settled) return;

      if (code !== 0) {
        fail(new Error(stderr.trim() || stdout.trim() || `p4 exited with code ${code}`));
        return;
      }

      settled = true;
      resolve();
    });

    child.stdin.on("error", fail);
    child.stdin.end(spec);
  });
}

export async function createWorkspaceFromStream(input: {
  name: string;
  root: string;
  stream: string;
  description: string;
}): Promise<void> {
  const { name, root, stream, description } = input;

  let spec = await getP4Output([
    "client",
    "-o",
    "-S", stream,
    name,
  ]);

  spec = replaceField(spec, "Client", name);
  spec = replaceField(spec, "Owner", process.env.P4USER || "Akilan2007");
  spec = replaceField(spec, "Host", "");
  spec = replaceField(spec, "Description", description || `Workspace ${name}`);
  spec = replaceField(spec, "Root", root);

  await saveSpec(spec);
}
