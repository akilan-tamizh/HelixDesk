
import { spawn } from "node:child_process";

const P4_PATH = process.env.P4_EXECUTABLE || "p4";

const P4_PORT = process.env.P4PORT || "localhost:1666";
const P4_USER = process.env.P4USER || "Akilan2007";
const P4_CLIENT = process.env.P4CLIENT || "Akilan2007_SCM";

export function createDepotFromSpec(spec: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      /*turbopackIgnore: true*/ P4_PATH,
      [
        "-p",
        P4_PORT,
        "-u",
        P4_USER,
        "-c",
        P4_CLIENT,
        "depot",
        "-i",
      ],
      {
        windowsHide: true,
        shell: false,
      }
    );

    let stdout = "";
    let stderr = "";
    let settled = false;

    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");

    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });

    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });

    child.on("error", (error) => {
      fail(error);
    });

    child.on("close", (code) => {
      if (settled) return;

      if (code !== 0) {
        fail(
          new Error(
            stderr.trim() ||
              stdout.trim() ||
              `Perforce exited with code ${code}.`
          )
        );
        return;
      }

      settled = true;
      resolve();
    });

    child.stdin.on("error", (error) => {
      fail(error);
    });

    child.stdin.end(spec);
  });
}
