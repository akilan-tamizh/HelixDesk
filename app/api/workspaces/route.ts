import { NextRequest, NextResponse } from "next/server";
import {
  runP4Tagged,
  runP4TaggedForClient,
  runP4TextForClient,
} from "@/lib/perforce";
import { createWorkspaceFromStream } from "@/lib/perforce-client";

type WorkspaceRecord = {
  name: string;
  owner: string;
  host: string;
  root: string;
  description: string;
  stream: string;
  access: string;
  lineEnd: string;
};

type WorkspaceFile = {
  depotFile: string;
  revision: string;
  localPath: string;
};

function field(
  record: Record<string, string>,
  ...keys: string[]
): string {
  for (const key of keys) {
    if (record[key] !== undefined) return record[key];
  }
  return "";
}

function mapWorkspace(record: Record<string, string>): WorkspaceRecord {
  return {
    name: field(record, "client", "Client"),
    owner: field(record, "Owner", "owner"),
    host: field(record, "Host", "host"),
    root: field(record, "Root", "root"),
    description: field(record, "Description", "description"),
    stream: field(record, "Stream", "stream"),
    access: field(record, "Access", "access"),
    lineEnd: field(record, "LineEnd", "lineEnd"),
  };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Perforce request failed.";
}

function validWorkspaceName(name: string): boolean {
  return /^[A-Za-z0-9_-]{1,100}$/.test(name);
}

function validDepotFile(path: string): boolean {
  return (
    path.startsWith("//") &&
    !/[\r\n*#@%]/.test(path) &&
    !path.includes("...") &&
    path.length <= 1024
  );
}

async function findWorkspace(workspace: string) {
  const clients = await runP4Tagged(["clients"]);
  return (
    clients.find(
      (record) =>
        field(record, "client", "Client").toLowerCase() ===
        workspace.toLowerCase()
    ) ?? null
  );
}

export async function GET(request: NextRequest) {
  const action = request.nextUrl.searchParams.get("action") || "list";

  try {
    if (action === "files") {
      const workspace =
        request.nextUrl.searchParams.get("workspace")?.trim() || "";
      if (!validWorkspaceName(workspace)) {
        return NextResponse.json(
          { success: false, error: "Provide a valid workspace name." },
          { status: 400 }
        );
      }

      const selected = await findWorkspace(workspace);
      if (!selected) {
        return NextResponse.json(
          { success: false, error: `Workspace "${workspace}" was not found.` },
          { status: 404 }
        );
      }

      const output = await runP4TaggedForClient(workspace, ["have"]);
      const files: WorkspaceFile[] = output
        .map((record) => ({
          depotFile: field(record, "depotFile"),
          revision: field(record, "haveRev", "rev"),
          localPath: field(record, "path", "clientFile"),
        }))
        .filter((file) => file.depotFile.startsWith("//"));

      return NextResponse.json({
        success: true,
        workspace,
        root: field(selected, "Root", "root"),
        stream: field(selected, "Stream", "stream"),
        files,
        count: files.length,
      });
    }

    if (action === "diff") {
      const workspace = request.nextUrl.searchParams.get("workspace")?.trim() || "";
      const depotFile = request.nextUrl.searchParams.get("depotFile")?.trim() || "";
      if (!validWorkspaceName(workspace)) {
        return NextResponse.json({ success: false, error: "Provide a valid workspace name." }, { status: 400 });
      }
      if (!validDepotFile(depotFile)) {
        return NextResponse.json({ success: false, error: "Provide a valid depot file path." }, { status: 400 });
      }
      const selected = await findWorkspace(workspace);
      if (!selected) {
        return NextResponse.json({ success: false, error: `Workspace "${workspace}" was not found.` }, { status: 404 });
      }
      const haveFiles = await runP4TaggedForClient(workspace, ["have"]);
      if (!haveFiles.some((record) => field(record, "depotFile") === depotFile)) {
        return NextResponse.json({ success: false, error: "File is not synced in this workspace." }, { status: 404 });
      }
      const diff = await runP4TextForClient(workspace, ["diff", "-du", depotFile]);
      return NextResponse.json({ success: true, workspace, depotFile, diff: diff.trim() || "No differences found." });
    }

    if (action === "opened") {
      const workspace =
        request.nextUrl.searchParams.get("workspace")?.trim() || "";
      if (!validWorkspaceName(workspace)) {
        return NextResponse.json(
          { success: false, error: "Provide a valid workspace name." },
          { status: 400 }
        );
      }

      const selected = await findWorkspace(workspace);
      if (!selected) {
        return NextResponse.json(
          { success: false, error: `Workspace "${workspace}" was not found.` },
          { status: 404 }
        );
      }

      const opened = await runP4TaggedForClient(workspace, ["opened"]);
      return NextResponse.json({
        success: true,
        workspace,
        opened,
        count: opened.length,
      });
    }

    if (action === "list") {
      const records = await runP4Tagged(["clients"]);
      const workspaces = records.map(mapWorkspace);
      return NextResponse.json({
        success: true,
        count: workspaces.length,
        workspaces,
      });
    }

    return NextResponse.json(
      { success: false, error: "Unknown action. Use list, files, opened, or diff." },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: errorMessage(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.action === "checkout") {
      const workspace =
        typeof body.workspace === "string" ? body.workspace.trim() : "";
      const depotFile =
        typeof body.depotFile === "string" ? body.depotFile.trim() : "";

      if (!validWorkspaceName(workspace)) {
        return NextResponse.json(
          { success: false, error: "Invalid workspace name." },
          { status: 400 }
        );
      }
      if (!validDepotFile(depotFile)) {
        return NextResponse.json(
          { success: false, error: "Invalid depot file path." },
          { status: 400 }
        );
      }

      const selected = await findWorkspace(workspace);
      if (!selected) {
        return NextResponse.json(
          { success: false, error: "Workspace not found." },
          { status: 404 }
        );
      }

      const syncedFiles = await runP4TaggedForClient(workspace, ["have"]);
      const fileExists = syncedFiles.some(
        (record) => field(record, "depotFile") === depotFile
      );
      if (!fileExists) {
        return NextResponse.json(
          { success: false, error: "File is not synced in this workspace." },
          { status: 404 }
        );
      }

      const openedFiles = await runP4TaggedForClient(workspace, ["opened"]);
      const alreadyOpened = openedFiles.some(
        (record) => field(record, "depotFile") === depotFile
      );
      if (alreadyOpened) {
        return NextResponse.json({
          success: true,
          workspace,
          depotFile,
          alreadyOpened: true,
          message: "This file is already checked out in this workspace.",
        });
      }

      const output = await runP4TextForClient(workspace, ["edit", depotFile]);
      return NextResponse.json({
        success: true,
        workspace,
        depotFile,
        alreadyOpened: false,
        message: "File checked out successfully.",
        output,
      });
    }

    if (body.action === "submit") {
      const workspace =
        typeof body.workspace === "string" ? body.workspace.trim() : "";
      const description =
        typeof body.description === "string" ? body.description.trim() : "";

      if (!validWorkspaceName(workspace)) {
        return NextResponse.json(
          { success: false, error: "Invalid workspace name." },
          { status: 400 }
        );
      }
      if (!description || description.length > 250 || /[\r\n]/.test(description)) {
        return NextResponse.json(
          {
            success: false,
            error: "Submit description must be 1–250 characters on one line.",
          },
          { status: 400 }
        );
      }

      const selected = await findWorkspace(workspace);
      if (!selected) {
        return NextResponse.json(
          { success: false, error: "Workspace not found." },
          { status: 404 }
        );
      }

      const openedFiles = await runP4TaggedForClient(workspace, ["opened"]);
      const defaultFiles = openedFiles.filter((record) => {
        const change = field(record, "change").toLowerCase();
        return !change || change === "default";
      });
      if (defaultFiles.length === 0) {
        return NextResponse.json(
          { success: false, error: "There are no opened files in the default changelist to submit." },
          { status: 400 }
        );
      }

      // Submits only the selected workspace's default changelist.
      const output = await runP4TextForClient(workspace, [
        "submit",
        "-d",
        description,
      ]);

      return NextResponse.json({
        success: true,
        workspace,
        count: defaultFiles.length,
        message: "Changelist submitted successfully.",
        output,
      });
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const root = typeof body.root === "string" ? body.root.trim() : "";
    const stream = typeof body.stream === "string" ? body.stream.trim() : "";
    const description =
      typeof body.description === "string" ? body.description.trim() : "";

    if (!validWorkspaceName(name)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid workspace name. Use letters, numbers, underscores, or hyphens.",
        },
        { status: 400 }
      );
    }
    if (!/^[A-Za-z]:\\/.test(root) || /[\r\n]/.test(root)) {
      return NextResponse.json(
        { success: false, error: "Root must be an absolute Windows directory." },
        { status: 400 }
      );
    }
    if (
      !/^\/\/[^/]+\/.+/.test(stream) ||
      /[\r\n]/.test(stream) ||
      stream.includes("...")
    ) {
      return NextResponse.json(
        { success: false, error: "Enter a valid Perforce stream path." },
        { status: 400 }
      );
    }
    if (description.length > 250 || /[\r\n]/.test(description)) {
      return NextResponse.json(
        {
          success: false,
          error: "Description must be 250 characters or fewer and on one line.",
        },
        { status: 400 }
      );
    }

    const existing = await runP4Tagged(["clients"]);
    const duplicate = existing.some(
      (record) =>
        field(record, "client", "Client").toLowerCase() === name.toLowerCase()
    );
    if (duplicate) {
      return NextResponse.json(
        { success: false, error: `Workspace "${name}" already exists.` },
        { status: 409 }
      );
    }

    await runP4Tagged(["stream", "-o", stream]);
    await createWorkspaceFromStream({ name, root, stream, description });

    return NextResponse.json(
      {
        success: true,
        synced: false,
        message: `Workspace "${name}" created. Files have not been synced.`,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: errorMessage(error) },
      { status: 500 }
    );
  }
}
