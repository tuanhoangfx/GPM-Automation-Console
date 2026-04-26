import {
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  ArrowDown,
  ArrowUp,
  CircleAlert,
  ClipboardList,
  Bot,
  Clock3,
  Copy,
  Database,
  Download,
  Redo2,
  Github,
  Globe2,
  GraduationCap,
  History,
  Image,
  Instagram,
  Layers3,
  MessageCircle,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Settings,
  ShieldCheck,
  Square,
  Terminal,
  Trash2,
  Undo2,
  Upload,
  X,
  XCircle
} from "lucide-react";
import { type MouseEvent, type UIEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  checkHealth,
  closeProfile,
  createProfile,
  deleteProfile,
  getGroups,
  getProfiles,
  getStoredBaseUrl,
  runOpenUrlAutomation,
  setStoredBaseUrl,
  startProfile
} from "./api";
import type { GpmGroup, GpmProfile, ProfileRow, RunLog, ScriptStep, ScriptStepKind } from "./types";

type View = "profiles" | "scripts" | "settings";
type Theme = "dark" | "light";
type WorkflowId = string;
type WorkflowIconKey = "play" | "globe" | "camera" | "shield" | "education" | "layers";
type WorkflowAction = "open-url" | "google-form-ag-appeal";
type WorkflowGroup = "Core" | "Account Check" | "Appeal";
type WorkflowPlatform = string;
type WorkflowConfig = {
  id: WorkflowId;
  name: string;
  description: string;
  icon: WorkflowIconKey;
  group: WorkflowGroup;
  platform: WorkflowPlatform;
  action: WorkflowAction;
  targetUrl: string;
  takeScreenshot: boolean;
  closeWhenDone: boolean;
  inspectMode: boolean;
  concurrency: number;
  steps: ScriptStep[];
};
type RunHistoryItem = {
  id: string;
  profileName: string;
  workflowName: string;
  targetUrl: string;
  status: "running" | "success" | "failed" | "skipped";
  startedAt: number;
  durationMs: number;
  finishedAt: string;
  screenshotPath?: string;
  error?: string;
};
type DropdownOption = {
  value: string;
  label: string;
};

const THEME_KEY = "gpm-console-theme";
const WORKFLOWS_KEY = "gpm-console-workflows";
const ACTIVE_WORKFLOW_KEY = "gpm-console-active-workflow";
const PAGE_SIZE_OPTIONS = [100, 500, 1000, 5000];
const ROW_HEIGHT = 50;
const VIRTUAL_OVERSCAN = 10;
const SCRIPT_STEP_KINDS: ScriptStepKind[] = ["navigate", "wait", "click", "type", "delay", "scroll", "screenshot", "condition", "action"];

function createStep(kind: ScriptStepKind, patch: Partial<ScriptStep> = {}): ScriptStep {
  const defaults: Record<ScriptStepKind, Pick<ScriptStep, "name" | "timeoutMs">> = {
    navigate: { name: "Navigate", timeoutMs: 60000 },
    wait: { name: "Wait selector", timeoutMs: 15000 },
    click: { name: "Click", timeoutMs: 10000 },
    type: { name: "Type", timeoutMs: 10000 },
    delay: { name: "Delay", timeoutMs: 1000 },
    scroll: { name: "Scroll", timeoutMs: 1000 },
    screenshot: { name: "Screenshot", timeoutMs: 10000 },
    condition: { name: "Condition", timeoutMs: 5000 },
    action: { name: "Special action", timeoutMs: 60000 }
  };

  return {
    id: crypto.randomUUID(),
    kind,
    name: defaults[kind].name,
    timeoutMs: defaults[kind].timeoutMs,
    enabled: true,
    ...patch
  };
}

function workflowSteps(targetUrl: string, screenshot = true): ScriptStep[] {
  return [
    createStep("navigate", { value: targetUrl }),
    createStep("wait", { name: "Wait for page idle", timeoutMs: 15000 }),
    ...(screenshot ? [createStep("screenshot", { name: "Capture evidence" })] : [])
  ];
}

const DEFAULT_WORKFLOWS: WorkflowConfig[] = [
  {
    id: "open-url",
    name: "Open URL",
    description: "Open a target page and optionally capture a screenshot.",
    icon: "play",
    group: "Core",
    platform: "Generic",
    action: "open-url",
    targetUrl: "https://browserleaks.com/ip",
    takeScreenshot: true,
    closeWhenDone: false,
    inspectMode: false,
    concurrency: 2,
    steps: workflowSteps("https://browserleaks.com/ip", true)
  },
  {
    id: "ip-check",
    name: "IP Check",
    description: "Inspect network identity on BrowserLeaks.",
    icon: "globe",
    group: "Account Check",
    platform: "Generic",
    action: "open-url",
    targetUrl: "https://browserleaks.com/ip",
    takeScreenshot: true,
    closeWhenDone: true,
    inspectMode: false,
    concurrency: 2,
    steps: workflowSteps("https://browserleaks.com/ip", true)
  },
  {
    id: "screenshot-check",
    name: "Screenshot Audit",
    description: "Open a page, save evidence, then close the profile.",
    icon: "camera",
    group: "Core",
    platform: "Generic",
    action: "open-url",
    targetUrl: "https://example.com",
    takeScreenshot: true,
    closeWhenDone: true,
    inspectMode: false,
    concurrency: 1,
    steps: workflowSteps("https://example.com", true)
  },
  {
    id: "github-education",
    name: "GitHub Education",
    description: "Check GitHub Education benefit status.",
    icon: "education",
    group: "Account Check",
    platform: "GitHub",
    action: "open-url",
    targetUrl: "https://github.com/settings/education/benefits",
    takeScreenshot: true,
    closeWhenDone: false,
    inspectMode: false,
    concurrency: 2,
    steps: workflowSteps("https://github.com/settings/education/benefits", true)
  },
  {
    id: "google-one-ai",
    name: "Google One AI",
    description: "Check Google One AI plan and credit activity.",
    icon: "layers",
    group: "Account Check",
    platform: "Google",
    action: "open-url",
    targetUrl: "https://one.google.com/u/0/ai/activity",
    takeScreenshot: true,
    closeWhenDone: false,
    inspectMode: false,
    concurrency: 2,
    steps: workflowSteps("https://one.google.com/u/0/ai/activity", true)
  },
  {
    id: "ag-appeal-form",
    name: "AG Appeal Form",
    description: "Select Email, confirm understanding, then submit the AG appeal form.",
    icon: "shield",
    group: "Appeal",
    platform: "Google Forms",
    action: "google-form-ag-appeal",
    targetUrl: "https://forms.gle/hGzM9MEUv2azZsrb9",
    takeScreenshot: true,
    closeWhenDone: true,
    inspectMode: true,
    concurrency: 1,
    steps: [
      createStep("navigate", { value: "https://forms.gle/hGzM9MEUv2azZsrb9" }),
      createStep("action", { name: "Complete AG appeal form", value: "google-form-ag-appeal", timeoutMs: 60000 }),
      createStep("screenshot", { name: "Capture result" })
    ]
  },
  {
    id: "chatgpt-login",
    name: "ChatGPT Login",
    description: "Open ChatGPT login and capture the account entry state.",
    icon: "play",
    group: "Account Check",
    platform: "OpenAI",
    action: "open-url",
    targetUrl: "https://chatgpt.com",
    takeScreenshot: true,
    closeWhenDone: false,
    inspectMode: false,
    concurrency: 1,
    steps: [createStep("navigate", { value: "https://chatgpt.com" })]
  },
  {
    id: "microsoft-hotmail-login",
    name: "Login Microsoft Hotmail",
    description: "Open Microsoft account login for Hotmail/Outlook accounts.",
    icon: "play",
    group: "Account Check",
    platform: "Microsoft",
    action: "open-url",
    targetUrl: "https://login.live.com/",
    takeScreenshot: false,
    closeWhenDone: false,
    inspectMode: false,
    concurrency: 1,
    steps: [createStep("navigate", { value: "https://login.live.com/" })]
  },
  {
    id: "microsoft-hotmail-mail",
    name: "Check Mail Microsoft Hotmail",
    description: "Open Outlook web mail inbox for Hotmail/Outlook accounts.",
    icon: "play",
    group: "Account Check",
    platform: "Microsoft",
    action: "open-url",
    targetUrl: "https://outlook.live.com/mail/0/",
    takeScreenshot: false,
    closeWhenDone: false,
    inspectMode: false,
    concurrency: 1,
    steps: [createStep("navigate", { value: "https://outlook.live.com/mail/0/" })]
  },
  {
    id: "higgsfield-change-password",
    name: "Higgsfield Change Password",
    description: "Open Higgsfield password reset, send reset code, then enter code and new password.",
    icon: "shield",
    group: "Account Check",
    platform: "Higgsfield",
    action: "open-url",
    targetUrl: "https://higgsfield.ai/",
    takeScreenshot: false,
    closeWhenDone: false,
    inspectMode: true,
    concurrency: 1,
    steps: [
      createStep("navigate", { value: "https://higgsfield.ai/" }),
      createStep("wait", { name: "Wait homepage", timeoutMs: 15000 }),
      createStep("click", { name: "Open Login modal", selector: 'button:has-text("Login"), a:has-text("Login")', timeoutMs: 15000 }),
      createStep("click", { name: "Continue with Email", selector: 'button:has-text("Continue with Email")', timeoutMs: 15000 }),
      createStep("click", { name: "Open Forgot password", selector: 'text="Forgot password?"', timeoutMs: 15000 }),
      createStep("type", {
        name: "Type account email",
        selector: 'input[placeholder="Email"], input[type="email"]',
        value: "{{higgsfieldEmail}}",
        timeoutMs: 10000
      }),
      createStep("click", { name: "Send reset code", selector: 'button:has-text("Send code")', timeoutMs: 15000 }),
      createStep("type", {
        name: "Type reset code",
        selector: 'input[placeholder="Code"]',
        value: "{{higgsfieldResetCode}}",
        timeoutMs: 10000
      }),
      createStep("type", {
        name: "Type new password",
        selector: 'input[placeholder="New password"], input[type="password"]',
        value: "{{higgsfieldNewPassword}}",
        timeoutMs: 10000
      }),
      createStep("click", { name: "Change password", selector: 'button:has-text("Change password")', timeoutMs: 15000 }),
      createStep("click", { name: "Skip browser save password", selector: 'text="Never"', timeoutMs: 5000, enabled: false })
    ]
  }
];

const navItems = [
  { id: "profiles" as const, label: "Profiles", icon: Database },
  { id: "scripts" as const, label: "Scripts", icon: ClipboardList },
  { id: "settings" as const, label: "Settings", icon: Settings }
];

function profileId(profile: GpmProfile) {
  return profile.id ?? profile.profile_id;
}

function profileName(profile: GpmProfile) {
  return profile.profile_name || profile.name || `Profile ${profileId(profile)}`;
}

function groupName(group: GpmGroup) {
  return group.group_name || group.name || `Group ${group.id}`;
}

function now() {
  return new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function readStoredTheme(): Theme {
  return localStorage.getItem(THEME_KEY) === "light" ? "light" : "dark";
}

function readStoredActiveWorkflow(): WorkflowId {
  const stored = localStorage.getItem(ACTIVE_WORKFLOW_KEY);
  return stored || "open-url";
}

function readStoredWorkflows(): WorkflowConfig[] {
  try {
    const stored = JSON.parse(localStorage.getItem(WORKFLOWS_KEY) || "[]") as Partial<WorkflowConfig>[];
    const storedCustom = stored.filter((item) => item.id && !DEFAULT_WORKFLOWS.some((workflow) => workflow.id === item.id));
    const merged = [
      ...DEFAULT_WORKFLOWS.map((workflow) => {
        const override = stored.find((item) => item.id === workflow.id);
        return {
          ...workflow,
          ...override,
          id: workflow.id,
          icon: override?.icon || workflow.icon,
          group: override?.group || workflow.group,
          platform: override?.platform || workflow.platform,
          action: override?.action || workflow.action,
          inspectMode: Boolean(override?.inspectMode ?? workflow.inspectMode),
          concurrency: clampConcurrency(Number(override?.concurrency ?? workflow.concurrency)),
          steps: (Array.isArray(override?.steps) && override.steps.length ? override.steps : workflow.steps).map((step) => ({
            ...step,
            id: step.id || crypto.randomUUID(),
            enabled: Boolean(step.enabled ?? true),
            timeoutMs: clampTimeout(Number(step.timeoutMs ?? 10000))
          }))
        };
      }),
      ...storedCustom
    ];

    return merged.map((workflow) => {
      const fallback = DEFAULT_WORKFLOWS.find((item) => item.id === workflow.id);
      const steps = Array.isArray(workflow.steps) && workflow.steps.length ? workflow.steps : fallback?.steps || workflowSteps(workflow.targetUrl || "", false);
      return {
        ...(fallback || DEFAULT_WORKFLOWS[0]),
        ...workflow,
        id: workflow.id || `workflow-${crypto.randomUUID()}`,
        icon: workflow.icon || fallback?.icon || "play",
        group: workflow.group || fallback?.group || "Core",
        platform: workflow.platform || fallback?.platform || "Generic",
        action: workflow.action || fallback?.action || "open-url",
        inspectMode: Boolean(workflow.inspectMode ?? fallback?.inspectMode ?? false),
        concurrency: clampConcurrency(Number(workflow.concurrency ?? fallback?.concurrency ?? 1)),
        steps: steps.map((step) => ({
          ...step,
          id: step.id || crypto.randomUUID(),
          enabled: Boolean(step.enabled ?? true),
          timeoutMs: clampTimeout(Number(step.timeoutMs ?? 10000))
        }))
      };
    });
  } catch {
    return DEFAULT_WORKFLOWS;
  }
}

function statusLabel(status: ProfileRow["status"]) {
  if (status === "closed") return "Ready";
  return status;
}

function formatDuration(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function clampConcurrency(value: number) {
  if (Number.isNaN(value)) return 1;
  return Math.min(10, Math.max(1, Math.floor(value)));
}

function clampTimeout(value: number) {
  if (Number.isNaN(value)) return 10000;
  return Math.min(120000, Math.max(0, Math.floor(value)));
}

function workflowIconFor(icon: WorkflowIconKey) {
  if (icon === "globe") return Globe2;
  if (icon === "camera") return Camera;
  if (icon === "shield") return ShieldCheck;
  if (icon === "education") return GraduationCap;
  if (icon === "layers") return Layers3;
  return Play;
}

function workflowPlatformIconFor(platform: string) {
  const value = platform.toLowerCase();
  if (value.includes("github")) return Github;
  if (value.includes("instagram")) return Instagram;
  if (value.includes("facebook")) return MessageCircle;
  if (value.includes("claude")) return Bot;
  if (value.includes("grok")) return Bot;
  if (value.includes("google")) return Globe2;
  return workflowIconFor("play");
}

function inferWorkflowPlatform(targetUrl: string, fallback: string) {
  const value = String(targetUrl || "").toLowerCase();
  if (value.includes("chatgpt.com") || value.includes("openai.com")) return "OpenAI";
  if (value.includes("higgsfield.ai")) return "Higgsfield";
  if (value.includes("login.live.com") || value.includes("outlook.live.com") || value.includes("hotmail.com") || value.includes("microsoft.com")) return "Microsoft";
  if (value.includes("github.com")) return "GitHub";
  if (value.includes("forms.gle") || value.includes("docs.google.com/forms")) return "Google Forms";
  if (value.includes("google.com") || value.includes("googleusercontent.com") || value.includes("one.google.com")) return "Google";
  if (value.includes("facebook.com") || value.includes("fb.com")) return "Facebook";
  if (value.includes("instagram.com")) return "Instagram";
  if (value.includes("claude.ai") || value.includes("anthropic.com")) return "Claude";
  if (value.includes("grok.com") || value.includes("x.ai")) return "Grok";
  return fallback || "Generic";
}

function workflowDisplayPlatform(workflow: WorkflowConfig) {
  return inferWorkflowPlatform(workflow.targetUrl, workflow.platform);
}

function workflowPlatformSlug(platform: string) {
  const value = platform.toLowerCase();
  if (value.includes("github")) return "github";
  if (value.includes("instagram")) return "instagram";
  if (value.includes("facebook")) return "facebook";
  if (value.includes("claude")) return "claude";
  if (value.includes("grok")) return "grok";
  if (value.includes("openai") || value.includes("chatgpt")) return "openai";
  if (value.includes("microsoft") || value.includes("hotmail") || value.includes("outlook")) return "microsoft";
  if (value.includes("google")) return "google";
  return "";
}

function workflowPlatformSvgUrl(platform: string) {
  const slug = workflowPlatformSlug(platform);
  if (!slug) return "";
  const variant = "default";
  return `https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/${slug}/${variant}.svg`;
}

function workflowPlatformTone(platform: string) {
  const value = platform.toLowerCase();
  if (value.includes("github")) return "workflow-platform-github";
  if (value.includes("instagram")) return "workflow-platform-instagram";
  if (value.includes("facebook")) return "workflow-platform-facebook";
  if (value.includes("claude")) return "workflow-platform-claude";
  if (value.includes("grok")) return "workflow-platform-grok";
  if (value.includes("openai") || value.includes("chatgpt")) return "workflow-platform-openai";
  if (value.includes("microsoft") || value.includes("hotmail") || value.includes("outlook")) return "workflow-platform-microsoft";
  if (value.includes("google")) return "workflow-platform-google";
  if (value.includes("higgsfield")) return "workflow-platform-higgsfield";
  return "workflow-platform-generic";
}

function workflowIconTone(icon: WorkflowIconKey) {
  return `workflow-icon-${icon}`;
}

function workflowDisplayId(id: WorkflowId) {
  const index = DEFAULT_WORKFLOWS.findIndex((workflow) => workflow.id === id);
  const fallbackIndex = Math.abs(
    String(id)
      .split("")
      .reduce((total, char) => total + char.charCodeAt(0), 0)
  );
  return `WF${String((index >= 0 ? index + 1 : fallbackIndex) || 1).padStart(5, "0").slice(-5)}`;
}

function workflowExportPayload(workflows: WorkflowConfig[]) {
  return workflows.map((workflow) => ({
    displayId: workflowDisplayId(workflow.id),
    ...workflow
  }));
}

function MultiSelectDropdown({
  values,
  options,
  label,
  searchLabel,
  summaryLabel,
  onChange
}: {
  values: string[];
  options: DropdownOption[];
  label: string;
  searchLabel: string;
  summaryLabel?: string;
  onChange: (values: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selectedSet = useMemo(() => new Set(values), [values]);
  const filteredOptions = options.filter((option) => option.label.toLowerCase().includes(search.trim().toLowerCase()));
  const selectedLabels = options.filter((option) => selectedSet.has(option.value)).map((option) => option.label);
  const displayLabel =
    selectedLabels.length === 0 ? label : selectedLabels.length === 1 ? selectedLabels[0] : `${selectedLabels.length} ${summaryLabel || "selected"}`;

  function toggleValue(value: string) {
    if (!value) {
      onChange([]);
      return;
    }

    const next = new Set(values);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    onChange(Array.from(next));
  }

  return (
    <div
      className={open ? "smart-dropdown multi-select-dropdown open" : "smart-dropdown multi-select-dropdown"}
      onBlur={(event) => {
        if (!(event.relatedTarget instanceof Node) || !event.currentTarget.contains(event.relatedTarget)) {
          setOpen(false);
          setSearch("");
        }
      }}
    >
      <button type="button" className="smart-dropdown-trigger" onClick={() => setOpen((current) => !current)}>
        <span>{displayLabel}</span>
        <ChevronDown size={15} />
      </button>
      {open && (
        <div className="smart-dropdown-menu">
          <label className="smart-dropdown-search">
            <Search size={15} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={searchLabel} autoFocus />
          </label>
          <div className="smart-dropdown-options">
            <button type="button" className={values.length === 0 ? "smart-dropdown-option active" : "smart-dropdown-option"} onMouseDown={(event) => event.preventDefault()} onClick={() => onChange([])}>
              <span className="dropdown-checkbox">{values.length === 0 ? "?" : ""}</span>
              <span>{label}</span>
            </button>
            {filteredOptions.map((option) => (
              <button
                type="button"
                className={selectedSet.has(option.value) ? "smart-dropdown-option active" : "smart-dropdown-option"}
                key={option.value}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => toggleValue(option.value)}
              >
                <span className="dropdown-checkbox">{selectedSet.has(option.value) ? "?" : ""}</span>
                <span>{option.label}</span>
              </button>
            ))}
            {filteredOptions.length === 0 && <span className="dropdown-empty">No matches</span>}
          </div>
        </div>
      )}
    </div>
  );
}

export function App() {
  const [view, setView] = useState<View>("profiles");
  const [theme, setTheme] = useState<Theme>(readStoredTheme);
  const [baseUrl, setBaseUrl] = useState(getStoredBaseUrl);
  const [apiStatus, setApiStatus] = useState<"checking" | "connected" | "offline">("checking");
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [groups, setGroups] = useState<GpmGroup[]>([]);
  const [selected, setSelected] = useState<Set<string | number>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [newProfileGroupId, setNewProfileGroupId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [logs, setLogs] = useState<RunLog[]>([]);
  const [history, setHistory] = useState<RunHistoryItem[]>([]);
  const [newName, setNewName] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showWorkflowSettings, setShowWorkflowSettings] = useState(false);
  const [savedWorkflowConfigs, setSavedWorkflowConfigs] = useState<WorkflowConfig[]>(readStoredWorkflows);
  const [draftWorkflowConfigs, setDraftWorkflowConfigs] = useState<WorkflowConfig[]>(savedWorkflowConfigs);
  const [activeWorkflow, setActiveWorkflow] = useState<WorkflowId>(readStoredActiveWorkflow);
  const [selectedWorkflowIds, setSelectedWorkflowIds] = useState<WorkflowId[]>([readStoredActiveWorkflow()]);
  const [savePulse, setSavePulse] = useState(false);
  const [workflowSearch, setWorkflowSearch] = useState("");
  const [workflowGroupFilters, setWorkflowGroupFilters] = useState<string[]>([]);
  const [workflowPlatformFilters, setWorkflowPlatformFilters] = useState<string[]>([]);
  const [selectedScriptStepId, setSelectedScriptStepId] = useState<string>("");
  const [lastSelectedWorkflowIndex, setLastSelectedWorkflowIndex] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5000);
  const [tableScrollTop, setTableScrollTop] = useState(0);
  const [automationRunning, setAutomationRunning] = useState(false);
  const [pinnedHistoryId, setPinnedHistoryId] = useState<string | null>(null);
  const [pendingWorkflowImportId, setPendingWorkflowImportId] = useState<string>("");
  const [workflowUndoStack, setWorkflowUndoStack] = useState<WorkflowConfig[][]>([]);
  const [workflowRedoStack, setWorkflowRedoStack] = useState<WorkflowConfig[][]>([]);
  const tableWrapRef = useRef<HTMLDivElement>(null);
  const workflowImportRef = useRef<HTMLInputElement>(null);
  const singleWorkflowImportRef = useRef<HTMLInputElement>(null);

  const selectedProfiles = useMemo(
    () => profiles.filter((profile) => selected.has(profileId(profile))),
    [profiles, selected]
  );

  const filteredProfiles = useMemo(() => {
    const term = search.trim().toLowerCase();
    return profiles.filter((profile) => {
      const matchesSearch = !term || profileName(profile).toLowerCase().includes(term);
      const matchesGroup = selectedGroupIds.length === 0 || selectedGroupIds.includes(String(profile.group_id));
      return matchesSearch && matchesGroup;
    });
  }, [profiles, search, selectedGroupIds]);

  const totalPages = Math.max(1, Math.ceil(filteredProfiles.length / pageSize));
  const pageStart = (currentPage - 1) * pageSize;
  const pageEnd = Math.min(pageStart + pageSize, filteredProfiles.length);
  const pagedProfiles = filteredProfiles.slice(pageStart, pageEnd);
  const virtualStart = Math.max(0, Math.floor(tableScrollTop / ROW_HEIGHT) - VIRTUAL_OVERSCAN);
  const visibleRowCapacity = Math.ceil((tableWrapRef.current?.clientHeight || 640) / ROW_HEIGHT) + VIRTUAL_OVERSCAN * 2;
  const virtualEnd = Math.min(pagedProfiles.length, virtualStart + visibleRowCapacity);
  const virtualProfiles = pagedProfiles.slice(virtualStart, virtualEnd);
  const topSpacerHeight = virtualStart * ROW_HEIGHT;
  const bottomSpacerHeight = Math.max(0, (pagedProfiles.length - virtualEnd) * ROW_HEIGHT);
  const workflowConfigs = view === "scripts" ? draftWorkflowConfigs : savedWorkflowConfigs;
  const activeWorkflowConfig = workflowConfigs.find((workflow) => workflow.id === activeWorkflow) || workflowConfigs[0];
  const ActiveWorkflowIcon = workflowIconFor(activeWorkflowConfig.icon);
  const workflowName = activeWorkflowConfig.name;
  const selectedWorkflowConfigs = useMemo(
    () => selectedWorkflowIds.map((id) => workflowConfigs.find((workflow) => workflow.id === id)).filter(Boolean) as WorkflowConfig[],
    [selectedWorkflowIds, workflowConfigs]
  );
  const runWorkflowConfigs = selectedWorkflowConfigs.length > 0 ? selectedWorkflowConfigs : [activeWorkflowConfig];
  const runWorkflowLabel = runWorkflowConfigs.length === 1 ? runWorkflowConfigs[0].name : `${runWorkflowConfigs.length} workflows`;
  const selectedScriptStep = activeWorkflowConfig.steps.find((step) => step.id === selectedScriptStepId) || activeWorkflowConfig.steps[0];
  const workflowGroups = useMemo(() => Array.from(new Set(workflowConfigs.map((workflow) => workflow.group))), [workflowConfigs]);
  const workflowPlatforms = useMemo(() => Array.from(new Set(workflowConfigs.map(workflowDisplayPlatform))), [workflowConfigs]);
  const workflowGroupOptions = useMemo(
    () => workflowGroups.map((group) => ({ value: group, label: group })),
    [workflowGroups]
  );
  const workflowPlatformOptions = useMemo(
    () => workflowPlatforms.map((platform) => ({ value: platform, label: platform })),
    [workflowPlatforms]
  );
  const profileGroupOptions = useMemo(
    () => groups.map((group) => ({ value: String(group.id), label: groupName(group) })),
    [groups]
  );
  const filteredWorkflows = useMemo(() => {
    const term = workflowSearch.trim().toLowerCase();
    return workflowConfigs.filter((workflow) => {
      const displayId = workflowDisplayId(workflow.id).toLowerCase();
      const displayPlatform = workflowDisplayPlatform(workflow);
      const matchesTerm =
        !term ||
        displayId.includes(term) ||
        workflow.id.toLowerCase().includes(term) ||
        workflow.name.toLowerCase().includes(term) ||
        workflow.description.toLowerCase().includes(term) ||
        displayPlatform.toLowerCase().includes(term) ||
        workflow.group.toLowerCase().includes(term);
      const matchesGroup = workflowGroupFilters.length === 0 || workflowGroupFilters.includes(workflow.group);
      const matchesPlatform = workflowPlatformFilters.length === 0 || workflowPlatformFilters.includes(displayPlatform);
      return matchesTerm && matchesGroup && matchesPlatform;
    });
  }, [workflowConfigs, workflowGroupFilters, workflowPlatformFilters, workflowSearch]);
  useEffect(() => {
    setCurrentPage(1);
    setLastSelectedIndex(null);
    setTableScrollTop(0);
    if (tableWrapRef.current) tableWrapRef.current.scrollTop = 0;
  }, [pageSize, search, selectedGroupIds]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  useEffect(() => {
    setTableScrollTop(0);
    if (tableWrapRef.current) tableWrapRef.current.scrollTop = 0;
  }, [currentPage]);

  useEffect(() => {
    localStorage.setItem(ACTIVE_WORKFLOW_KEY, activeWorkflow);
  }, [activeWorkflow]);

  useEffect(() => {
    const workflow = workflowConfigs.find((item) => item.id === activeWorkflow);
    if (!workflow?.steps.length) {
      setSelectedScriptStepId("");
      return;
    }
    if (!workflow.steps.some((step) => step.id === selectedScriptStepId)) {
      setSelectedScriptStepId(workflow.steps[0].id);
    }
  }, [activeWorkflow, selectedScriptStepId, workflowConfigs]);

  useEffect(() => {
    function closeHistoryPopover(event: KeyboardEvent) {
      if (event.key === "Escape") setPinnedHistoryId(null);
    }

    window.addEventListener("keydown", closeHistoryPopover);
    return () => window.removeEventListener("keydown", closeHistoryPopover);
  }, []);

  useEffect(() => {
    function handleProfileShortcuts(event: KeyboardEvent) {
      if (view !== "profiles") return;
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "a") return;

      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName.toLowerCase();
      if (tagName === "input" || tagName === "textarea" || target?.isContentEditable) return;

      event.preventDefault();
      selectAllFilteredRows();
    }

    window.addEventListener("keydown", handleProfileShortcuts);
    return () => window.removeEventListener("keydown", handleProfileShortcuts);
  }, [filteredProfiles, view]);

  async function refreshAll() {
    setBusy(true);
    setError("");
    try {
      const [health, nextGroups, nextProfiles] = await Promise.all([
        checkHealth(baseUrl),
        getGroups(baseUrl),
        getProfiles(baseUrl, {})
      ]);
      setApiStatus(health.ok === false ? "offline" : "connected");
      setGroups(nextGroups);
      setProfiles((current) =>
        nextProfiles.map((profile) => ({
          ...profile,
          status: current.find((item) => profileId(item) === profileId(profile))?.status || "closed",
          lastMessage: current.find((item) => profileId(item) === profileId(profile))?.lastMessage
        }))
      );
    } catch (refreshError) {
      setApiStatus("offline");
      setError(refreshError instanceof Error ? refreshError.message : "Unable to load GPM data.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    refreshAll();
  }, []);

  function setThemeMode(next: Theme) {
    localStorage.setItem(THEME_KEY, next);
    setTheme(next);
  }

  function addLog(level: RunLog["level"], profileNameValue: string, message: string) {
    setLogs((items) =>
      [
        {
          id: crypto.randomUUID(),
          time: now(),
          level,
          profileName: profileNameValue,
          message
        },
        ...items
      ].slice(0, 240)
    );
  }

  function addHistory(item: RunHistoryItem) {
    setHistory((items) => [item, ...items].slice(0, 160));
  }

  function updateHistory(id: string, patch: Partial<RunHistoryItem>) {
    setHistory((items) => items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function updateProfileStatus(id: string | number, status: ProfileRow["status"], lastMessage?: string) {
    setProfiles((items) =>
      items.map((profile) => (profileId(profile) === id ? { ...profile, status, lastMessage } : profile))
    );
  }

  function selectRow(profile: ProfileRow, index: number, event: MouseEvent<HTMLTableRowElement>) {
    const id = profileId(profile);

    if (event.shiftKey && lastSelectedIndex !== null) {
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);
      const rangeIds = filteredProfiles.slice(start, end + 1).map(profileId);
      setSelected(new Set(rangeIds));
      return;
    }

    if (event.ctrlKey || event.metaKey) {
      setSelected((items) => {
        const next = new Set(items);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
      setLastSelectedIndex(index);
      return;
    }

    setSelected(new Set([id]));
    setLastSelectedIndex(index);
  }

  function selectVisibleRows() {
    setSelected(new Set(pagedProfiles.map(profileId)));
    setLastSelectedIndex(pagedProfiles.length ? pageStart : null);
  }

  function selectAllFilteredRows() {
    setSelected(new Set(filteredProfiles.map(profileId)));
    setLastSelectedIndex(filteredProfiles.length ? 0 : null);
  }

  function clearSelection() {
    setSelected(new Set());
    setLastSelectedIndex(null);
  }

  function handleTableScroll(event: UIEvent<HTMLDivElement>) {
    setTableScrollTop(event.currentTarget.scrollTop);
  }

  function updateActiveWorkflowConfig(patch: Partial<WorkflowConfig>) {
    setDraftWorkflowConfigs((items) =>
      items.map((workflow) =>
        workflow.id === activeWorkflow
          ? {
              ...workflow,
              ...patch,
              concurrency: patch.concurrency === undefined ? workflow.concurrency : clampConcurrency(Number(patch.concurrency))
            }
          : workflow
      )
    );
  }

  function updateWorkflowConfigsWithHistory(updater: (items: WorkflowConfig[]) => WorkflowConfig[]) {
    setDraftWorkflowConfigs((items) => {
      setWorkflowUndoStack((stack) => [...stack.slice(-19), items]);
      setWorkflowRedoStack([]);
      return updater(items);
    });
  }

  function updateActiveScriptStep(stepId: string, patch: Partial<ScriptStep>) {
    updateWorkflowConfigsWithHistory((items) =>
      items.map((workflow) =>
        workflow.id === activeWorkflow
          ? {
              ...workflow,
              steps: workflow.steps.map((step) =>
                step.id === stepId
                  ? {
                      ...step,
                      ...patch,
                      timeoutMs: patch.timeoutMs === undefined ? step.timeoutMs : clampTimeout(Number(patch.timeoutMs))
                    }
                  : step
              )
            }
          : workflow
      )
    );
  }

  function addScriptStep(kind: ScriptStepKind) {
    const step = createStep(kind);
    updateWorkflowConfigsWithHistory((items) =>
      items.map((workflow) =>
        workflow.id === activeWorkflow
          ? {
              ...workflow,
              steps: [...workflow.steps, step]
            }
          : workflow
      )
    );
    setSelectedScriptStepId(step.id);
  }

  function removeScriptStep(stepId: string) {
    updateWorkflowConfigsWithHistory((items) =>
      items.map((workflow) =>
        workflow.id === activeWorkflow
          ? {
              ...workflow,
              steps: workflow.steps.filter((step) => step.id !== stepId)
            }
          : workflow
      )
    );
  }

  function moveScriptStep(stepId: string, direction: -1 | 1) {
    updateWorkflowConfigsWithHistory((items) =>
      items.map((workflow) => {
        if (workflow.id !== activeWorkflow) return workflow;
        const index = workflow.steps.findIndex((step) => step.id === stepId);
        const nextIndex = index + direction;
        if (index < 0 || nextIndex < 0 || nextIndex >= workflow.steps.length) return workflow;
        const steps = [...workflow.steps];
        const [step] = steps.splice(index, 1);
        steps.splice(nextIndex, 0, step);
        return { ...workflow, steps };
      })
    );
  }

  function createWorkflowDraft(source?: WorkflowConfig): WorkflowConfig {
    const id = `workflow-${Date.now()}`;
    if (!source) {
      return {
        id,
        name: "New Workflow",
        description: "Custom workflow script.",
        icon: "play",
        group: "Core",
        platform: "Generic",
        action: "open-url",
        targetUrl: "",
        takeScreenshot: true,
        closeWhenDone: false,
        inspectMode: false,
        concurrency: 1,
        steps: [createStep("navigate", { value: "" })]
      };
    }

    const base = source;
    return {
      ...base,
      id,
      name: `${source.name} Copy`,
      description: source.description,
      action: "open-url",
      targetUrl: source?.targetUrl || "https://example.com",
      steps: (source?.steps || workflowSteps("https://example.com", true)).map((step) => ({
        ...step,
        id: crypto.randomUUID()
      }))
    };
  }

  function addWorkflow() {
    const workflow = createWorkflowDraft();
    updateWorkflowConfigsWithHistory((items) => [...items, workflow]);
    setActiveWorkflow(workflow.id);
    setSelectedWorkflowIds([workflow.id]);
  }

  function duplicateWorkflow() {
    const workflow = createWorkflowDraft(activeWorkflowConfig);
    updateWorkflowConfigsWithHistory((items) => [...items, workflow]);
    setActiveWorkflow(workflow.id);
    setSelectedWorkflowIds([workflow.id]);
  }

  function deleteActiveWorkflow() {
    if (workflowConfigs.length <= 1) return;
    const nextItems = workflowConfigs.filter((workflow) => workflow.id !== activeWorkflow);
    updateWorkflowConfigsWithHistory(() => nextItems);
    const nextActive = nextItems[0]?.id || "open-url";
    setActiveWorkflow(nextActive);
    setSelectedWorkflowIds([nextActive]);
  }

  function resetWorkflows() {
    setDraftWorkflowConfigs(DEFAULT_WORKFLOWS);
    setActiveWorkflow("open-url");
    setSelectedWorkflowIds(["open-url"]);
  }

  function exportWorkflows() {
    const blob = new Blob([JSON.stringify(workflowExportPayload(workflowConfigs), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `gpm-workflows-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function exportWorkflow(workflow: WorkflowConfig) {
    const blob = new Blob([JSON.stringify(workflowExportPayload([workflow])[0], null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${workflow.id || "workflow"}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function copyWorkflow(workflow: WorkflowConfig) {
    const draft = createWorkflowDraft(workflow);
    setDraftWorkflowConfigs((items) => [...items, draft]);
    setActiveWorkflow(draft.id);
    setSelectedWorkflowIds([draft.id]);
  }

  function resetWorkflow(workflowId: string) {
    const fallback = DEFAULT_WORKFLOWS.find((workflow) => workflow.id === workflowId);
    if (!fallback) return;
    updateWorkflowConfigsWithHistory((items) => items.map((workflow) => (workflow.id === workflowId ? fallback : workflow)));
  }

  function undoWorkflowChange() {
    setWorkflowUndoStack((stack) => {
      const previous = stack.at(-1);
      if (!previous) return stack;
      setWorkflowRedoStack((redoStack) => [...redoStack.slice(-19), workflowConfigs]);
      setDraftWorkflowConfigs(previous);
      return stack.slice(0, -1);
    });
  }

  function redoWorkflowChange() {
    setWorkflowRedoStack((stack) => {
      const next = stack.at(-1);
      if (!next) return stack;
      setWorkflowUndoStack((undoStack) => [...undoStack.slice(-19), workflowConfigs]);
      setDraftWorkflowConfigs(next);
      return stack.slice(0, -1);
    });
  }

  function saveWorkflowChanges() {
    localStorage.setItem(WORKFLOWS_KEY, JSON.stringify(draftWorkflowConfigs));
    setSavedWorkflowConfigs(draftWorkflowConfigs);
    setSavePulse(true);
    window.setTimeout(() => setSavePulse(false), 1200);
    addLog("success", "Workflows", "Workflow changes saved");
  }

  function openProfilesForWorkflow(workflowId: string) {
    setActiveWorkflow(workflowId);
    setSelectedWorkflowIds([workflowId]);
    setView("profiles");
  }

  async function copyWorkflowId(id: string) {
    const displayId = workflowDisplayId(id);
    try {
      await navigator.clipboard.writeText(displayId);
      addLog("success", "Workflows", `Copied ${displayId}`);
    } catch {
      addLog("error", "Workflows", `Unable to copy ${displayId}`);
    }
  }

  function startWorkflowImport(workflowId: string) {
    setPendingWorkflowImportId(workflowId);
    singleWorkflowImportRef.current?.click();
  }

  async function importSingleWorkflow(file: File | undefined) {
    if (!file || !pendingWorkflowImportId) return;
    try {
      const data = JSON.parse(await file.text()) as WorkflowConfig;
      if (!data || Array.isArray(data) || typeof data !== "object") throw new Error("Workflow JSON must be a single workflow object.");
      const imported = {
        ...data,
        id: pendingWorkflowImportId,
        icon: data.icon || "play",
        group: data.group || "Core",
        platform: data.platform || "Generic",
        action: data.action || "open-url",
        concurrency: clampConcurrency(Number(data.concurrency || 1)),
        steps: Array.isArray(data.steps) && data.steps.length ? data.steps.map((step) => ({ ...step, id: step.id || crypto.randomUUID(), enabled: Boolean(step.enabled ?? true) })) : workflowSteps(data.targetUrl || "https://example.com", true)
      };
      setDraftWorkflowConfigs((items) => items.map((workflow) => (workflow.id === pendingWorkflowImportId ? imported : workflow)));
      setActiveWorkflow(pendingWorkflowImportId);
      setSelectedWorkflowIds([pendingWorkflowImportId]);
      addLog("success", "Workflows", `Imported workflow into ${pendingWorkflowImportId}`);
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "Unable to import workflow JSON.");
    } finally {
      setPendingWorkflowImportId("");
      if (singleWorkflowImportRef.current) singleWorkflowImportRef.current.value = "";
    }
  }

  async function importWorkflows(file: File | undefined) {
    if (!file) return;
    try {
      const data = JSON.parse(await file.text()) as WorkflowConfig[];
      if (!Array.isArray(data) || data.length === 0) throw new Error("Workflow JSON must be an array.");
      const imported = data.map((workflow) => ({
        ...workflow,
        id: workflow.id || `workflow-${crypto.randomUUID()}`,
        icon: workflow.icon || "play",
        group: workflow.group || "Core",
        platform: workflow.platform || "Generic",
        action: workflow.action || "open-url",
        concurrency: clampConcurrency(Number(workflow.concurrency || 1)),
        steps: Array.isArray(workflow.steps) && workflow.steps.length ? workflow.steps.map((step) => ({ ...step, id: step.id || crypto.randomUUID(), enabled: Boolean(step.enabled ?? true) })) : workflowSteps(workflow.targetUrl || "https://example.com", true)
      }));
      setDraftWorkflowConfigs(imported);
      setActiveWorkflow(imported[0].id);
      setSelectedWorkflowIds([imported[0].id]);
      addLog("success", "Workflows", `Imported ${imported.length} workflows`);
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "Unable to import workflow JSON.");
    } finally {
      if (workflowImportRef.current) workflowImportRef.current.value = "";
    }
  }

  function selectWorkflow(workflowId: WorkflowId, event: MouseEvent<HTMLDivElement>) {
    setActiveWorkflow(workflowId);

    if (event.ctrlKey || event.metaKey) {
      setSelectedWorkflowIds((current) => {
        const next = new Set(current);
        if (next.has(workflowId)) next.delete(workflowId);
        else next.add(workflowId);
        return Array.from(next);
      });
      return;
    }

    setSelectedWorkflowIds([workflowId]);
  }

  function selectScriptWorkflow(workflowId: WorkflowId, index: number, event: MouseEvent<HTMLDivElement>) {
    setActiveWorkflow(workflowId);

    if (event.shiftKey && lastSelectedWorkflowIndex !== null) {
      const start = Math.min(lastSelectedWorkflowIndex, index);
      const end = Math.max(lastSelectedWorkflowIndex, index);
      setSelectedWorkflowIds(filteredWorkflows.slice(start, end + 1).map((workflow) => workflow.id));
      return;
    }

    if (event.ctrlKey || event.metaKey) {
      setSelectedWorkflowIds((current) => {
        const next = new Set(current);
        if (next.has(workflowId)) next.delete(workflowId);
        else next.add(workflowId);
        return Array.from(next);
      });
      setLastSelectedWorkflowIndex(index);
      return;
    }

    setSelectedWorkflowIds([workflowId]);
    setLastSelectedWorkflowIndex(index);
  }

  async function openOne(profile: ProfileRow) {
    const id = profileId(profile);
    updateProfileStatus(id, "opening", "Opening profile");
    addLog("info", profileName(profile), "Starting GPM profile");
    try {
      const response = await startProfile(baseUrl, id);
      const data = (response.data || {}) as GpmProfile;
      updateProfileStatus(id, "running", data.remote_debugging_address || "Profile is running");
      addLog("success", profileName(profile), data.remote_debugging_address || "Profile opened");
    } catch (openError) {
      const message = openError instanceof Error ? openError.message : "Failed to open profile";
      updateProfileStatus(id, "failed", message);
      addLog("error", profileName(profile), message);
    }
  }

  async function closeOne(profile: ProfileRow) {
    const id = profileId(profile);
    addLog("info", profileName(profile), "Closing GPM profile");
    try {
      await closeProfile(baseUrl, id);
      updateProfileStatus(id, "closed", "Closed");
      addLog("success", profileName(profile), "Profile closed");
    } catch (closeError) {
      const message = closeError instanceof Error ? closeError.message : "Failed to close profile";
      updateProfileStatus(id, "failed", message);
      addLog("error", profileName(profile), message);
    }
  }

  async function createNewProfile() {
    if (!newName.trim()) return;
    setBusy(true);
    setError("");
    try {
      await createProfile(baseUrl, {
        profile_name: newName.trim(),
        group_id: newProfileGroupId ? Number(newProfileGroupId) : undefined
      });
      setNewName("");
      setShowCreate(false);
      await refreshAll();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create profile.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteSelected() {
    if (selectedProfiles.length === 0) return;
    setBusy(true);
    setError("");
    try {
      for (const profile of selectedProfiles) {
        await deleteProfile(baseUrl, profileId(profile));
        addLog("success", profileName(profile), "Profile deleted");
      }
      clearSelection();
      await refreshAll();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete selected profiles.");
    } finally {
      setBusy(false);
    }
  }

  async function runProfileAutomation(profile: ProfileRow, workflow: WorkflowConfig, url: string) {
    const id = profileId(profile);
    const startedAt = Date.now();
    const historyId = crypto.randomUUID();
    updateProfileStatus(id, "opening", "Opening profile and connecting CDP");
    addLog("info", profileName(profile), `${workflow.name} started: ${url}`);
    addHistory({
      id: historyId,
      profileName: profileName(profile),
      workflowName: workflow.name,
      targetUrl: url,
      status: "running",
      startedAt,
      durationMs: 0,
      finishedAt: "Running"
    });

    try {
      const result = await runOpenUrlAutomation(baseUrl, profile, {
        targetUrl: url,
        screenshot: workflow.takeScreenshot,
        closeWhenDone: workflow.closeWhenDone,
        workflowAction: workflow.action,
        inspectMode: workflow.inspectMode,
        steps: workflow.steps
      });

      result.logs.forEach((log) => addLog(log.level, profileName(profile), log.message));

      if (result.ok) {
        updateProfileStatus(
          id,
          workflow.closeWhenDone ? "closed" : "running",
          result.screenshotPath ? `Screenshot saved: ${result.screenshotPath}` : "Automation completed"
        );
        updateHistory(historyId, {
          status: "success",
          durationMs: Date.now() - startedAt,
          finishedAt: now(),
          screenshotPath: result.screenshotPath
        });
      } else {
        updateProfileStatus(id, "failed", result.error || "Automation failed");
        updateHistory(historyId, {
          status: "failed",
          durationMs: Date.now() - startedAt,
          finishedAt: now(),
          error: result.error || "Automation failed"
        });
      }
    } catch (automationError) {
      const message = automationError instanceof Error ? automationError.message : "Automation failed";
      updateProfileStatus(id, "failed", message);
      addLog("error", profileName(profile), message);
      updateHistory(historyId, {
        status: "failed",
        durationMs: Date.now() - startedAt,
        finishedAt: now(),
        error: message
      });
    }
  }

  async function runAutomationQueue() {
    if (selectedProfiles.length === 0 || runWorkflowConfigs.length === 0) return;

    setAutomationRunning(true);
    setError("");

    try {
      for (const workflow of runWorkflowConfigs) {
        const url = normalizeUrl(workflow.targetUrl);
        if (!url) {
          addLog("error", workflow.name, "Automation URL is empty.");
          continue;
        }

        try {
          new URL(url);
        } catch {
          addLog("error", workflow.name, "Automation URL is invalid.");
          continue;
        }

        addLog("info", workflow.name, `Workflow queue started for ${selectedProfiles.length} profiles`);
        const queue = [...selectedProfiles];
        let nextIndex = 0;
        const workerCount = Math.min(clampConcurrency(workflow.concurrency), queue.length);

        await Promise.all(
          Array.from({ length: workerCount }, async () => {
            while (nextIndex < queue.length) {
              const profile = queue[nextIndex];
              nextIndex += 1;
              await runProfileAutomation(profile, workflow, url);
            }
          })
        );
      }
    } finally {
      setAutomationRunning(false);
    }
  }

  function saveSettings() {
    setStoredBaseUrl(baseUrl);
    refreshAll();
  }

  const readyCount = profiles.filter((profile) => profile.status === "closed").length;
  const runningCount = profiles.filter((profile) => profile.status === "running" || profile.status === "opening").length;
  const failedCount = profiles.filter((profile) => profile.status === "failed").length;
  const historyCounts = useMemo(
    () => ({
      total: history.length,
      running: history.filter((item) => item.status === "running").length,
      success: history.filter((item) => item.status === "success").length,
      failed: history.filter((item) => item.status === "failed").length
    }),
    [history]
  );

  return (
    <div className={`shell theme-${theme}`}>
      <aside className="sidebar">
        <div className="brand-mark">G</div>
        <nav>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => setView(item.id)} title={item.label}>
                <Icon size={20} />
              </button>
            );
          })}
        </nav>
        <div className={`api-dot ${apiStatus}`} title={apiStatus}>
          {apiStatus === "connected" ? <CheckCircle2 size={18} /> : <CircleAlert size={18} />}
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div className="topbar-title">
            <h1>{view === "profiles" ? "GPM Native Console" : view === "scripts" ? "Scripts" : "Settings"}</h1>
          </div>
          <div className="top-actions">
            <span className={`api-pill ${apiStatus}`}>
              {apiStatus === "connected" ? "API connected" : apiStatus === "checking" ? "Checking API" : "API offline"}
            </span>
            <button className="ghost slim-button" onClick={refreshAll} disabled={busy} title="Refresh profiles">
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </header>

        {error && (
          <div className="notice">
            <XCircle size={18} />
            {error}
          </div>
        )}
        <input
          ref={workflowImportRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(event) => importWorkflows(event.target.files?.[0])}
        />
        <input
          ref={singleWorkflowImportRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(event) => importSingleWorkflow(event.target.files?.[0])}
        />

        {view === "profiles" && (
          <section className="layout native-pro-layout">
            <div className="native-main">
              <div className="pane-header compact-pane">
                <div className="toolbar">
                  <button className="primary slim-button" onClick={() => setShowCreate(true)}>
                    <Plus size={15} />
                    New
                  </button>
                  <button className="danger slim-button" onClick={deleteSelected} disabled={!selectedProfiles.length || busy}>
                    <Trash2 size={15} />
                    Delete
                  </button>
                </div>
                <div className="filters">
                  <label className="input with-icon">
                    <Search size={16} />
                    <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search profiles" />
                  </label>
                  <MultiSelectDropdown
                    values={selectedGroupIds}
                    options={profileGroupOptions}
                    label="All groups"
                    searchLabel="Search groups..."
                    summaryLabel="groups"
                    onChange={setSelectedGroupIds}
                  />
                </div>
              </div>

              <div className="selection-bar compact-selection">
                <button className="icon-only" onClick={clearSelection} title="Clear selection">
                  <X size={17} />
                </button>
                <span>{selectedProfiles.length} selected</span>
                <button className="ghost slim-button" onClick={selectVisibleRows}>
                  Select visible
                </button>
                <button className="run icon-command" onClick={() => selectedProfiles.forEach(openOne)} disabled={!selectedProfiles.length} title="Open selected">
                  <Play size={16} />
                </button>
                <button className="stop icon-command" onClick={() => selectedProfiles.forEach(closeOne)} disabled={!selectedProfiles.length} title="Close selected">
                  <Square size={15} />
                </button>
              </div>

              <div className="table-panel native-table row-select-table">
                <div className="table-wrap" ref={tableWrapRef} onScroll={handleTableScroll}>
                  <table>
                    <thead>
                      <tr>
                        <th>Profile</th>
                        <th>Group</th>
                        <th>Status</th>
                        <th>Proxy</th>
                        <th>Note</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {topSpacerHeight > 0 && (
                        <tr className="virtual-spacer" aria-hidden="true">
                          <td colSpan={6} style={{ height: topSpacerHeight }} />
                        </tr>
                      )}
                      {virtualProfiles.map((profile, index) => (
                        <tr
                          key={profileId(profile)}
                          className={selected.has(profileId(profile)) ? "selected-row" : ""}
                          onClick={(event) => selectRow(profile, pageStart + virtualStart + index, event)}
                        >
                          <td>
                            <strong>{profileName(profile)}</strong>
                          </td>
                          <td>{profile.group_name || profile.group_id || "-"}</td>
                          <td>
                            <span className={`status ${profile.status}`}>{statusLabel(profile.status)}</span>
                          </td>
                          <td>{profile.raw_proxy || profile.proxy || "Local IP"}</td>
                          <td className="note-cell">{profile.lastMessage || profile.note || "-"}</td>
                          <td className="row-actions">
                            <button
                              className="icon-action open-action"
                              title="Open profile"
                              onClick={(event) => {
                                event.stopPropagation();
                                openOne(profile);
                              }}
                            >
                              <Play size={16} />
                            </button>
                            <button
                              className="icon-action close-action"
                              title="Close profile"
                              onClick={(event) => {
                                event.stopPropagation();
                                closeOne(profile);
                              }}
                            >
                              <Square size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {bottomSpacerHeight > 0 && (
                        <tr className="virtual-spacer" aria-hidden="true">
                          <td colSpan={6} style={{ height: bottomSpacerHeight }} />
                        </tr>
                      )}
                      {filteredProfiles.length === 0 && (
                        <tr>
                          <td colSpan={6} className="empty">
                            No profiles found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="pagination-footer">
                  <div className="pagination-actions">
                    <button className="page-button" onClick={() => setCurrentPage(1)} disabled={currentPage === 1} title="First page">
                      <ChevronFirst size={15} />
                    </button>
                    <button
                      className="page-button"
                      onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                      disabled={currentPage === 1}
                      title="Previous page"
                    >
                      <ChevronLeft size={15} />
                    </button>
                    <span>
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      className="page-button"
                      onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                      disabled={currentPage === totalPages}
                      title="Next page"
                    >
                      <ChevronRight size={15} />
                    </button>
                    <button
                      className="page-button"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      title="Last page"
                    >
                      <ChevronLast size={15} />
                    </button>
                  </div>
                  <div className="pagination-meta">
                    <span>
                      {filteredProfiles.length === 0 ? "0" : pageStart + 1}-{pageEnd} of {filteredProfiles.length} profiles
                    </span>
                    <label>
                      Profiles per page
                      <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
                        {PAGE_SIZE_OPTIONS.map((size) => (
                          <option key={size} value={size}>
                            {size}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <aside className="native-drawer">
              <section className="runner-card runtime-card">
                <div className="runner-title">
                  <h2>Automation Runtime</h2>
                  <span className={automationRunning ? "run-state active" : "run-state"}>
                    {automationRunning ? "Running" : "Idle"}
                  </span>
                </div>

                <div className="runtime-grid">
                  <div className="metric-card">
                    <span>Selected</span>
                    <strong>{selectedProfiles.length}</strong>
                  </div>
                  <div className="metric-card">
                    <span>Ready</span>
                    <strong>{readyCount}</strong>
                  </div>
                  <div className="metric-card">
                    <span>Running</span>
                    <strong>{runningCount}</strong>
                  </div>
                  <div className="metric-card danger">
                    <span>Failed</span>
                    <strong>{failedCount}</strong>
                  </div>
                </div>

              </section>

              <section className="runner-card workflow-frame">
                <div className="workflow-manager">
                  <div className="section-title">
                    <h2>Workflow Manager</h2>
                    <span>{filteredWorkflows.length} of {workflowConfigs.length} presets</span>
                  </div>
                  <div className="workflow-filters">
                    <label className="input with-icon workflow-search">
                      <Search size={15} />
                      <input value={workflowSearch} onChange={(event) => setWorkflowSearch(event.target.value)} placeholder="Search workflows" />
                    </label>
                    <MultiSelectDropdown
                      values={workflowGroupFilters}
                      options={workflowGroupOptions}
                      label="All groups"
                      searchLabel="Search groups..."
                      summaryLabel="groups"
                      onChange={setWorkflowGroupFilters}
                    />
                    <MultiSelectDropdown
                      values={workflowPlatformFilters}
                      options={workflowPlatformOptions}
                      label="All platforms"
                      searchLabel="Search platforms..."
                      summaryLabel="platforms"
                      onChange={setWorkflowPlatformFilters}
                    />
                  </div>
                  <div className="workflow-list">
                    {filteredWorkflows.map((workflow) => {
                      const displayPlatform = workflowDisplayPlatform(workflow);
                      const WorkflowIcon = workflowPlatformIconFor(displayPlatform);
                      const platformSvgUrl = workflowPlatformSvgUrl(displayPlatform);
                      const isActive = workflow.id === activeWorkflow;
                      const workers = Math.min(clampConcurrency(workflow.concurrency), Math.max(selectedProfiles.length, 1));
                      return (
                        <div
                          className={
                            selectedWorkflowIds.includes(workflow.id)
                              ? "workflow-card workflow-option active"
                              : isActive
                                ? "workflow-card workflow-option focused"
                                : "workflow-card workflow-option"
                          }
                          key={workflow.id}
                          role="button"
                          tabIndex={0}
                          onClick={(event) => selectWorkflow(workflow.id, event)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              setActiveWorkflow(workflow.id);
                              setSelectedWorkflowIds([workflow.id]);
                            }
                          }}
                        >
                          <span className={`workflow-icon workflow-brand-icon ${workflowPlatformTone(displayPlatform)}`}>
                            {platformSvgUrl ? <img src={platformSvgUrl} alt="" /> : <WorkflowIcon size={15} />}
                          </span>
                          <span className="workflow-id">{workflowDisplayId(workflow.id)}</span>
                          <strong>{workflow.name}</strong>
                          <span className="workflow-meta">
                            {workflow.group} / {displayPlatform} / {workers} workers /{" "}
                            {workflow.steps.length} steps / {workflow.targetUrl || "-"}
                            {workflow.inspectMode ? " / Inspect" : ""}
                          </span>
                          <button
                            className="icon-only compact-icon"
                            title="Workflow settings"
                            onClick={(event) => {
                              event.stopPropagation();
                              setActiveWorkflow(workflow.id);
                              setShowWorkflowSettings(true);
                            }}
                          >
                            <Settings size={15} />
                          </button>
                        </div>
                      );
                    })}
                    {filteredWorkflows.length === 0 && <p className="muted">No workflows match the current filters.</p>}
                  </div>
                </div>

                <button
                  className="primary full"
                  onClick={runAutomationQueue}
                  disabled={!selectedProfiles.length || automationRunning || !runWorkflowConfigs.some((workflow) => workflow.targetUrl.trim())}
                >
                  <ActiveWorkflowIcon size={16} />
                  {automationRunning ? "Running..." : `Run ${runWorkflowLabel}`}
                </button>
              </section>

              <section className="runner-card history-card">
                <div className="console-header">
                  <div>
                    <h2>
                      <History size={15} />
                      Run History
                    </h2>
                    <div className="history-counters">
                      <span>{historyCounts.total} total</span>
                      <span className="success">{historyCounts.success} success</span>
                      <span className="running">{historyCounts.running} running</span>
                      <span className="failed">{historyCounts.failed} failed</span>
                    </div>
                  </div>
                  <button
                    className="ghost compact"
                    onClick={() => {
                      setHistory([]);
                      setPinnedHistoryId(null);
                    }}
                  >
                    Clear
                  </button>
                </div>
                <div className="history-dot-grid" onMouseLeave={() => !pinnedHistoryId && setPinnedHistoryId(null)}>
                  {history.map((item) => (
                    <button
                      className={`history-dot ${item.status}`}
                      key={item.id}
                      title={`${item.profileName} - ${item.status}`}
                      onMouseEnter={() => setPinnedHistoryId(item.id)}
                      onFocus={() => setPinnedHistoryId(item.id)}
                      onClick={() => setPinnedHistoryId((current) => (current === item.id ? null : item.id))}
                    >
                      <span />
                    </button>
                  ))}
                  {history.length === 0 && <p className="muted">No completed runs yet.</p>}
                </div>
                {pinnedHistoryId && (
                  <div className="history-popover" role="dialog">
                    {history
                      .filter((item) => item.id === pinnedHistoryId)
                      .map((item) => (
                        <div key={item.id}>
                          <div className="history-popover-title">
                            <strong>{item.profileName}</strong>
                            <span className={`history-status ${item.status}`}>{item.status}</span>
                          </div>
                          <p>{item.workflowName}</p>
                          <p>{item.targetUrl}</p>
                          <div className="history-popover-meta">
                            <span>
                              <Clock3 size={12} />
                              {item.status === "running" ? "Running" : formatDuration(item.durationMs)}
                            </span>
                            <span>{item.finishedAt}</span>
                          </div>
                          {item.screenshotPath && (
                            <p className="history-path">
                              <Image size={12} />
                              {item.screenshotPath}
                            </p>
                          )}
                          {item.error && <p className="history-error">{item.error}</p>}
                        </div>
                      ))}
                  </div>
                )}
              </section>

              <section className="runner-card console-card">
                <div className="console-header">
                  <h2>
                    <Terminal size={15} />
                    Console
                  </h2>
                  <button className="ghost compact" onClick={() => setLogs([])}>
                    Clear
                  </button>
                </div>
                <div className="console">
                  {logs.map((log) => (
                    <div className={`log-line ${log.level}`} key={log.id}>
                      <span>{log.time}</span>
                      <strong>{log.profileName}</strong>
                      <p>{log.message}</p>
                    </div>
                  ))}
                  {logs.length === 0 && <p className="muted">No events yet.</p>}
                </div>
              </section>

            </aside>
          </section>
        )}

        {view === "scripts" && (
          <section className="script-builder">
            <aside className="script-workflows">
              <div className="section-title">
                <h2>Workflows</h2>
                <span>{filteredWorkflows.length} of {workflowConfigs.length}</span>
              </div>
              <div className="script-workflow-filters">
                <label className="input with-icon workflow-search">
                  <Search size={15} />
                  <input value={workflowSearch} onChange={(event) => setWorkflowSearch(event.target.value)} placeholder="Search workflows" />
                </label>
                <MultiSelectDropdown
                  values={workflowGroupFilters}
                  options={workflowGroupOptions}
                  label="All groups"
                  searchLabel="Search groups..."
                  summaryLabel="groups"
                  onChange={setWorkflowGroupFilters}
                />
                <MultiSelectDropdown
                  values={workflowPlatformFilters}
                  options={workflowPlatformOptions}
                  label="All platforms"
                  searchLabel="Search platforms..."
                  summaryLabel="platforms"
                  onChange={setWorkflowPlatformFilters}
                />
              </div>
              <div className="workflow-action-grid">
                <button className="primary compact workflow-action-add" onClick={addWorkflow} title="Add workflow">
                  <Plus size={14} />
                  Add
                </button>
                <button className="ghost compact workflow-action-copy" onClick={duplicateWorkflow} title="Duplicate workflow">
                  <Copy size={14} />
                  Copy
                </button>
                <button className="danger compact" onClick={deleteActiveWorkflow} disabled={workflowConfigs.length <= 1} title="Delete workflow">
                  <Trash2 size={14} />
                  Delete
                </button>
                <button className="ghost compact workflow-action-export" onClick={exportWorkflows} title="Export workflows as JSON">
                  <Download size={14} />
                  Export
                </button>
                <button className="ghost compact workflow-action-import" onClick={() => workflowImportRef.current?.click()} title="Import workflow JSON">
                  <Upload size={14} />
                  Import
                </button>
                <button className="ghost compact workflow-action-reset" onClick={resetWorkflows} title="Reset default workflows">
                  <RotateCcw size={14} />
                  Reset
                </button>
              </div>
              <div className="script-workflow-header">
                <span>ID</span>
                <span>Name</span>
                <span>Platform</span>
                <span>URL</span>
                <span>Actions</span>
              </div>
              <div className="script-workflow-list">
                {filteredWorkflows.map((workflow, index) => {
                  const displayPlatform = workflowDisplayPlatform(workflow);
                  const WorkflowIcon = workflowPlatformIconFor(displayPlatform);
                  const platformSvgUrl = workflowPlatformSvgUrl(displayPlatform);
                  return (
                    <div
                      className="script-workflow"
                      key={workflow.id}
                      role="button"
                      tabIndex={0}
                      onClick={(event) => {
                        selectScriptWorkflow(workflow.id, index, event);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setActiveWorkflow(workflow.id);
                          setSelectedWorkflowIds([workflow.id]);
                        }
                      }}
                    >
                      <button
                        type="button"
                        className="workflow-copy-id"
                        title={`Copy ${workflowDisplayId(workflow.id)}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          copyWorkflowId(workflow.id);
                        }}
                      >
                        {workflowDisplayId(workflow.id)}
                      </button>
                      <span className="workflow-row-name">{workflow.name}</span>
                      <span className="workflow-platform-cell">
                        <span className={`workflow-icon workflow-brand-icon ${workflowPlatformTone(displayPlatform)}`}>
                          {platformSvgUrl ? <img src={platformSvgUrl} alt="" /> : <WorkflowIcon size={15} />}
                        </span>
                        <span>{displayPlatform}</span>
                      </span>
                      <span className="workflow-row-url">{workflow.targetUrl || "-"}</span>
                      <span className="workflow-row-actions">
                        <button className="row-action-run" type="button" title="Run script from Profiles" onClick={(event) => { event.stopPropagation(); openProfilesForWorkflow(workflow.id); }}>
                          <Play size={13} />
                        </button>
                        <button className="row-action-export" type="button" title="Export workflow" onClick={(event) => { event.stopPropagation(); exportWorkflow(workflow); }}>
                          <Download size={13} />
                        </button>
                        <button className="row-action-import" type="button" title="Import into workflow" onClick={(event) => { event.stopPropagation(); startWorkflowImport(workflow.id); }}>
                          <Upload size={13} />
                        </button>
                        <button className="row-action-copy" type="button" title="Copy workflow" onClick={(event) => { event.stopPropagation(); copyWorkflow(workflow); }}>
                          <Copy size={13} />
                        </button>
                        <button className="row-action-reset" type="button" title="Reset workflow" disabled={!DEFAULT_WORKFLOWS.some((item) => item.id === workflow.id)} onClick={(event) => { event.stopPropagation(); resetWorkflow(workflow.id); }}>
                          <RotateCcw size={13} />
                        </button>
                      </span>
                    </div>
                  );
                })}
                {filteredWorkflows.length === 0 && <p className="muted">No workflows match the current filters.</p>}
              </div>
            </aside>

            <section className="script-main">
              <div className="script-header">
                <div>
                  <h2>{activeWorkflowConfig.name}</h2>
                  <p>{activeWorkflowConfig.description}</p>
                </div>
              </div>

              <div className="script-step-toolbar">
                {SCRIPT_STEP_KINDS.map((kind) => (
                  <button type="button" className="ghost compact" key={kind} onClick={() => addScriptStep(kind)}>
                    <Plus size={13} />
                    {kind}
                  </button>
                ))}
              </div>

              <div className="script-step-list">
                {activeWorkflowConfig.steps.map((step, index) => (
                  <button
                    type="button"
                    className={selectedScriptStep?.id === step.id ? "script-step active" : "script-step"}
                    key={step.id}
                    onClick={() => setSelectedScriptStepId(step.id)}
                  >
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <strong>{step.name}</strong>
                    <em>{step.enabled ? step.kind : "disabled"}</em>
                    <small>{step.selector || step.value || `${step.timeoutMs ?? 0}ms`}</small>
                  </button>
                ))}
                {activeWorkflowConfig.steps.length === 0 && <p className="muted">Add the first step to this workflow.</p>}
              </div>
            </section>

            <aside className="script-inspector">
              <div className="section-title">
                <h2>Step Inspector</h2>
                <span>{selectedScriptStep ? selectedScriptStep.kind : "none"}</span>
              </div>
              {selectedScriptStep ? (
                <>
                  <label>Step name</label>
                  <input value={selectedScriptStep.name} onChange={(event) => updateActiveScriptStep(selectedScriptStep.id, { name: event.target.value })} />
                  <label>Type</label>
                  <select
                    value={selectedScriptStep.kind}
                    onChange={(event) => updateActiveScriptStep(selectedScriptStep.id, { kind: event.target.value as ScriptStepKind })}
                  >
                    {SCRIPT_STEP_KINDS.map((kind) => (
                      <option key={kind} value={kind}>
                        {kind}
                      </option>
                    ))}
                  </select>
                  <label>Selector</label>
                  <input
                    value={selectedScriptStep.selector || ""}
                    onChange={(event) => updateActiveScriptStep(selectedScriptStep.id, { selector: event.target.value })}
                    placeholder="css=button[type=submit]"
                  />
                  <label>Value</label>
                  <input
                    value={selectedScriptStep.value || ""}
                    onChange={(event) => updateActiveScriptStep(selectedScriptStep.id, { value: event.target.value })}
                    placeholder="URL, text, pixels, or action id"
                  />
                  <label>Timeout ms</label>
                  <input
                    type="number"
                    min={0}
                    max={120000}
                    value={selectedScriptStep.timeoutMs ?? 0}
                    onChange={(event) => updateActiveScriptStep(selectedScriptStep.id, { timeoutMs: Number(event.target.value) })}
                  />
                  <label className="check-row script-enabled">
                    <input
                      type="checkbox"
                      checked={selectedScriptStep.enabled}
                      onChange={(event) => updateActiveScriptStep(selectedScriptStep.id, { enabled: event.target.checked })}
                    />
                    Enabled
                  </label>
                  <div className="script-inspector-save-row">
                    <button className={savePulse ? "primary inspector-save-button saved" : "primary inspector-save-button"} onClick={saveWorkflowChanges}>
                      {savePulse ? "Saved" : "Save"}
                    </button>
                  </div>
                  <div className="script-inspector-actions">
                    <button className="ghost compact step-tool-button" title="Undo" onClick={undoWorkflowChange} disabled={workflowUndoStack.length === 0}>
                      <Undo2 size={14} />
                    </button>
                    <button className="ghost compact step-tool-button" title="Forward" onClick={redoWorkflowChange} disabled={workflowRedoStack.length === 0}>
                      <Redo2 size={14} />
                    </button>
                    <button className="ghost compact step-tool-button" title="Move up" onClick={() => moveScriptStep(selectedScriptStep.id, -1)}>
                      <ArrowUp size={14} />
                    </button>
                    <button className="ghost compact step-tool-button" title="Move down" onClick={() => moveScriptStep(selectedScriptStep.id, 1)}>
                      <ArrowDown size={14} />
                    </button>
                    <button className="danger compact step-tool-button" title="Delete step" onClick={() => removeScriptStep(selectedScriptStep.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </>
              ) : (
                <p className="muted">Select a step to edit it.</p>
              )}
            </aside>
          </section>
        )}

        {view === "settings" && (
          <section className="settings-grid-page">
            <div className="settings-card">
              <div className="section-title">
                <h2>Connection</h2>
                <span>{apiStatus}</span>
              </div>
              <label>GPM API Base URL</label>
              <div className="setting-row">
                <input value={baseUrl} onChange={(event) => setBaseUrl(event.target.value)} />
                <button className="primary" onClick={saveSettings}>
                  Save & Test
                </button>
              </div>
              <p className="muted">Default local API: http://127.0.0.1:19995.</p>
            </div>

            <div className="settings-card">
              <div className="section-title">
                <h2>Appearance</h2>
                <span>{theme}</span>
              </div>
              <div className="theme-toggle-group">
                <button className={theme === "dark" ? "theme-choice active" : "theme-choice"} onClick={() => setThemeMode("dark")}>
                  Dark
                </button>
                <button className={theme === "light" ? "theme-choice active" : "theme-choice"} onClick={() => setThemeMode("light")}>
                  Light
                </button>
              </div>
            </div>

            <div className="settings-card">
              <div className="section-title">
                <h2>Workflow Data</h2>
                <span>{workflowConfigs.length} workflows</span>
              </div>
              <div className="settings-actions">
                <button className="ghost compact" onClick={exportWorkflows}>
                  <Download size={14} />
                  Export JSON
                </button>
                <button className="ghost compact" onClick={() => workflowImportRef.current?.click()}>
                  <Upload size={14} />
                  Import JSON
                </button>
                <button className="danger compact" onClick={resetWorkflows}>
                  <RotateCcw size={14} />
                  Reset defaults
                </button>
              </div>
            </div>
          </section>
        )}

        {showCreate && (
          <div className="modal-backdrop" onMouseDown={() => setShowCreate(false)}>
            <div className="modal" onMouseDown={(event) => event.stopPropagation()}>
              <header>
                <h2>New Profile</h2>
                <button className="icon-only" onClick={() => setShowCreate(false)}>
                  <X size={18} />
                </button>
              </header>
              <label>Profile name</label>
              <input value={newName} onChange={(event) => setNewName(event.target.value)} placeholder="acc_001" autoFocus />
              <label>Group</label>
              <select value={newProfileGroupId} onChange={(event) => setNewProfileGroupId(event.target.value)}>
                <option value="">Default</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {groupName(group)}
                  </option>
                ))}
              </select>
              <footer>
                <button className="ghost" onClick={() => setShowCreate(false)}>
                  Cancel
                </button>
                <button className="primary" onClick={createNewProfile} disabled={!newName.trim() || busy}>
                  <Plus size={16} />
                  Create
                </button>
              </footer>
            </div>
          </div>
        )}

        {showWorkflowSettings && (
          <div className="modal-backdrop" onMouseDown={() => setShowWorkflowSettings(false)}>
            <div className="modal workflow-modal" onMouseDown={(event) => event.stopPropagation()}>
              <header>
                <div>
                  <h2>Workflow Settings</h2>
                  <p className="muted">{workflowName} preset</p>
                </div>
                <button className="icon-only" onClick={() => setShowWorkflowSettings(false)}>
                  <X size={18} />
                </button>
              </header>
              <label>Preset name</label>
              <input value={activeWorkflowConfig.name} onChange={(event) => updateActiveWorkflowConfig({ name: event.target.value })} />
              <label>Description</label>
              <input value={activeWorkflowConfig.description} onChange={(event) => updateActiveWorkflowConfig({ description: event.target.value })} />
              <label>Icon</label>
              <select
                value={activeWorkflowConfig.icon}
                onChange={(event) => updateActiveWorkflowConfig({ icon: event.target.value as WorkflowIconKey })}
              >
                <option value="play">Play</option>
                <option value="globe">Globe</option>
                <option value="camera">Camera</option>
                <option value="shield">Shield</option>
                <option value="education">Education</option>
                <option value="layers">Layers</option>
              </select>
              <div className="settings-grid two-col">
                <label>
                  Group
                  <select
                    value={activeWorkflowConfig.group}
                    onChange={(event) => updateActiveWorkflowConfig({ group: event.target.value as WorkflowGroup })}
                  >
                    <option value="Core">Core</option>
                    <option value="Account Check">Account Check</option>
                    <option value="Appeal">Appeal</option>
                  </select>
                </label>
                <label>
                  Platform
                  <select
                    value={activeWorkflowConfig.platform}
                    onChange={(event) => updateActiveWorkflowConfig({ platform: event.target.value as WorkflowPlatform })}
                  >
                    <option value="Generic">Generic</option>
                    <option value="GitHub">GitHub</option>
                    <option value="Google">Google</option>
                    <option value="Google Forms">Google Forms</option>
                  </select>
                </label>
              </div>
              <label>Automation action</label>
              <select
                value={activeWorkflowConfig.action}
                onChange={(event) => updateActiveWorkflowConfig({ action: event.target.value as WorkflowAction })}
              >
                <option value="open-url">Open URL</option>
                <option value="google-form-ag-appeal">Google Form AG Appeal</option>
              </select>
              <label>Target URL</label>
              <input
                value={activeWorkflowConfig.targetUrl}
                onChange={(event) => updateActiveWorkflowConfig({ targetUrl: event.target.value })}
                placeholder="https://example.com"
                autoFocus
              />
              <div className="settings-grid">
                <label className="check-row">
                  <input
                    type="checkbox"
                    checked={activeWorkflowConfig.takeScreenshot}
                    onChange={(event) => updateActiveWorkflowConfig({ takeScreenshot: event.target.checked })}
                  />
                  Screenshot
                </label>
                <label className="check-row">
                  <input
                    type="checkbox"
                    checked={activeWorkflowConfig.closeWhenDone}
                    onChange={(event) => updateActiveWorkflowConfig({ closeWhenDone: event.target.checked })}
                  />
                  Close when done
                </label>
                <label className="check-row">
                  <input
                    type="checkbox"
                    checked={activeWorkflowConfig.inspectMode}
                    onChange={(event) => updateActiveWorkflowConfig({ inspectMode: event.target.checked })}
                  />
                  Inspect mode
                </label>
              </div>
              <label>Concurrency</label>
              <input
                type="number"
                min={1}
                max={10}
                value={activeWorkflowConfig.concurrency}
                onChange={(event) => updateActiveWorkflowConfig({ concurrency: Number(event.target.value) })}
              />
              <footer>
                <button className="primary" onClick={() => setShowWorkflowSettings(false)}>
                  Save settings
                </button>
              </footer>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
