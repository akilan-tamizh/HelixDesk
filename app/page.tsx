"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Depot = {
  name: string;
  type: string;
  map: string;
  description: string;
  address?: string;
};

type Connection = {
  connected: boolean;
  message: string;
  server?: string;
  user?: string;
  workspace?: string;
  stream?: string;
  workspaceRoot?: string;
  serverVersion?: string;
  checkedAt?: string;
  error?: string;
};

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

type WorkspaceResponse = {
  success: boolean;
  count?: number;
  workspaces?: WorkspaceRecord[];
  message?: string;
  error?: string;
};
type WorkspaceFile = {
  depotFile: string;
  revision: string;
  localPath: string;
};

type WorkspaceFilesResponse = {
  success: boolean;
  workspace?: string;
  root?: string;
  stream?: string;
  files?: WorkspaceFile[];
  opened?: Array<Record<string, string>>;
  count?: number;
  message?: string;
  error?: string;
};
type DepotResponse = {
  success: boolean;
  count?: number;
  depots?: Depot[];
  message?: string;
  error?: string;
};

type Notice = {
  kind: "success" | "error" | "info";
  text: string;
};

const navigation = [
  { label: "Overview", section: "WORKSPACE", icon: "overview" },
  { label: "Depot Management", section: "PERFORCE", icon: "depots" },
  { label: "Workspaces", section: "PERFORCE", icon: "workspace" },
  { label: "Streams", section: "PERFORCE", icon: "streams" },
  { label: "Changelists", section: "VERSION CONTROL", icon: "changes" },
  { label: "File History", section: "VERSION CONTROL", icon: "history" },
  { label: "File Locks", section: "VERSION CONTROL", icon: "locks" },
  {
    label: "Reconcile Offline Work",
    section: "VERSION CONTROL",
    icon: "reconcile",
  },
];

function Icon({
  name,
  size = 18,
}: {
  name: string;
  size?: number;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  switch (name) {
    case "overview":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      );
    case "depots":
      return (
        <svg {...common}>
          <path d="M3 8.5 12 3l9 5.5v10L12 22l-9-3.5z" />
          <path d="M3.5 8.5 12 13l8.5-4.5M12 13v8.5" />
        </svg>
      );
    case "workspace":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M3 9h18M8 4v5" />
        </svg>
      );
    case "streams":
      return (
        <svg {...common}>
          <circle cx="6" cy="5" r="2" />
          <circle cx="18" cy="12" r="2" />
          <circle cx="6" cy="19" r="2" />
          <path d="M8 5h3a3 3 0 0 1 3 3v1a3 3 0 0 0 3 3M8 19h3a3 3 0 0 0 3-3v-1" />
        </svg>
      );
    case "changes":
      return (
        <svg {...common}>
          <path d="M8 4h10l3 3v13H8z" />
          <path d="M18 4v4h3M4 8v13h12M11 12h6M11 16h6" />
        </svg>
      );
    case "history":
      return (
        <svg {...common}>
          <path d="M3 12a9 9 0 1 0 2.6-6.4L3 8" />
          <path d="M3 3v5h5M12 7v5l3 2" />
        </svg>
      );
    case "locks":
      return (
        <svg {...common}>
          <rect x="4" y="10" width="16" height="11" rx="2" />
          <path d="M8 10V7a4 4 0 1 1 8 0v3M12 14v3" />
        </svg>
      );
    case "reconcile":
      return (
        <svg {...common}>
          <path d="M20 7v5h-5M4 17v-5h5" />
          <path d="M5.5 9A7 7 0 0 1 18 6l2 6M4 12l2 6a7 7 0 0 0 12.5-3" />
        </svg>
      );
    case "search":
      return (
        <svg {...common}>
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="m16 16 5 5" />
        </svg>
      );
    case "refresh":
      return (
        <svg {...common}>
          <path d="M20 7v5h-5M4 17v-5h5" />
          <path d="M5.5 9A7 7 0 0 1 18 6l2 6M4 12l2 6a7 7 0 0 0 12.5-3" />
        </svg>
      );
    case "plus":
      return (
        <svg {...common}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case "server":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="7" rx="2" />
          <rect x="3" y="14" width="18" height="7" rx="2" />
          <path d="M7 6.5h.01M7 17.5h.01M11 6.5h6M11 17.5h6" />
        </svg>
      );
    case "folder":
      return (
        <svg {...common}>
          <path d="M3 6a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        </svg>
      );
    case "arrow":
      return (
        <svg {...common}>
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      );
    case "shield":
      return (
        <svg {...common}>
          <path d="m12 3 8 3v5c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    case "close":
      return (
        <svg {...common}>
          <path d="m6 6 12 12M18 6 6 18" />
        </svg>
      );
    case "check":
      return (
        <svg {...common}>
          <path d="m5 12 4 4L19 6" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
  }
}

function HelixLogo() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-400/25 bg-violet-500/10">
        <svg
          viewBox="0 0 40 40"
          width="32"
          height="32"
          fill="none"
          aria-label="HelixDesk logo"
        >
          <path
            d="M7 12C12 4 23 5 29 12S32 25 24 29 10 29 8 22"
            stroke="#A78BFA"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M9 28C15 34 25 33 31 25S29 12 21 10 9 13 11 19"
            stroke="#7C3AED"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M13 15 27 25M13 25 27 15"
            stroke="#DDD6FE"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div>
        <div className="text-[17px] font-semibold tracking-tight text-white">
          Helix<span className="text-violet-300">Desk</span>
        </div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">
          Perforce control center
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 mt-6 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
      {children}
    </div>
  );
}

function StatusDot({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${
        active ? "bg-emerald-400" : "bg-red-400"
      }`}
    />
  );
}

function TypeBadge({ type }: { type: string }) {
  const normalized = type.toLowerCase();
  const style =
    normalized === "stream"
      ? "border-violet-400/20 bg-violet-400/10 text-violet-200"
      : normalized === "local"
        ? "border-sky-400/20 bg-sky-400/10 text-sky-200"
        : "border-zinc-700 bg-zinc-800 text-zinc-300";

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-1 text-[11px] font-medium capitalize ${style}`}
    >
      {type || "Unknown"}
    </span>
  );
}

function StatCard({
  label,
  value,
  detail,
  icon,
  accent = "violet",
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: string;
  accent?: "violet" | "emerald" | "blue" | "amber";
}) {
  const accents = {
    violet: "bg-violet-400/10 text-violet-300",
    emerald: "bg-emerald-400/10 text-emerald-300",
    blue: "bg-sky-400/10 text-sky-300",
    amber: "bg-amber-400/10 text-amber-300",
  };

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#111117] p-5 transition hover:border-violet-400/20">
      <div className="flex items-start justify-between">
        <span className="text-sm text-zinc-400">{label}</span>
        <span className={`rounded-xl p-2.5 ${accents[accent]}`}>
          <Icon name={icon} size={19} />
        </span>
      </div>
      <div className="mt-4 text-3xl font-semibold tracking-tight text-white">
        {value}
      </div>
      <div className="mt-2 text-xs text-zinc-500">{detail}</div>
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[250px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.015] px-6 text-center">
      <div className="mb-4 rounded-2xl border border-violet-400/15 bg-violet-400/[0.07] p-4 text-violet-300">
        <Icon name="server" size={25} />
      </div>
      <h3 className="text-base font-medium text-white">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">
        {description}
      </p>
    </div>
  );
}

interface StreamRecord {
  name: string;
  stream: string;
  type: string;
  parent: string;
  description: string;
  owner: string;
  updated: string;
}

interface StreamResponse {
  success: boolean;
  count: number;
  streams: StreamRecord[];
  message?: string;
  error?: string;
}
export default function Home() {
  const [activePage, setActivePage] = useState("Overview");
  const [connection, setConnection] = useState<Connection | null>(null);
  const [depots, setDepots] = useState<Depot[]>([]);
  const [workspaces, setWorkspaces] = useState<WorkspaceRecord[]>([]);
  const [streams, setStreams] = useState<StreamRecord[]>([]);
  const [streamsLoading, setStreamsLoading] = useState(false);
  const [streamSearch, setStreamSearch] = useState("");
  const [streamsError, setStreamsError] = useState("");

  const [moduleLoading, setModuleLoading] = useState(false);
  const [moduleError, setModuleError] = useState("");
  const [moduleData, setModuleData] = useState<Record<string, unknown> | null>(null);
  const [historyPath, setHistoryPath] = useState("//SCMProject/main/");
  const [fileSearch, setFileSearch] = useState("");
const [lockFilePath, setLockFilePath] = useState("");
const [lockActionLoading, setLockActionLoading] = useState(false);
const [lockActionMessage, setLockActionMessage] = useState("");
  const [workspacesLoading, setWorkspacesLoading] = useState(false);
  const [workspaceSearch, setWorkspaceSearch] = useState("");
  const [selectedWorkspace, setSelectedWorkspace] = useState("");
  const [workspaceFiles, setWorkspaceFiles] = useState<WorkspaceFile[]>([]);
  const [openedDepotFiles, setOpenedDepotFiles] = useState<string[]>([]);
  const [defaultChangelistFiles, setDefaultChangelistFiles] = useState<string[]>([]);
  const [workspaceFilesLoading, setWorkspaceFilesLoading] = useState(false);
  const [checkingOutFile, setCheckingOutFile] = useState("");
  const [submitDescription, setSubmitDescription] = useState("Update from HelixDesk");
  const [submittingWorkspace, setSubmittingWorkspace] = useState(false);
  const [diffFile, setDiffFile] = useState("");
  const [diffText, setDiffText] = useState("");
  const [diffLoading, setDiffLoading] = useState(false);
  const [showCreateWorkspaceForm, setShowCreateWorkspaceForm] = useState(false);
  const [creatingWorkspace, setCreatingWorkspace] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceRoot, setWorkspaceRoot] = useState("D:\\Perforce\\Workspace\\");
  const [workspaceStream, setWorkspaceStream] = useState("//SCMProject/main");
  const [workspaceDescription, setWorkspaceDescription] = useState("");
  const [connectionLoading, setConnectionLoading] = useState(true);
  const [depotsLoading, setDepotsLoading] = useState(true);
  const [depotSearch, setDepotSearch] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [depotName, setDepotName] = useState("");
  const [depotDescription, setDepotDescription] = useState("");
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);

  const loadConnection = useCallback(async () => {
    setConnectionLoading(true);

    try {
      const response = await fetch("/api/perforce", {
        cache: "no-store",
      });
      const data = (await response.json()) as Connection;
      setConnection(data);
    } catch {
      setConnection({
        connected: false,
        message: "Could not contact the HelixDesk API.",
        error: "Check whether the Next.js development server is running.",
      });
    } finally {
      setConnectionLoading(false);
    }
  }, []);

  const loadDepots = useCallback(async () => {
    setDepotsLoading(true);

    try {
      const response = await fetch("/api/depots", {
        cache: "no-store",
      });
      const data = (await response.json()) as DepotResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.error || data.message || "Unable to load depots.");
      }

      setDepots(data.depots || []);
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (error) {
      setNotice({
        kind: "error",
        text:
          error instanceof Error
            ? error.message
            : "Could not load depot information.",
      });
    } finally {
      setDepotsLoading(false);
    }
  }, []);

  const loadWorkspaces = useCallback(async () => {
    setWorkspacesLoading(true);
    try {
      const response = await fetch("/api/workspaces", { cache: "no-store" });
      const data = (await response.json()) as WorkspaceResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.error || data.message || "Unable to load workspaces.");
      }

      setWorkspaces(data.workspaces || []);
    } catch (error) {
      setNotice({
        kind: "error",
        text: error instanceof Error ? error.message : "Could not load workspaces.",
      });
    } finally {
      setWorkspacesLoading(false);
    }
  }, []);

  const loadStreams = useCallback(async () => {
    setStreamsLoading(true);
    setStreamsError("");

    try {
      const response = await fetch("/api/streams", {
        cache: "no-store",
      });

      const data = (await response.json()) as StreamResponse;

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || data.message || "Unable to load streams."
        );
      }

      setStreams(data.streams || []);
    } catch (error) {
      setStreamsError(
        error instanceof Error
          ? error.message
          : "Could not load streams."
      );
    } finally {
      setStreamsLoading(false);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([loadConnection(), loadDepots(), loadWorkspaces(), loadStreams()]);
  }, [loadConnection, loadDepots, loadWorkspaces, loadStreams]);

  const loadModule = useCallback(
    async (action: string, params: Record<string, string> = {}) => {
      setModuleLoading(true);
      setModuleError("");
      setModuleData(null);

      try {
        const query = new URLSearchParams({ action, ...params });
        const response = await fetch(`/api/modules?${query.toString()}`, {
          cache: "no-store",
        });

        const data = (await response.json()) as Record<string, unknown>;

        if (!response.ok || data.success !== true) {
          throw new Error(
            String(data.error || data.message || "Unable to load module data.")
          );
        }

        setModuleData(data);
      } catch (error) {
        setModuleError(
          error instanceof Error ? error.message : "Perforce request failed."
        );
      } finally {
        setModuleLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    if (!notice) return;

    const timer = window.setTimeout(() => setNotice(null), 6000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const filteredDepots = useMemo(() => {
    const query = depotSearch.trim().toLowerCase();

    if (!query) return depots;

    return depots.filter((depot) =>
      [
        depot.name,
        depot.type,
        depot.map,
        depot.description,
      ].some((value) => value.toLowerCase().includes(query))
    );
  }, [depots, depotSearch]);

  const filteredWorkspaces = useMemo(() => {
    const query = workspaceSearch.trim().toLowerCase();
    if (!query) return workspaces;

    return workspaces.filter((workspace) =>
      [
        workspace.name,
        workspace.owner,
        workspace.host,
        workspace.root,
        workspace.stream,
        workspace.description,
      ].some((value) => value.toLowerCase().includes(query))
    );
  }, [workspaces, workspaceSearch]);
  const filteredStreams = useMemo(() => {
    const query = streamSearch.trim().toLowerCase();

    if (!query) return streams;

    return streams.filter((stream) =>
      [
        stream.name,
        stream.stream,
        stream.type,
        stream.parent,
        stream.owner,
        stream.description,
      ].some((value) => (value || "").toLowerCase().includes(query))
    );
  }, [streams, streamSearch]);


  const loadWorkspaceBrowser = useCallback(async (workspace: string) => {
    setSelectedWorkspace(workspace);
    setWorkspaceFilesLoading(true);
    setNotice(null);

    try {
      const [filesResponse, openedResponse] = await Promise.all([
        fetch(`/api/workspaces?action=files&workspace=${encodeURIComponent(workspace)}`, { cache: "no-store" }),
        fetch(`/api/workspaces?action=opened&workspace=${encodeURIComponent(workspace)}`, { cache: "no-store" }),
      ]);
      const filesData = (await filesResponse.json()) as WorkspaceFilesResponse;
      const openedData = (await openedResponse.json()) as WorkspaceFilesResponse;

      if (!filesResponse.ok || !filesData.success) {
        throw new Error(filesData.error || "Unable to load workspace files.");
      }
      if (!openedResponse.ok || !openedData.success) {
        throw new Error(openedData.error || "Unable to load checked-out files.");
      }

      setWorkspaceFiles(filesData.files || []);
      const openedRecords = openedData.opened || [];
      setOpenedDepotFiles(
        openedRecords.map((record) => String(record.depotFile || "")).filter(Boolean)
      );
      setDefaultChangelistFiles(
        openedRecords
          .filter((record) => !record.change || String(record.change).toLowerCase() === "default")
          .map((record) => String(record.depotFile || ""))
          .filter(Boolean)
      );
    } catch (error) {
      setWorkspaceFiles([]);
      setOpenedDepotFiles([]);
      setDefaultChangelistFiles([]);
      setNotice({
        kind: "error",
        text: error instanceof Error ? error.message : "Unable to load workspace files.",
      });
    } finally {
      setWorkspaceFilesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activePage === "Changelists") {
      void loadModule("changelists");
      const workspace = selectedWorkspace || connection?.workspace || "";
      if (workspace) void loadWorkspaceBrowser(workspace);
    } else if (activePage === "File Locks") {
      void loadModule("locks");
    } else if (activePage === "Reconcile Offline Work") {
      void loadModule("reconcile");
    }
  }, [activePage, loadModule, selectedWorkspace, connection?.workspace, loadWorkspaceBrowser]);

  async function checkoutWorkspaceFile(file: WorkspaceFile) {
    if (!selectedWorkspace) return;
    setCheckingOutFile(file.depotFile);
    setNotice(null);

    try {
      const response = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "checkout",
          workspace: selectedWorkspace,
          depotFile: file.depotFile,
        }),
      });
      const data = (await response.json()) as { success: boolean; message?: string; error?: string };
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Checkout failed.");
      }

      setNotice({ kind: "success", text: data.message || `${file.depotFile} checked out.` });
      await loadWorkspaceBrowser(selectedWorkspace);
      if (activePage === "Changelists") await loadModule("changelists");
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "Checkout failed." });
    } finally {
      setCheckingOutFile("");
    }
  }

  async function showFileDiff(file: WorkspaceFile) {
    if (!selectedWorkspace) return;
    setDiffFile(file.depotFile);
    setDiffText("");
    setDiffLoading(true);
    try {
      const query = new URLSearchParams({
        action: "diff",
        workspace: selectedWorkspace,
        depotFile: file.depotFile,
      });
      const response = await fetch(`/api/workspaces?${query.toString()}`, { cache: "no-store" });
      const data = (await response.json()) as { success: boolean; diff?: string; error?: string };
      if (!response.ok || !data.success) throw new Error(data.error || "Unable to generate diff.");
      setDiffText(data.diff || "No differences found.");
    } catch (error) {
      setDiffText(error instanceof Error ? `Diff failed: ${error.message}` : "Diff failed.");
    } finally {
      setDiffLoading(false);
    }
  }

  async function submitWorkspaceChanges() {
    if (!selectedWorkspace) return;
    const description = submitDescription.trim();
    if (!description || description.length > 250 || /[\r\n]/.test(description)) {
      setNotice({ kind: "error", text: "Enter a one-line changelist description (1–250 characters)." });
      return;
    }
    if (defaultChangelistFiles.length === 0) {
      setNotice({ kind: "info", text: "There are no checked-out files in this workspace's default changelist to submit." });
      return;
    }
    const confirmed = window.confirm(
      `Submit ${defaultChangelistFiles.length} file(s) in the default changelist for workspace "${selectedWorkspace}"? This creates a new Perforce revision.`
    );
    if (!confirmed) return;

    setSubmittingWorkspace(true);
    setNotice(null);
    try {
      const response = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "submit", workspace: selectedWorkspace, description }),
      });
      const data = (await response.json()) as { success: boolean; message?: string; output?: string; error?: string };
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Submit failed.");
      }
      setNotice({ kind: "success", text: data.message || data.output || "Changelist submitted." });
      await loadWorkspaceBrowser(selectedWorkspace);
      void loadModule("changelists");
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "Submit failed." });
    } finally {
      setSubmittingWorkspace(false);
    }
  }

  async function createWorkspace(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = workspaceName.trim();
    const root = workspaceRoot.trim();
    const stream = workspaceStream.trim();
    const description = workspaceDescription.trim();

    if (!/^[A-Za-z0-9_-]{1,100}$/.test(name)) {
      setNotice({ kind: "error", text: "Use 1–100 letters, numbers, underscores, or hyphens for the workspace name." });
      return;
    }

    if (!/^[A-Za-z]:\\/.test(root)) {
      setNotice({ kind: "error", text: "Enter an absolute Windows root directory, such as D:\\Perforce\\Workspace\\MyWorkspace." });
      return;
    }

    if (!stream.startsWith("//") || stream.split("/").filter(Boolean).length < 2) {
      setNotice({ kind: "error", text: "Enter a valid stream path, such as //SCMProject/main." });
      return;
    }

    if (description.length > 250) {
      setNotice({ kind: "error", text: "The description cannot exceed 250 characters." });
      return;
    }

    if (workspaces.some((workspace) => workspace.name.toLowerCase() === name.toLowerCase())) {
      setNotice({ kind: "error", text: `Workspace "${name}" is already listed.` });
      return;
    }

    if (!window.confirm(`Create Perforce workspace "${name}" for stream "${stream}"?\\n\\nThis changes Perforce server configuration. It will not sync files.`)) return;

    setCreatingWorkspace(true);
    setNotice(null);

    try {
      const response = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, root, stream, description }),
      });

      const data = (await response.json()) as WorkspaceResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.error || data.message || "Unable to create workspace.");
      }

      setNotice({ kind: "success", text: data.message || `Workspace "${name}" created. Files have not been synced.` });
      setWorkspaceName("");
      setWorkspaceDescription("");
      setShowCreateWorkspaceForm(false);
      await loadWorkspaces();
    } catch (error) {
      setNotice({
        kind: "error",
        text: error instanceof Error ? error.message : "Could not create workspace.",
      });
    } finally {
      setCreatingWorkspace(false);
    }
  }
  async function createDepot(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = depotName.trim();
    const description = depotDescription.trim();

    if (!/^[A-Za-z0-9_-]{1,64}$/.test(name)) {
      setNotice({
        kind: "error",
        text: "Use 1–64 letters, numbers, underscores, or hyphens for the depot name.",
      });
      return;
    }

    if (description.length > 250) {
      setNotice({
        kind: "error",
        text: "The description cannot exceed 250 characters.",
      });
      return;
    }

    if (
      depots.some(
        (depot) => depot.name.toLowerCase() === name.toLowerCase()
      )
    ) {
      setNotice({
        kind: "error",
        text: `A depot named "${name}" is already listed.`,
      });
      return;
    }

    const confirmed = window.confirm(
      `Create the local depot "${name}" on your Perforce server?\n\nThis changes server configuration. Continue only if you have permission and intend to create it.`
    );

    if (!confirmed) return;

    setCreating(true);
    setNotice(null);

    try {
      const response = await fetch("/api/depots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });

      const data = (await response.json()) as {
        success: boolean;
        message?: string;
        error?: string;
      };

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || data.message || "Depot creation failed."
        );
      }

      setDepotName("");
      setDepotDescription("");
      setShowCreateForm(false);

      setNotice({
        kind: "success",
        text: data.message || `Depot "${name}" created successfully.`,
      });

      await loadDepots();
    } catch (error) {
      setNotice({
        kind: "error",
        text:
          error instanceof Error
            ? error.message
            : "Could not create the depot.",
      });
    } finally {
      setCreating(false);
    }
  }

  const streamDepotCount = depots.filter(
    (depot) => depot.type.toLowerCase() === "stream"
  ).length;

  const localDepotCount = depots.filter(
    (depot) => depot.type.toLowerCase() === "local"
  ).length;

  return (
    <main className="min-h-screen bg-[#09090d] text-zinc-200">
      <div className="flex min-h-screen">
        <aside className="hidden w-[255px] shrink-0 border-r border-white/[0.07] bg-[#0d0c12] px-4 py-6 lg:flex lg:flex-col">
          <div className="px-2">
            <HelixLogo />
          </div>

          <div className="mt-10">
            <SectionLabel>Workspace</SectionLabel>
            {navigation
              .filter((item) => item.section === "WORKSPACE")
              .map((item) => (
                <button
                  key={item.label}
                  onClick={() => setActivePage(item.label)}
                  className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] transition ${
                    activePage === item.label
                      ? "border border-violet-400/15 bg-violet-500/[0.12] text-violet-200"
                      : "text-zinc-400 hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  <Icon name={item.icon} />
                  {item.label}
                  {activePage === item.label && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-violet-300" />
                  )}
                </button>
              ))}

            <SectionLabel>Perforce</SectionLabel>
            {navigation
              .filter((item) => item.section === "PERFORCE")
              .map((item) => (
                <button
                  key={item.label}
                  onClick={() => setActivePage(item.label)}
                  className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] transition ${
                    activePage === item.label
                      ? "border border-violet-400/15 bg-violet-500/[0.12] text-violet-200"
                      : "text-zinc-400 hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  <Icon name={item.icon} />
                  <span>{item.label}</span>
                  {activePage === item.label && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-violet-300" />
                  )}
                </button>
              ))}

            <SectionLabel>Version control</SectionLabel>
            {navigation
              .filter((item) => item.section === "VERSION CONTROL")
              .map((item) => (
                <button
                  key={item.label}
                  onClick={() => setActivePage(item.label)}
                  className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] transition ${
                    activePage === item.label
                      ? "border border-violet-400/15 bg-violet-500/[0.12] text-violet-200"
                      : "text-zinc-400 hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  <Icon name={item.icon} />
                  <span>{item.label}</span>
                  {activePage === item.label && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-violet-300" />
                  )}
                </button>
              ))}
          </div>

          <div className="mt-auto rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-300">
              <StatusDot active={!!connection?.connected} />
              Server connection
            </div>
            <div className="mt-2 break-all text-xs text-zinc-500">
              {connection?.server || "Checking server..."}
            </div>
            <div className="mt-3 flex items-center gap-2 border-t border-white/[0.06] pt-3 text-[11px] text-zinc-600">
              <Icon name="shield" size={14} />
              Local development environment
            </div>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-white/[0.07] bg-[#09090d]/90 px-5 py-4 backdrop-blur-xl md:px-8">
            <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="lg:hidden">
                  <HelixLogo />
                </div>
                <div className="hidden lg:block">
                  <div className="text-xs text-zinc-500">
                    HelixDesk <span className="mx-2 text-zinc-700">/</span>
                    <span className="text-zinc-300">{activePage}</span>
                  </div>
                  <h1 className="mt-1 text-lg font-semibold tracking-tight text-white">
                    {activePage}
                  </h1>
                </div>
                <div className="lg:hidden">
                  <h1 className="text-base font-semibold text-white">
                    {activePage}
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.025] px-3 py-2 text-xs sm:flex">
                  <StatusDot active={!!connection?.connected} />
                  <span className="text-zinc-400">
                    {connectionLoading
                      ? "Connecting..."
                      : connection?.connected
                        ? "Connected"
                        : "Disconnected"}
                  </span>
                </div>
                <button
                  onClick={() => void refreshAll()}
                  disabled={connectionLoading || depotsLoading}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-xs font-medium text-zinc-300 transition hover:border-violet-400/30 hover:bg-violet-400/[0.07] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Icon name="refresh" size={15} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              </div>
            </div>

            <div className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
              {navigation.map((item) => (
                <button
                  key={item.label}
                  onClick={() => setActivePage(item.label)}
                  className={`shrink-0 rounded-lg px-3 py-2 text-xs ${
                    activePage === item.label
                      ? "bg-violet-500/15 text-violet-200"
                      : "bg-white/[0.035] text-zinc-400"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </header>

          <div className="mx-auto max-w-[1500px] space-y-7 px-5 py-7 md:px-8 md:py-9">
            {notice && (
              <div
                role="status"
                className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
                  notice.kind === "success"
                    ? "border-emerald-400/20 bg-emerald-400/[0.07] text-emerald-200"
                    : notice.kind === "error"
                      ? "border-red-400/20 bg-red-400/[0.07] text-red-200"
                      : "border-sky-400/20 bg-sky-400/[0.07] text-sky-200"
                }`}
              >
                <Icon
                  name={notice.kind === "success" ? "check" : "close"}
                  size={17}
                />
                <span className="flex-1 break-words">{notice.text}</span>
                <button
                  onClick={() => setNotice(null)}
                  aria-label="Dismiss notification"
                  className="opacity-70 hover:opacity-100"
                >
                  <Icon name="close" size={15} />
                </button>
              </div>
            )}

            {activePage === "Overview" && (
              <>
                <div className="relative overflow-hidden rounded-3xl border border-violet-400/[0.16] bg-gradient-to-br from-[#191126] via-[#111019] to-[#101016] p-6 md:p-9">
                  <div className="pointer-events-none absolute -right-16 -top-28 h-72 w-72 rounded-full bg-violet-600/[0.13] blur-3xl" />
                  <div className="pointer-events-none absolute bottom-0 right-[25%] h-24 w-64 rounded-full bg-indigo-500/[0.07] blur-3xl" />

                  <div className="relative flex flex-col justify-between gap-7 md:flex-row md:items-center">
                    <div className="max-w-2xl">
                      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-300/15 bg-violet-300/[0.08] px-3 py-1.5 text-[11px] font-medium text-violet-200">
                        <StatusDot active={!!connection?.connected} />
                        PERFORCE HELIX CORE
                      </div>
                      <h2 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
                        Your version control,
                        <br className="hidden sm:block" />{" "}
                        <span className="text-violet-300">
                          under one roof.
                        </span>
                      </h2>
                      <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-400">
                        Monitor your Perforce server, inspect depots, and manage
                        source-control resources from one local dashboard.
                      </p>
                    </div>

                    <div className="relative min-w-[220px] rounded-2xl border border-white/[0.09] bg-black/20 p-5">
                      <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <Icon name="server" size={15} />
                        SERVER STATUS
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <StatusDot active={!!connection?.connected} />
                        <span className="text-lg font-semibold text-white">
                          {connectionLoading
                            ? "Connecting..."
                            : connection?.connected
                              ? "Operational"
                              : "Unavailable"}
                        </span>
                      </div>
                      <div className="mt-2 break-all text-xs text-zinc-400">
                        {connection?.server || "Waiting for API response"}
                      </div>
                      <div className="mt-4 border-t border-white/[0.07] pt-3 text-xs text-zinc-500">
                        {connection?.user || "Perforce user pending"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard
                    label="Total depots"
                    value={depotsLoading ? "—" : depots.length}
                    detail="Retrieved from Perforce"
                    icon="depots"
                    accent="violet"
                  />
                  <StatCard
                    label="Stream depots"
                    value={depotsLoading ? "—" : streamDepotCount}
                    detail="Depots using stream storage"
                    icon="streams"
                    accent="blue"
                  />
                  <StatCard
                    label="Local depots"
                    value={depotsLoading ? "—" : localDepotCount}
                    detail="Depots using local storage"
                    icon="folder"
                    accent="emerald"
                  />
                  <StatCard
                    label="Server connection"
                    value={
                      connectionLoading
                        ? "Checking"
                        : connection?.connected
                          ? "Online"
                          : "Offline"
                    }
                    detail={connection?.serverVersion || "Server version pending"}
                    icon="server"
                    accent={connection?.connected ? "emerald" : "amber"}
                  />
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
                  <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111117]">
                    <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
                      <div>
                        <h3 className="text-sm font-semibold text-white">
                          Depot registry
                        </h3>
                        <p className="mt-1 text-xs text-zinc-500">
                          Live data from your Perforce server
                        </p>
                      </div>
                      <button
                        onClick={() => setActivePage("Depot Management")}
                        className="inline-flex items-center gap-1 text-xs text-violet-300 hover:text-violet-200"
                      >
                        View all <Icon name="arrow" size={14} />
                      </button>
                    </div>

                    {depotsLoading ? (
                      <div className="space-y-4 p-5">
                        {[1, 2, 3].map((item) => (
                          <div
                            key={item}
                            className="h-14 animate-pulse rounded-xl bg-white/[0.035]"
                          />
                        ))}
                      </div>
                    ) : depots.length === 0 ? (
                      <div className="p-6 text-sm text-zinc-500">
                        No depots were returned. Refresh to check the server
                        again.
                      </div>
                    ) : (
                      <div className="divide-y divide-white/[0.05]">
                        {depots.slice(0, 5).map((depot) => (
                          <div
                            key={depot.name}
                            className="flex items-center gap-3 px-5 py-4 transition hover:bg-white/[0.02]"
                          >
                            <div className="rounded-xl border border-violet-400/10 bg-violet-400/[0.07] p-2.5 text-violet-300">
                              <Icon name="depots" size={17} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-medium text-zinc-200">
                                {depot.name}
                              </div>
                              <div className="mt-1 truncate font-mono text-[11px] text-zinc-500">
                                {depot.map || "No mapping returned"}
                              </div>
                            </div>
                            <TypeBadge type={depot.type} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl border border-white/[0.07] bg-[#111117] p-5">
                    <div className="flex items-center gap-2">
                      <div className="rounded-xl bg-violet-400/10 p-2.5 text-violet-300">
                        <Icon name="workspace" size={18} />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white">
                          Active workspace
                        </h3>
                        <p className="mt-1 text-xs text-zinc-500">
                          Current CLI configuration
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 space-y-4">
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-zinc-600">
                          Workspace name
                        </div>
                        <div className="mt-1 break-all text-sm text-zinc-200">
                          {connection?.workspace || "Not available"}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-zinc-600">
                          Current stream
                        </div>
                        <div className="mt-1 break-all font-mono text-xs text-violet-200">
                          {connection?.stream || "Not reported"}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-zinc-600">
                          Workspace root
                        </div>
                        <div className="mt-1 break-all font-mono text-xs leading-5 text-zinc-400">
                          {connection?.workspaceRoot || "Not reported"}
                        </div>
                      </div>
                      <div className="border-t border-white/[0.06] pt-4">
                        <div className="text-[10px] uppercase tracking-wider text-zinc-600">
                          Last refreshed
                        </div>
                        <div className="mt-1 text-xs text-zinc-400">
                          {lastRefreshed || "Loading..."}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/[0.07] bg-[#111117] p-5 md:p-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-emerald-400/10 p-2.5 text-emerald-300">
                      <Icon name="shield" size={19} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">
                        Connection diagnostics
                      </h3>
                      <p className="mt-1 text-xs text-zinc-500">
                        Status reported by the local API
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {[
                      ["API status", connection?.connected ? "Connected" : connectionLoading ? "Checking" : "Disconnected"],
                      ["Server address", connection?.server || "Unavailable"],
                      ["Perforce user", connection?.user || "Unavailable"],
                      ["Client workspace", connection?.workspace || "Unavailable"],
                      ["Server version", connection?.serverVersion || "Unavailable"],
                      ["Last API check", connection?.checkedAt ? new Date(connection.checkedAt).toLocaleString() : "Not available"],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="min-w-0 rounded-xl border border-white/[0.06] bg-black/10 p-4"
                      >
                        <div className="text-[10px] uppercase tracking-wider text-zinc-600">
                          {label}
                        </div>
                        <div className="mt-2 break-words text-sm text-zinc-300">
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>
                  {connection?.error && (
                    <p className="mt-4 break-words text-xs text-red-300">
                      {connection.error}
                    </p>
                  )}
                </div>
              </>
            )}

            {activePage === "Depot Management" && (
              <>
                <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
                  <div>
                    <div className="mb-2 flex items-center gap-2 text-xs text-violet-300">
                      <Icon name="depots" size={15} />
                      PERFORCE RESOURCE MANAGEMENT
                    </div>
                    <h2 className="text-2xl font-semibold tracking-tight text-white">
                      Depot Management
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                      Inspect depots on your Perforce server and create a new
                      local depot when your account has the required
                      permissions.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowCreateForm((current) => !current);
                      setNotice(null);
                    }}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-violet-400"
                  >
                    <Icon name={showCreateForm ? "close" : "plus"} size={17} />
                    {showCreateForm ? "Cancel" : "Create depot"}
                  </button>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <StatCard
                    label="All depots"
                    value={depotsLoading ? "—" : depots.length}
                    detail="Total visible to this user"
                    icon="depots"
                  />
                  <StatCard
                    label="Stream depots"
                    value={depotsLoading ? "—" : streamDepotCount}
                    detail="Stream-based repositories"
                    icon="streams"
                    accent="blue"
                  />
                  <StatCard
                    label="Local depots"
                    value={depotsLoading ? "—" : localDepotCount}
                    detail="Traditional depot storage"
                    icon="folder"
                    accent="emerald"
                  />
                </div>

                {showCreateForm && (
                  <div className="rounded-2xl border border-violet-400/20 bg-[#12101a] p-5 md:p-7">
                    <div className="mb-5 flex items-start gap-3">
                      <div className="rounded-xl bg-violet-400/10 p-2.5 text-violet-300">
                        <Icon name="plus" size={19} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">
                          Create a local depot
                        </h3>
                        <p className="mt-1 text-xs leading-5 text-zinc-500">
                          The form submits a depot specification to Perforce.
                          Your server may reject it if your account lacks
                          administrative permissions.
                        </p>
                      </div>
                    </div>

                    <form onSubmit={createDepot} className="space-y-5">
                      <div className="grid gap-5 md:grid-cols-2">
                        <label className="block">
                          <span className="mb-2 block text-xs font-medium text-zinc-300">
                            Depot name <span className="text-red-300">*</span>
                          </span>
                          <input
                            value={depotName}
                            onChange={(event) =>
                              setDepotName(event.target.value)
                            }
                            required
                            minLength={1}
                            maxLength={64}
                            pattern="[A-Za-z0-9_-]+"
                            placeholder="e.g. Documentation"
                            className="w-full rounded-xl border border-white/10 bg-[#09090d] px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-violet-400/50 focus:ring-2 focus:ring-violet-400/10"
                          />
                          <span className="mt-2 block text-[11px] text-zinc-600">
                            Letters, numbers, underscores, and hyphens only.
                          </span>
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-xs font-medium text-zinc-300">
                            Depot type
                          </span>
                          <div className="rounded-xl border border-white/10 bg-[#09090d] px-4 py-3 text-sm text-zinc-300">
                            Local
                            <span className="ml-2 text-xs text-zinc-600">
                              Fixed by this API
                            </span>
                          </div>
                          <span className="mt-2 block text-[11px] text-zinc-600">
                            Stream depots require a different specification
                            and workflow.
                          </span>
                        </label>
                      </div>

                      <label className="block">
                        <span className="mb-2 block text-xs font-medium text-zinc-300">
                          Description
                        </span>
                        <textarea
                          value={depotDescription}
                          onChange={(event) =>
                            setDepotDescription(event.target.value)
                          }
                          maxLength={250}
                          rows={3}
                          placeholder="Describe the purpose of this depot..."
                          className="w-full resize-y rounded-xl border border-white/10 bg-[#09090d] px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-violet-400/50 focus:ring-2 focus:ring-violet-400/10"
                        />
                        <div className="mt-1 text-right text-[11px] text-zinc-600">
                          {depotDescription.length}/250
                        </div>
                      </label>

                      <div className="flex items-start gap-3 rounded-xl border border-amber-400/15 bg-amber-400/[0.04] p-4">
                        <Icon
                          name="shield"
                          size={17}
                        />
                        <p className="text-xs leading-5 text-amber-100/70">
                          Creating a depot modifies server configuration.
                          Confirm the name and purpose before proceeding. This
                          action is not a file upload and does not create a
                          workspace.
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <button
                          type="submit"
                          disabled={creating || !connection?.connected}
                          className="inline-flex items-center gap-2 rounded-xl bg-violet-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {creating ? (
                            <>
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <Icon name="check" size={16} />
                              Create depot
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowCreateForm(false);
                            setDepotName("");
                            setDepotDescription("");
                          }}
                          className="rounded-xl border border-white/10 px-5 py-3 text-sm text-zinc-400 transition hover:bg-white/[0.04] hover:text-white"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111117]">
                  <div className="flex flex-col gap-4 border-b border-white/[0.07] p-5 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-white">
                        Depot registry
                      </h3>
                      <p className="mt-1 text-xs text-zinc-500">
                        {depotsLoading
                          ? "Retrieving depots..."
                          : `${filteredDepots.length} of ${depots.length} depots shown`}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600">
                          <Icon name="search" size={16} />
                        </span>
                        <input
                          value={depotSearch}
                          onChange={(event) =>
                            setDepotSearch(event.target.value)
                          }
                          placeholder="Search depots..."
                          className="w-full rounded-xl border border-white/10 bg-black/20 py-2.5 pl-9 pr-3 text-xs text-white outline-none placeholder:text-zinc-600 focus:border-violet-400/40 sm:w-56"
                        />
                      </div>
                      <button
                        onClick={() => void loadDepots()}
                        disabled={depotsLoading}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-xs text-zinc-300 hover:bg-white/[0.04] disabled:opacity-50"
                      >
                        <Icon name="refresh" size={14} />
                        Refresh list
                      </button>
                    </div>
                  </div>

                  {depotsLoading ? (
                    <div className="space-y-3 p-5">
                      {[1, 2, 3].map((item) => (
                        <div
                          key={item}
                          className="h-16 animate-pulse rounded-xl bg-white/[0.035]"
                        />
                      ))}
                    </div>
                  ) : filteredDepots.length === 0 ? (
                    <div className="p-6">
                      <EmptyState
                        title={
                          depots.length === 0
                            ? "No depots available"
                            : "No matching depots"
                        }
                        description={
                          depots.length === 0
                            ? "Refresh the list or check your Perforce permissions and server connection."
                            : "Try another search term to find a depot."
                        }
                      />
                    </div>
                  ) : (
                    <>
                      <div className="hidden grid-cols-[1.1fr_0.65fr_1fr_1.5fr] gap-4 border-b border-white/[0.05] bg-white/[0.015] px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-600 md:grid">
                        <div>Depot</div>
                        <div>Type</div>
                        <div>Mapping</div>
                        <div>Description</div>
                      </div>

                      <div className="divide-y divide-white/[0.05]">
                        {filteredDepots.map((depot) => (
                          <div
                            key={depot.name}
                            className="grid gap-3 px-5 py-4 transition hover:bg-white/[0.02] md:grid-cols-[1.1fr_0.65fr_1fr_1.5fr] md:items-center md:gap-4"
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="rounded-xl border border-violet-400/10 bg-violet-400/[0.07] p-2.5 text-violet-300">
                                <Icon name="depots" size={17} />
                              </div>
                              <div className="min-w-0">
                                <div className="truncate text-sm font-medium text-zinc-200">
                                  {depot.name}
                                </div>
                                <div className="mt-1 text-[10px] text-zinc-600">
                                  Perforce depot
                                </div>
                              </div>
                            </div>

                            <div>
                              <span className="mb-1 block text-[10px] text-zinc-600 md:hidden">
                                Type
                              </span>
                              <TypeBadge type={depot.type} />
                            </div>

                            <div className="min-w-0">
                              <span className="mb-1 block text-[10px] text-zinc-600 md:hidden">
                                Mapping
                              </span>
                              <code className="break-all text-xs text-violet-200/80">
                                {depot.map || "Not reported"}
                              </code>
                            </div>

                            <div className="break-words text-xs leading-5 text-zinc-500">
                              <span className="mb-1 block text-[10px] text-zinc-600 md:hidden">
                                Description
                              </span>
                              {depot.description || "No description"}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] px-5 py-3 text-[11px] text-zinc-600">
                    <span>
                      Source: Perforce server · {connection?.server || "Unknown server"}
                    </span>
                    <span>
                      Last refreshed: {lastRefreshed || "Not yet refreshed"}
                    </span>
                  </div>
                </div>
              </>
            )}

            {activePage === "Workspaces" && (
              <div className="space-y-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                  <div>
                    <div className="mb-2 flex items-center gap-2 text-xs text-violet-300">
                      <Icon name="workspace" size={15} />
                      HELIXDESK MODULE
                    </div>
                    <h2 className="text-2xl font-semibold tracking-tight text-white">Workspaces</h2>
                    <p className="mt-2 text-sm text-zinc-500">
                      Manage Perforce client workspaces connected to your server.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void loadWorkspaces()}
                      disabled={workspacesLoading}
                      className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5 disabled:opacity-50"
                    >
                      <span className="inline-flex items-center gap-2">
                        <Icon name="refresh" size={14} />
                        {workspacesLoading ? "Refreshing..." : "Refresh"}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateWorkspaceForm((value) => !value)}
                      className="rounded-xl border border-violet-400/30 bg-violet-500/15 px-4 py-2 text-sm text-violet-200 hover:bg-violet-500/25"
                    >
                      <span className="inline-flex items-center gap-2">
                        <Icon name="plus" size={14} />
                        Create workspace
                      </span>
                    </button>
                  </div>
                </div>

                {showCreateWorkspaceForm && (
                  <form
                    onSubmit={createWorkspace}
                    className="space-y-4 rounded-2xl border border-violet-400/20 bg-[#111117] p-5"
                  >
                    <h3 className="text-sm font-semibold text-white">New workspace</h3>
                    <p className="text-xs text-zinc-500">
                      Creates the Perforce client specification. This does not sync files.
                    </p>
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="space-y-2 text-xs text-zinc-400">
                        Workspace name *
                        <input required value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)} placeholder="MyWorkspace" className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-400/50" />
                      </label>
                      <label className="space-y-2 text-xs text-zinc-400">
                        Stream path *
                        <input required value={workspaceStream} onChange={(e) => setWorkspaceStream(e.target.value)} placeholder="//SCMProject/main" className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-400/50" />
                      </label>
                      <label className="space-y-2 text-xs text-zinc-400 md:col-span-2">
                        Workspace root directory *
                        <input required value={workspaceRoot} onChange={(e) => setWorkspaceRoot(e.target.value)} placeholder="D:\Perforce\Workspace\MyWorkspace" className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-400/50" />
                      </label>
                      <label className="space-y-2 text-xs text-zinc-400 md:col-span-2">
                        Description
                        <input value={workspaceDescription} onChange={(e) => setWorkspaceDescription(e.target.value)} maxLength={250} placeholder="Optional description" className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-400/50" />
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" disabled={creatingWorkspace} className="rounded-lg bg-violet-500 px-4 py-2 text-sm font-medium text-white hover:bg-violet-400 disabled:opacity-50">
                        {creatingWorkspace ? "Creating..." : "Create workspace"}
                      </button>
                      <button type="button" onClick={() => setShowCreateWorkspaceForm(false)} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5">
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-white/[0.07] bg-[#111117] p-4">
                    <div className="text-xs text-zinc-500">Total workspaces</div>
                    <div className="mt-2 text-2xl font-semibold text-white">{workspaces.length}</div>
                  </div>
                  <div className="rounded-xl border border-white/[0.07] bg-[#111117] p-4">
                    <div className="text-xs text-zinc-500">Current user</div>
                    <div className="mt-2 truncate text-sm text-zinc-200">{connection?.user || "Unavailable"}</div>
                  </div>
                  <div className="rounded-xl border border-white/[0.07] bg-[#111117] p-4">
                    <div className="text-xs text-zinc-500">Perforce connection</div>
                    <div className="mt-2 text-sm text-zinc-200">{connection?.connected ? "Connected" : "Not connected"}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-[#111117] px-4">
                  <Icon name="search" size={16} />
                  <input value={workspaceSearch} onChange={(e) => setWorkspaceSearch(e.target.value)} placeholder="Search by name, owner, root, or stream..." className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-zinc-600" />
                  <span className="whitespace-nowrap text-xs text-zinc-500">{filteredWorkspaces.length} results</span>
                </div>

                {workspacesLoading && workspaces.length === 0 ? (
                  <EmptyState title="Loading workspaces" description="Fetching client workspaces from the Perforce server." />
                ) : filteredWorkspaces.length === 0 ? (
                  <EmptyState title="No workspaces found" description="Try another search or create a workspace." />
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111117]">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="border-b border-white/[0.07] bg-white/[0.02] text-[10px] uppercase tracking-wider text-zinc-500">
                          <tr>
                            <th className="px-4 py-3 font-medium">Workspace</th>
                            <th className="px-4 py-3 font-medium">Owner</th>
                            <th className="px-4 py-3 font-medium">Stream</th>
                            <th className="px-4 py-3 font-medium">Root directory</th>
                            <th className="px-4 py-3 font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.06]">
                          {filteredWorkspaces.map((workspace) => (
                            <tr key={workspace.name} className="hover:bg-white/[0.025]">
                              <td className="px-4 py-4">
                                <div className="font-medium text-zinc-200">{workspace.name}</div>
                                <div className="mt-1 max-w-xs truncate text-xs text-zinc-500">{workspace.description || "No description"}</div>
                              </td>
                              <td className="px-4 py-4 text-zinc-400">{workspace.owner || "—"}</td>
                              <td className="px-4 py-4 text-xs text-violet-200">{workspace.stream || "—"}</td>
                              <td className="px-4 py-4 text-xs text-zinc-400">{workspace.root || "—"}</td>
                              <td className="px-4 py-4">
                                <button
                                  type="button"
                                  onClick={() => void loadWorkspaceBrowser(workspace.name)}
                                  className="whitespace-nowrap rounded-lg border border-violet-400/25 bg-violet-500/10 px-3 py-2 text-xs font-medium text-violet-200 hover:bg-violet-500/20"
                                >
                                  {selectedWorkspace === workspace.name ? "Refresh files" : "Browse files"}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {selectedWorkspace && (
                  <section className="overflow-hidden rounded-2xl border border-violet-400/20 bg-[#111117]">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] p-5">
                      <div>
                        <h3 className="text-base font-semibold text-white">Workspace browser</h3>
                        <p className="mt-1 text-xs text-zinc-500">{selectedWorkspace} · {workspaceFiles.length} synced files · {openedDepotFiles.length} opened</p>
                      </div>
                      <button type="button" onClick={() => void loadWorkspaceBrowser(selectedWorkspace)} disabled={workspaceFilesLoading} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-300 hover:bg-white/5 disabled:opacity-50">
                        {workspaceFilesLoading ? "Loading..." : "Refresh browser"}
                      </button>
                    </div>

                    <div className="border-b border-white/[0.07] p-4">
                      <p className="text-xs text-zinc-500">Files are checked out in Perforce and edited from their local paths. Use Copy path, then open the file in VS Code.</p>
                    </div>

                    {workspaceFilesLoading ? (
                      <div className="p-6 text-sm text-zinc-400">Loading workspace files...</div>
                    ) : workspaceFiles.length === 0 ? (
                      <div className="p-6 text-sm text-zinc-500">No synced files were found for this workspace.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="border-b border-white/[0.07] text-[10px] uppercase tracking-wider text-zinc-500">
                            <tr>
                              <th className="px-4 py-3 font-medium">Depot file</th>
                              <th className="px-4 py-3 font-medium">Have revision</th>
                              <th className="px-4 py-3 font-medium">Status</th>
                              <th className="px-4 py-3 font-medium">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/[0.06]">
                            {workspaceFiles.map((file) => {
                              const isOpened = openedDepotFiles.includes(file.depotFile);
                              return (
                                <tr key={file.depotFile} className="align-top hover:bg-white/[0.02]">
                                  <td className="max-w-[360px] px-4 py-4">
                                    <div className="break-all font-mono text-xs text-zinc-200">{file.depotFile}</div>
                                    <div className="mt-2 break-all text-[10px] text-zinc-500">{file.localPath || "Local path not returned by Perforce"}</div>
                                  </td>
                                  <td className="px-4 py-4 text-xs text-zinc-400">#{file.revision || "—"}</td>
                                  <td className="px-4 py-4">
                                    <span className={`rounded-full px-2.5 py-1 text-[10px] ${isOpened ? "border border-amber-400/20 bg-amber-400/10 text-amber-200" : "border border-emerald-400/20 bg-emerald-400/10 text-emerald-200"}`}>
                                      {isOpened ? "Checked out" : "Synced"}
                                    </span>
                                  </td>
                                  <td className="px-4 py-4">
                                    <div className="flex flex-wrap gap-2">
                                      <button type="button" onClick={() => void checkoutWorkspaceFile(file)} disabled={isOpened || checkingOutFile === file.depotFile} className="rounded-lg bg-violet-500 px-3 py-2 text-xs font-medium text-white hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-40">
                                        {checkingOutFile === file.depotFile ? "Checking out..." : isOpened ? "Checked out" : "Checkout"}
                                      </button>
                                      <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(file.localPath); setNotice({ kind: "success", text: "Local file path copied. Open it in VS Code to edit." }); } catch { setNotice({ kind: "error", text: `Copy this local path manually: ${file.localPath}` }); } }} disabled={!file.localPath} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-300 hover:bg-white/5 disabled:opacity-40">
                                        Copy path
                                      </button>
                                      <button type="button" onClick={() => { setHistoryPath(file.depotFile); setActivePage("File History"); void loadModule("history", { path: file.depotFile }); }} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-300 hover:bg-white/5">
                                        History
                                      </button>
                                      <button type="button" onClick={() => void showFileDiff(file)} className="rounded-lg border border-cyan-400/20 bg-cyan-400/[0.06] px-3 py-2 text-xs text-cyan-200 hover:bg-cyan-400/[0.12]">
                                        Diff
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    <div className="space-y-4 border-t border-white/[0.07] p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h4 className="text-sm font-semibold text-white">Default changelist</h4>
                          <p className="mt-1 text-xs text-zinc-500">{defaultChangelistFiles.length} file(s) in the default changelist · {openedDepotFiles.length} opened in total.</p>
                        </div>
                        <button type="button" onClick={() => void loadWorkspaceBrowser(selectedWorkspace)} disabled={workspaceFilesLoading} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-300 hover:bg-white/5 disabled:opacity-50">Refresh opened files</button>
                      </div>
                      {defaultChangelistFiles.length > 0 ? (
                        <ul className="space-y-2">
                          {defaultChangelistFiles.map((path) => <li key={path} className="break-all rounded-lg border border-amber-400/15 bg-amber-400/[0.04] px-3 py-2 font-mono text-xs text-amber-100/90">{path}</li>)}
                        </ul>
                      ) : (
                        <p className="text-xs text-zinc-500">No files are currently checked out.</p>
                      )}
                      <label className="block space-y-2 text-xs text-zinc-400">
                        Submit description
                        <input value={submitDescription} onChange={(event) => setSubmitDescription(event.target.value)} maxLength={250} placeholder="Describe the change" className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-400/50" />
                      </label>
                      <button type="button" onClick={() => void submitWorkspaceChanges()} disabled={submittingWorkspace || defaultChangelistFiles.length === 0} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40">
                        {submittingWorkspace ? "Submitting..." : `Submit default changelist (${defaultChangelistFiles.length})`}
                      </button>
                      <p className="text-[11px] leading-5 text-zinc-500">Submitting creates a new Perforce revision. Only proceed after editing and saving the local files. The submit action submits all opened files in this workspace's default changelist.</p>
                    </div>
                  </section>
                )}
              </div>
            )}
            {activePage === "Streams" && (
              <section className="space-y-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                  <div>
                    <div className="mb-2 flex items-center gap-2 text-xs text-violet-300">
                      <Icon name="streams" size={15} />
                      PERFORCE STREAM MANAGEMENT
                    </div>
                    <h2 className="text-2xl font-semibold tracking-tight text-white">
                      Streams
                    </h2>
                    <p className="mt-2 text-sm text-zinc-500">
                      Browse stream paths and their hierarchy from your Perforce server.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void loadStreams()}
                    disabled={streamsLoading}
                    className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-zinc-200 hover:bg-white/[0.08] disabled:opacity-50"
                  >
                    {streamsLoading ? "Refreshing..." : "Refresh streams"}
                  </button>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/[0.08] bg-[#111117] p-5">
                    <p className="text-sm text-zinc-500">Total streams</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{streams.length}</p>
                  </div>
                  <div className="rounded-2xl border border-white/[0.08] bg-[#111117] p-5">
                    <p className="text-sm text-zinc-500">Mainline</p>
                    <p className="mt-2 text-2xl font-semibold text-white">
                      {streams.filter((stream) => stream.type.toLowerCase() === "mainline").length}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/[0.08] bg-[#111117] p-5">
                    <p className="text-sm text-zinc-500">Development</p>
                    <p className="mt-2 text-2xl font-semibold text-white">
                      {streams.filter((stream) => stream.type.toLowerCase() === "development").length}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-[#111117] px-4">
                  <Icon name="search" size={16} />
                  <input
                    value={streamSearch}
                    onChange={(event) => setStreamSearch(event.target.value)}
                    placeholder="Search stream name, path, type, parent, or owner..."
                    className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-zinc-600"
                  />
                  <span className="whitespace-nowrap text-xs text-zinc-500">
                    {filteredStreams.length} results
                  </span>
                </div>

                {streamsError ? (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/[0.06] p-4 text-sm text-red-300">
                    {streamsError}
                  </div>
                ) : streamsLoading && streams.length === 0 ? (
                  <EmptyState title="Loading streams" description="Retrieving streams from Perforce." />
                ) : filteredStreams.length === 0 ? (
                  <EmptyState title="No streams found" description="Try another search or refresh the stream list." />
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111117]">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="border-b border-white/[0.08] bg-white/[0.025] text-xs uppercase tracking-wide text-zinc-500">
                          <tr>
                            <th className="px-4 py-3">Stream</th>
                            <th className="px-4 py-3">Type</th>
                            <th className="px-4 py-3">Parent</th>
                            <th className="px-4 py-3">Owner</th>
                            <th className="px-4 py-3">Description</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.06]">
                          {filteredStreams.map((stream) => (
                            <tr key={stream.stream} className="hover:bg-white/[0.025]">
                              <td className="px-4 py-4">
                                <div className="font-medium text-violet-200">{stream.name}</div>
                                <div className="mt-1 whitespace-nowrap font-mono text-xs text-zinc-500">{stream.stream}</div>
                              </td>
                              <td className="px-4 py-4">
                                <span className="rounded-full border border-violet-400/20 bg-violet-400/[0.08] px-2.5 py-1 text-xs text-violet-200">
                                  {stream.type}
                                </span>
                              </td>
                              <td className="px-4 py-4 font-mono text-xs text-zinc-400">{stream.parent}</td>
                              <td className="px-4 py-4 text-zinc-300">{stream.owner || "—"}</td>
                              <td className="max-w-xs px-4 py-4 text-zinc-400">{stream.description || "No description"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </section>
            )}
            {activePage !== "Overview" &&
              activePage !== "Depot Management" &&
              activePage !== "Workspaces" &&
              activePage !== "Streams" && (
                <div className="space-y-6">
                  <div>
                    <p className="mb-2 text-xs text-violet-300">HELIXDESK MODULE</p>
                    <h2 className="text-2xl font-semibold text-white">{activePage}</h2>
                    <p className="mt-2 text-sm text-zinc-500">
                      Perforce version-control information and operations.
                    </p>
                  </div>

                  {activePage === "File History" && (
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        void loadModule("history", { path: historyPath.trim() });
                      }}
                      className="flex flex-col gap-3 rounded-2xl border border-white/[0.07] bg-[#111117] p-5 sm:flex-row"
                    >
                      <input
                        value={historyPath}
                        onChange={(event) => setHistoryPath(event.target.value)}
                        required
                        placeholder="//depot/path/to/file.txt"
                        className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-4 py-3 font-mono text-sm text-white outline-none"
                      />
                      <button type="submit" disabled={moduleLoading}
                        className="rounded-xl bg-violet-500 px-5 py-3 text-sm text-white disabled:opacity-50">
                        View history
                      </button>
                    </form>
                  )}

                  {activePage === "Search" && (
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        void loadModule("search", { q: fileSearch.trim() });
                      }}
                      className="flex flex-col gap-3 rounded-2xl border border-white/[0.07] bg-[#111117] p-5 sm:flex-row"
                    >
                      <input
                        value={fileSearch}
                        onChange={(event) => setFileSearch(event.target.value)}
                        required
                        placeholder="Search depot file paths..."
                        className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none"
                      />
                      <button type="submit" disabled={moduleLoading}
                        className="rounded-xl bg-violet-500 px-5 py-3 text-sm text-white disabled:opacity-50">
                        Search files
                      </button>
                    </form>
                  )}

                  {activePage === "Changelists" && (
                    <div className="flex flex-wrap gap-2">
                      <input value={submitDescription} onChange={(event) => setSubmitDescription(event.target.value)} maxLength={250} placeholder="Submit description" aria-label="Submit description" className="min-w-[190px] rounded-xl border border-white/10 bg-[#111117] px-3 py-3 text-sm text-white outline-none focus:border-violet-400/50" />
                      <button onClick={() => { void loadModule("changelists"); const workspace = selectedWorkspace || connection?.workspace || ""; if (workspace) void loadWorkspaceBrowser(workspace); }}
                        disabled={moduleLoading || workspaceFilesLoading}
                        className="rounded-xl border border-white/10 px-4 py-3 text-sm text-zinc-200 disabled:opacity-50">
                        Refresh changelists
                      </button>
                      <button onClick={() => void submitWorkspaceChanges()}
                        disabled={submittingWorkspace || defaultChangelistFiles.length === 0 || !(selectedWorkspace || connection?.workspace)}
                        className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40">
                        {submittingWorkspace ? "Submitting..." : `Submit checked-out files (${defaultChangelistFiles.length})`}
                      </button>
                    </div>
                  )}

                  {activePage === "File Locks" && (
                    <button onClick={() => void loadModule("locks")}
                      disabled={moduleLoading}
                      className="rounded-xl bg-violet-500 px-4 py-3 text-sm text-white disabled:opacity-50">
                      Refresh file locks
                    </button>
                  )}

                  {activePage === "Reconcile Offline Work" && (
                    <div className="space-y-3">
                      <p className="rounded-xl border border-amber-400/20 bg-amber-400/[0.05] p-4 text-sm text-amber-100/80">
                        Preview only. Review changes before performing a reconcile operation.
                      </p>
                      <button onClick={() => void loadModule("reconcile")}
                        disabled={moduleLoading}
                        className="rounded-xl bg-violet-500 px-4 py-3 text-sm text-white disabled:opacity-50">
                        Preview offline changes
                      </button>
                    </div>
                  )}

                  {moduleLoading && (
                    <div className="rounded-xl border border-white/10 bg-[#111117] p-5 text-sm text-zinc-400">
                      Contacting Perforce...
                    </div>
                  )}

                  {moduleError && (
                    <div className="rounded-xl border border-red-400/20 bg-red-400/[0.06] p-4 text-sm text-red-300">
                      {moduleError}
                    </div>
                  )}

                  
{moduleData && !moduleLoading && (
  <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111117]">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] p-5">
      <div>
        <h3 className="text-sm font-semibold text-white">
          {activePage}
        </h3>
        <p className="mt-1 text-xs text-zinc-500">
          Live results from Perforce
        </p>
      </div>
      <span className="rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-xs text-violet-200">
        {activePage === "Changelists"
          ? `${Number(moduleData.count ?? 0)} total`
          : activePage === "File History"
            ? `${Array.isArray(moduleData.history) ? moduleData.history.length : 0} revisions`
            : activePage === "File Locks"
              ? `${Array.isArray(moduleData.locks) ? moduleData.locks.length : 0} locks`
              : activePage === "Search"
                ? `${Array.isArray(moduleData.matches) ? moduleData.matches.length : 0} matches`
                : `${Array.isArray(moduleData.files) ? moduleData.files.length : 0} files`}
      </span>
    </div>

    {(() => {
      type Row = Record<string, unknown>;

      const asRows = (value: unknown): Row[] =>
        Array.isArray(value)
          ? value.filter(
              (item): item is Row =>
                typeof item === "object" &&
                item !== null &&
                !Array.isArray(item)
            )
          : [];

      const value = (row: Row, ...keys: string[]): string => {
        for (const key of keys) {
          const item = row[key];
          if (item !== undefined && item !== null && item !== "") {
            if (typeof item === "object") {
              return JSON.stringify(item);
            }
            return String(item);
          }
        }
        return "—";
      };

      const formatDate = (raw: string): string => {
        if (raw === "—") return raw;
        const date = new Date(raw);
        return Number.isNaN(date.getTime())
          ? raw
          : date.toLocaleString();
      };

      const table = (
        columns: { label: string; keys: string[]; date?: boolean }[],
        rows: Row[],
        emptyMessage: string
      ) => (
        <div className="overflow-x-auto">
          {rows.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm font-medium text-zinc-300">
                No records found
              </p>
              <p className="mt-2 text-xs text-zinc-500">
                {emptyMessage}
              </p>
            </div>
          ) : (
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="bg-white/[0.025] text-xs uppercase tracking-wider text-zinc-500">
                <tr>
                  {columns.map((column) => (
                    <th key={column.label} className="px-5 py-4 font-medium">
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {rows.map((row, index) => (
                  <tr
                    key={`${value(row, "change", "depotFile", "path", "client", "clientName", "rev", "id")}-${index}`}
                    className="transition hover:bg-white/[0.025]"
                  >
                    {columns.map((column) => {
                      const cell = value(row, ...column.keys);
                      return (
                        <td
                          key={column.label}
                          className="max-w-[420px] px-5 py-4 text-zinc-300"
                        >
                          <span className="block break-words">
                            {column.date ? formatDate(cell) : cell}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      );

      if (activePage === "Changelists") {
        const pending = asRows(moduleData.pending);
        const submitted = asRows(moduleData.submitted);
        const columns = [
          { label: "Change ID", keys: ["change", "Change", "id"] },
          { label: "Description", keys: ["desc", "description", "Description"] },
          { label: "Owner", keys: ["user", "User", "owner"] },
          { label: "Date", keys: ["time", "Date", "date"], date: true },
        ];

        return (
          <div>
            <div className="border-b border-white/[0.07] px-5 py-3">
              <h4 className="text-sm font-semibold text-white">
                Pending changelists ({pending.length})
              </h4>
            </div>
            {table(
              columns,
              pending,
              "There are no pending changelists for this Perforce user."
            )}

            <div className="border-y border-white/[0.07] px-5 py-3">
              <h4 className="text-sm font-semibold text-white">
                Submitted changelists ({submitted.length})
              </h4>
            </div>
            {table(
              columns,
              submitted,
              "No submitted changelists were returned."
            )}
          </div>
        );
      }

      if (activePage === "File History") {
        return table(
          [
            { label: "Revision", keys: ["rev", "revision"] },
            { label: "File", keys: ["depotFile", "path", "file"] },
            { label: "Action", keys: ["action"] },
            { label: "User", keys: ["user"] },
            { label: "Date", keys: ["time", "date"], date: true },
            { label: "Description", keys: ["desc", "description"] },
          ],
          asRows(moduleData.history),
          "Enter a valid depot file path that has revision history."
        );
      }

      if (activePage === "File Locks") {
        return table(
          [
            { label: "File", keys: ["depotFile", "path", "clientFile"] },
            { label: "Workspace", keys: ["client", "clientName"] },
            { label: "Owner", keys: ["user", "owner"] },
            { label: "Action", keys: ["action"] },
            { label: "Lock status", keys: ["ourLock", "otherLock", "lock"] },
          ],
          asRows(moduleData.locks),
          "No matching locks were found. Opened files are not necessarily locked."
        );
      }

      if (activePage === "Search") {
        return table(
          [
            { label: "Depot file", keys: ["depotFile", "path"] },
            { label: "Revision", keys: ["rev", "revision"] },
            { label: "Action", keys: ["action"] },
            { label: "Change", keys: ["change", "headChange"] },
          ],
          asRows(moduleData.matches),
          "No depot file paths matched your search."
        );
      }

      if (activePage === "Reconcile Offline Work") {
        const files = asRows(moduleData.files);
        const output =
          typeof moduleData.output === "string"
            ? moduleData.output
            : "";

        return (
          <div>
            {table(
              [
                { label: "File", keys: ["depotFile", "path", "file"] },
                { label: "Action", keys: ["action", "status"] },
                { label: "Workspace", keys: ["client", "workspace"] },
              ],
              files,
              output || "No offline changes were detected by the preview."
            )}
            {output && (
              <details className="border-t border-white/[0.07] p-5">
                <summary className="cursor-pointer text-xs text-zinc-400">
                  View Perforce diagnostic output
                </summary>
                <pre className="mt-3 whitespace-pre-wrap break-words text-xs leading-5 text-zinc-400">
                  {output}
                </pre>
              </details>
            )}
          </div>
        );
      }

      return (
        <div className="p-6 text-sm text-zinc-400">
          No table renderer is configured for this section yet.
        </div>
      );
    })()}
  </section>
)}


                  <div className="rounded-2xl border border-white/[0.07] bg-[#111117] p-5">
                    <h3 className="text-sm font-semibold text-white">Server configuration</h3>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {[
                        ["Server", connection?.server || "Unavailable"],
                        ["User", connection?.user || "Unavailable"],
                        ["Workspace", connection?.workspace || "Unavailable"],
                        ["Stream", connection?.stream || "Unavailable"],
                        ["Workspace root", connection?.workspaceRoot || "Unavailable"],
                        ["Connection", connection?.connected ? "Connected" : "Not connected"],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-xl border border-white/[0.06] bg-black/10 p-4">
                          <div className="text-[10px] uppercase tracking-wider text-zinc-600">{label}</div>
                          <div className="mt-2 break-words text-sm text-zinc-300">{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            {diffFile && (() => {
              const rawDiffLines = diffText.split("\n");
              const diffLines = rawDiffLines.filter((line) => line && !line.startsWith("--- ") && !line.startsWith("+++ ") && !line.startsWith("\\ No newline at end of file"));
              const additions = diffLines.filter((line) => line.startsWith("+") && !line.startsWith("+++")).length;
              const deletions = diffLines.filter((line) => line.startsWith("-") && !line.startsWith("---")).length;
              const isEmpty = !diffLoading && (!diffText.trim() || diffText.trim() === "No differences found.");
              return (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true" aria-label="File diff">
                  <section className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#101116] shadow-[0_24px_100px_rgba(0,0,0,0.65)]">
                    <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] bg-white/[0.02] px-5 py-4 sm:px-6">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-md border border-cyan-400/20 bg-cyan-400/[0.08] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-200">Diff viewer</span>
                          {!diffLoading && !isEmpty && <span className="text-xs text-zinc-500">{additions} additions · {deletions} deletions</span>}
                        </div>
                        <h3 className="mt-2 text-base font-semibold text-white">{diffFile.split("/").pop() || "File diff"}</h3>
                        <p className="mt-1 break-all font-mono text-xs text-zinc-400">{diffFile}</p>
                      </div>
                      <button type="button" onClick={() => { setDiffFile(""); setDiffText(""); }} className="shrink-0 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.08]">Close</button>
                    </div>
                    <div className="grid grid-cols-2 border-b border-white/[0.08] text-xs">
                      <div className="flex items-center gap-2 border-r border-white/[0.08] px-5 py-3 text-zinc-300"><span className="h-2 w-2 rounded-full bg-rose-400" /> Perforce depot version</div>
                      <div className="flex items-center gap-2 px-5 py-3 text-zinc-300"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Local workspace version</div>
                    </div>
                    <div className="min-h-0 flex-1 overflow-auto bg-[#0b0c10] p-3 sm:p-5">
                      {diffLoading ? (
                        <div className="flex min-h-40 items-center justify-center text-sm text-zinc-400">Generating diff…</div>
                      ) : isEmpty ? (
                        <div className="flex min-h-48 flex-col items-center justify-center text-center">
                          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/[0.08] text-lg text-emerald-300">✓</div>
                          <p className="text-sm font-medium text-zinc-200">Your workspace matches the depot version</p>
                          <p className="mt-1 max-w-md text-xs leading-5 text-zinc-500">Edit and save the checked-out file, then reopen Diff to review your changes before submitting.</p>
                        </div>
                      ) : (
                        <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#0e0f14] font-mono text-xs leading-6">
                          {diffLines.map((line, index) => {
                            const added = line.startsWith("+") && !line.startsWith("+++");
                            const removed = line.startsWith("-") && !line.startsWith("---");
                            const meta = line.startsWith("@@") || line.startsWith("diff ") || line.startsWith("====");
                            const rowClass = added ? "border-l-2 border-emerald-400 bg-emerald-400/[0.10] text-emerald-200" : removed ? "border-l-2 border-rose-400 bg-rose-400/[0.10] text-rose-200" : meta ? "border-l-2 border-cyan-400/50 bg-cyan-400/[0.06] text-cyan-200" : "border-l-2 border-transparent text-zinc-400";
                            const marker = added ? "+" : removed ? "−" : " ";
                            const content = added || removed ? line.slice(1) : line;
                            return <div key={`${index}-${line}`} className={`flex min-w-0 ${rowClass}`}><span className="sticky left-0 w-10 shrink-0 select-none border-r border-white/[0.06] px-2 text-right text-zinc-600">{index + 1}</span><span className="w-7 shrink-0 select-none px-2 text-center opacity-80">{marker}</span><span className="min-w-0 flex-1 whitespace-pre-wrap break-words px-2">{content || " "}</span></div>;
                          })}
                        </div>
                      )}
                    </div>
                    {!diffLoading && !isEmpty && <div className="flex flex-wrap items-center gap-4 border-t border-white/[0.08] bg-white/[0.02] px-5 py-3 text-[11px] text-zinc-500"><span><span className="mr-1.5 inline-block h-2 w-2 rounded-sm bg-emerald-400" />{additions} added</span><span><span className="mr-1.5 inline-block h-2 w-2 rounded-sm bg-rose-400" />{deletions} removed</span><span className="ml-auto">Review changes before submitting the changelist.</span></div>}
                  </section>
                </div>
              );
            })()}
            <footer className="flex flex-col justify-between gap-2 border-t border-white/[0.06] pt-5 text-[11px] text-zinc-600 sm:flex-row">
              <span>HelixDesk · Local Perforce management dashboard</span>
              <span>Connected to {connection?.server || "Perforce server"}</span>
            </footer>
          </div>
        </section>
      </div>
    </main>
  );
}
