
"use client";

import { useCallback, useEffect, useState } from "react";

type Workspace = {
  name: string;
  root: string;
  stream: string;
  owner?: string;
  description?: string;
};

type WorkspaceFile = {
  depotFile: string;
  revision: number;
  localPath: string;
};

type OpenedFile = {
  depotFile?: string;
  revision?: number;
  action?: string;
  changelist?: number;
  workspace?: string;
  raw?: string;
};

type ApiResponse = {
  success: boolean;
  message?: string;
  workspaces?: Workspace[];
  files?: WorkspaceFile[] | OpenedFile[];
  count?: number;
  root?: string;
  stream?: string;
  output?: string;
};

export default function WorkspaceBrowser() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState("Akilan2007_SCM");
  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [openedFiles, setOpenedFiles] = useState<OpenedFile[]>([]);
  const [view, setView] = useState<"files" | "opened">("files");
  const [root, setRoot] = useState("");
  const [stream, setStream] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingOut, setCheckingOut] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const loadWorkspaces = useCallback(async () => {
    try {
      const response = await fetch("/api/workspaces?action=list");
      const data: ApiResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not load workspaces.");
      }

      const items = data.workspaces || [];
      setWorkspaces(items);

      setSelectedWorkspace((current) => {
        if (items.some((workspace) => workspace.name === current)) {
          return current;
        }

        return items[0]?.name || "";
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load workspaces."
      );
    }
  }, []);

  const loadFiles = useCallback(async () => {
    if (!selectedWorkspace) {
      setFiles([]);
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `/api/workspaces?action=files&workspace=${encodeURIComponent(
          selectedWorkspace
        )}`
      );

      const data: ApiResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not load workspace files.");
      }

      setFiles((data.files || []) as WorkspaceFile[]);
      setRoot(data.root || "");
      setStream(data.stream || "");
    } catch (err) {
      setFiles([]);
      setError(
        err instanceof Error ? err.message : "Could not load workspace files."
      );
    } finally {
      setLoading(false);
    }
  }, [selectedWorkspace]);

  const loadOpenedFiles = useCallback(async () => {
    if (!selectedWorkspace) {
      setOpenedFiles([]);
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `/api/workspaces?action=opened&workspace=${encodeURIComponent(
          selectedWorkspace
        )}`
      );

      const data: ApiResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not load opened files.");
      }

      setOpenedFiles((data.files || []) as OpenedFile[]);
    } catch (err) {
      setOpenedFiles([]);
      setError(
        err instanceof Error ? err.message : "Could not load opened files."
      );
    } finally {
      setLoading(false);
    }
  }, [selectedWorkspace]);

  useEffect(() => {
    void loadWorkspaces();
  }, [loadWorkspaces]);

  useEffect(() => {
    if (view === "files") {
      void loadFiles();
    } else {
      void loadOpenedFiles();
    }
  }, [view, loadFiles, loadOpenedFiles]);

  async function checkoutFile(depotFile: string) {
    setCheckingOut(depotFile);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/workspaces", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "checkout",
          workspace: selectedWorkspace,
          depotFile,
        }),
      });

      const data: ApiResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Checkout failed.");
      }

      setMessage(data.message || "File checked out successfully.");

      await loadFiles();
      await loadOpenedFiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed.");
    } finally {
      setCheckingOut("");
    }
  }

  async function refreshCurrentView() {
    await loadWorkspaces();

    if (view === "files") {
      await loadFiles();
    } else {
      await loadOpenedFiles();
    }
  }

  async function copyPath(path: string) {
    try {
      await navigator.clipboard.writeText(path);
      setMessage("Local path copied to clipboard.");
      setError("");
    } catch {
      setError("Could not copy the path. Select and copy it manually.");
    }
  }

  const filteredFiles = files.filter((file) =>
    `${file.depotFile} ${file.localPath}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const filteredOpenedFiles = openedFiles.filter((file) =>
    `${file.depotFile || ""} ${file.raw || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-white/[0.07] bg-[#0e0b16]/90 p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white">
              Workspace Browser
            </h3>
            <p className="mt-1.5 text-sm text-slate-400">
              Browse synced files and check them out for editing.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void refreshCurrentView()}
            disabled={loading}
            className="rounded-xl border border-violet-400/20 bg-violet-500/10 px-4 py-2.5 text-xs font-semibold text-violet-200 transition hover:bg-violet-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-xs font-semibold text-slate-400">
              Select Workspace
            </span>

            <select
              value={selectedWorkspace}
              onChange={(event) => setSelectedWorkspace(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#100e19] px-3 py-3 text-sm text-slate-200 outline-none focus:border-violet-400/40"
            >
              {workspaces.length === 0 && (
                <option value="">No workspaces found</option>
              )}

              {workspaces.map((workspace) => (
                <option key={workspace.name} value={workspace.name}>
                  {workspace.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-semibold text-slate-400">
              Search Files
            </span>

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search depot path or local path..."
              className="w-full rounded-xl border border-white/10 bg-[#100e19] px-3 py-3 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-violet-400/40"
            />
          </label>
        </div>

        <div className="mt-5 space-y-2 rounded-xl border border-white/[0.06] bg-[#100e19] p-4">
          <div className="flex flex-wrap justify-between gap-2">
            <span className="text-xs text-slate-500">Workspace root</span>
            <span className="break-all text-right font-mono text-xs text-slate-300">
              {root || "Loading..."}
            </span>
          </div>

          <div className="flex flex-wrap justify-between gap-2">
            <span className="text-xs text-slate-500">Stream</span>
            <span className="break-all text-right font-mono text-xs text-violet-300">
              {stream || "—"}
            </span>
          </div>
        </div>

        {message && (
          <div
            role="status"
            className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] px-4 py-3 text-sm text-emerald-300"
          >
            {message}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/[0.06] px-4 py-3 text-sm text-rose-300"
          >
            {error}
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0e0b16]/90">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] p-5">
          <div>
            <h3 className="text-sm font-bold text-white">
              {view === "files" ? "Synced Files" : "Opened Files"}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              {view === "files"
                ? `${filteredFiles.length} matching file(s)`
                : `${filteredOpenedFiles.length} matching opened file(s)`}
            </p>
          </div>

          <div className="flex rounded-xl border border-white/[0.08] bg-[#100e19] p-1">
            <button
              type="button"
              onClick={() => {
                setView("files");
                setSearch("");
              }}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                view === "files"
                  ? "bg-violet-500/20 text-violet-200"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Synced Files
            </button>

            <button
              type="button"
              onClick={() => {
                setView("opened");
                setSearch("");
              }}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                view === "opened"
                  ? "bg-violet-500/20 text-violet-200"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Opened Files
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="bg-white/[0.02] text-[10px] uppercase tracking-wider text-slate-500">
              {view === "files" ? (
                <tr>
                  <th className="px-5 py-4 font-semibold">Depot File</th>
                  <th className="px-5 py-4 font-semibold">Revision</th>
                  <th className="px-5 py-4 font-semibold">Local Path</th>
                  <th className="px-5 py-4 font-semibold">Action</th>
                </tr>
              ) : (
                <tr>
                  <th className="px-5 py-4 font-semibold">Opened File</th>
                  <th className="px-5 py-4 font-semibold">Revision</th>
                  <th className="px-5 py-4 font-semibold">Action</th>
                  <th className="px-5 py-4 font-semibold">Changelist</th>
                </tr>
              )}
            </thead>

            <tbody className="divide-y divide-white/[0.05]">
              {view === "files" &&
                filteredFiles.map((file) => {
                  const isCheckingOut = checkingOut === file.depotFile;

                  const isOpened = openedFiles.some(
                    (opened) => opened.depotFile === file.depotFile
                  );

                  return (
                    <tr
                      key={file.depotFile}
                      className="transition hover:bg-violet-400/[0.025]"
                    >
                      <td className="max-w-[320px] break-all px-5 py-4 font-medium text-slate-200">
                        {file.depotFile}
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-lg border border-violet-400/15 bg-violet-400/[0.06] px-2 py-1 text-violet-300">
                          #{file.revision}
                        </span>
                      </td>

                      <td className="max-w-[280px] break-all px-5 py-4 font-mono text-[11px] text-slate-400">
                        {file.localPath}
                        <button
                          type="button"
                          onClick={() => void copyPath(file.localPath)}
                          className="ml-2 text-violet-300 hover:text-violet-200"
                        >
                          Copy
                        </button>
                      </td>

                      <td className="px-5 py-4">
                        <button
                          type="button"
                          disabled={isCheckingOut || isOpened}
                          onClick={() => void checkoutFile(file.depotFile)}
                          className="rounded-lg border border-violet-400/20 bg-violet-500/10 px-3 py-2 text-[11px] font-semibold text-violet-200 transition hover:bg-violet-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isCheckingOut
                            ? "Checking out..."
                            : isOpened
                              ? "Checked out"
                              : "Checkout"}
                        </button>
                      </td>
                    </tr>
                  );
                })}

              {view === "opened" &&
                filteredOpenedFiles.map((file, index) => (
                  <tr
                    key={`${file.depotFile || file.raw || "opened"}-${index}`}
                    className="transition hover:bg-violet-400/[0.025]"
                  >
                    <td className="max-w-[380px] break-all px-5 py-4 text-slate-200">
                      {file.depotFile || file.raw || "Opened file"}
                    </td>
                    <td className="px-5 py-4 text-slate-300">
                      {file.revision ? `#${file.revision}` : "—"}
                    </td>
                    <td className="px-5 py-4 text-emerald-300">
                      {file.action || "Opened"}
                    </td>
                    <td className="px-5 py-4 text-slate-300">
                      {file.changelist ?? "Default"}
                    </td>
                  </tr>
                ))}

              {!loading &&
                ((view === "files" && filteredFiles.length === 0) ||
                  (view === "opened" && filteredOpenedFiles.length === 0)) && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-12 text-center text-slate-500"
                    >
                      {view === "files"
                        ? "No synced files match your search."
                        : "No opened files match your search."}
                    </td>
                  </tr>
                )}

              {loading && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-10 text-center text-slate-500"
                  >
                    Loading Perforce data...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
