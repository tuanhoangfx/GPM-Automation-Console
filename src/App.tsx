import {
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  BookOpen,
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
  Hash,
  History,
  Image,
  Info,
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
  Type,
  Trash2,
  Undo2,
  Upload,
  X,
  XCircle
} from "lucide-react";
import {
  type MouseEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from "react";
import releaseLogMarkdown from "../RELEASE.md?raw";
import brandMarkIcon from "./assets/azure-defender-distributer-control-system.svg";
import {
  checkHealth,
  closeProfile,
  createProfile,
  deleteProfile,
  getGroups,
  getProfiles,
  getStoredBaseUrl,
  setStoredBaseUrl,
  startProfile
} from "./api";
import { useProfiles, type ProfileSortDirection } from "./features/profiles/useProfiles";
import { profileId, profileName, syncProfileRowState } from "./features/profiles/profile-utils";
import { parseVersionLogEntries, type ParsedVersionLogEntry } from "./features/release-log/parseVersionLogEntries";
import { executeWorkflowAction, type WorkflowExecutorAction } from "./features/workflows/workflow-executors";
import { useWorkflows } from "./features/workflows/useWorkflows";
import { GPM_CONSOLE_THEME_KEY, readStoredThemeMode, syncDocumentTheme } from "./theme";
import type { GpmGroup, GpmProfile, ProfileRow, RunLog, ScriptStep, ScriptStepKind } from "./types";
import { PortaledThemeSurface } from "./ui/PortaledThemeSurface";

type View = "profiles" | "scripts" | "settings";
type Theme = "dark" | "light";
type WorkflowId = string;
type WorkflowIconKey = "play" | "globe" | "camera" | "shield" | "education" | "layers";
type WorkflowAction = WorkflowExecutorAction;
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
  tone?: "neutral" | "all" | "group" | "platform" | "status" | "ready" | "opening" | "running" | "failed";
  dotTone?: "blue" | "teal" | "violet" | "amber" | "rose" | "cyan" | "lime" | "indigo" | "orange" | "pink" | "emerald" | "sky";
};

const WORKFLOWS_KEY = "gpm-console-workflows";
const ACTIVE_WORKFLOW_KEY = "gpm-console-active-workflow";
const PAGE_SIZE_OPTIONS = [100, 500, 1000, 5000];
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
    id: "screen-resolution-real",
    name: "Set Screen Resolution Real",
    description: "Update profile hardware setting so screen resolution is Real.",
    icon: "shield",
    group: "Core",
    platform: "GPM",
    action: "set-screen-resolution-real",
    targetUrl: "",
    takeScreenshot: false,
    closeWhenDone: false,
    inspectMode: false,
    concurrency: 5,
    steps: [createStep("action", { name: "Set screen resolution Real", value: "set-screen-resolution-real", timeoutMs: 15000 })]
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
const TOOL_GUIDE_SECTIONS = [
  {
    icon: Database,
    title: "Profiles",
    items: [
      "Load all GPM Login profiles across API pages, then search, filter, create, delete, open, and close profiles.",
      "Click selects one row, Ctrl/Cmd + click toggles rows, Shift + click selects a range.",
      "Use Select visible for the current page or Ctrl/Cmd + A to select all filtered profiles."
    ]
  },
  {
    icon: Play,
    title: "Automation Runtime",
    items: [
      "Choose one or more workflows, select profiles, then run the queue with configurable concurrency.",
      "Each run opens the GPM profile, connects through CDP, executes workflow steps, and writes logs.",
      "Run History stores status, duration, screenshot path, and failure reason for each profile run."
    ]
  },
  {
    icon: ClipboardList,
    title: "Scripts",
    items: [
      "Create, duplicate, import, export, reset, and edit workflow presets.",
      "Workflow steps support Navigate, Wait, Click, Type, Delay, Scroll, Screenshot, Condition, and Special Action.",
      "Click Save in Step Inspector after editing workflow steps or settings before relying on persisted presets."
    ]
  },
  {
    icon: Settings,
    title: "Settings",
    items: [
      "Set the local GPM API base URL and test the connection.",
      "Switch between dark and light theme.",
      "Export, import, or reset workflow data."
    ]
  }
] as const;
type VersionLogEntry = {
  icon: typeof RefreshCw;
} & ParsedVersionLogEntry;

const VERSION_LOG_ICONS = [RefreshCw, CheckCircle2, Download] as const;
const VERSION_LOG_ENTRIES: VersionLogEntry[] = parseVersionLogEntries(releaseLogMarkdown).map((entry, index) => {
  return {
    ...entry,
    icon: VERSION_LOG_ICONS[index % VERSION_LOG_ICONS.length]
  };
});

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

function sameWorkflowUrl(left?: string, right?: string) {
  const first = String(left || "").trim();
  const second = String(right || "").trim();
  if (!first || !second) return first === second;
  return first === second || normalizeUrl(first) === normalizeUrl(second);
}

function syncFirstNavigateStep(steps: ScriptStep[], previousTargetUrl: string, nextTargetUrl: string) {
  let synced = false;
  return steps.map((step) => {
    if (synced || step.kind !== "navigate") return step;
    synced = true;

    const value = String(step.value || "").trim();
    if (value && value !== "{{targetUrl}}" && !sameWorkflowUrl(value, previousTargetUrl)) return step;
    return { ...step, value: nextTargetUrl };
  });
}

function workflowStepsForRun(workflow: WorkflowConfig, targetUrl: string) {
  const defaultWorkflow = DEFAULT_WORKFLOWS.find((item) => item.id === workflow.id);
  let synced = false;

  return workflow.steps.map((step) => {
    if (synced || step.kind !== "navigate") return step;
    synced = true;

    const value = String(step.value || "").trim();
    if (!value || value === "{{targetUrl}}" || sameWorkflowUrl(value, workflow.targetUrl) || sameWorkflowUrl(value, defaultWorkflow?.targetUrl)) {
      return { ...step, value: targetUrl };
    }

    return step;
  });
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

function StatusMarker({ status }: { status: ProfileRow["status"] }) {
  if (status === "closed") return <CheckCircle2 size={13} />;
  if (status === "opening") return <RefreshCw size={13} />;
  if (status === "running") return <Play size={13} />;
  return <XCircle size={13} />;
}

function ProfileSortIndicator({ active, direction }: { active: boolean; direction: ProfileSortDirection }) {
  if (!active) return <ArrowUpDown size={12} className="sort-icon muted" aria-hidden />;
  return direction === "asc" ? (
    <ArrowUp size={12} className="sort-icon active" aria-hidden />
  ) : (
    <ArrowDown size={12} className="sort-icon active" aria-hidden />
  );
}

function profileColumnSortTitle(label: string, active: boolean, direction: ProfileSortDirection) {
  if (!active) return `${label}: sort A-Z (default)`;
  return direction === "asc" ? `${label}: A-Z (click for Z-A)` : `${label}: Z-A (click for A-Z)`;
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

function toneFromSeed(seed: string): NonNullable<DropdownOption["dotTone"]> {
  const palette: NonNullable<DropdownOption["dotTone"]>[] = [
    "blue",
    "teal",
    "violet",
    "amber",
    "rose",
    "cyan",
    "lime",
    "indigo",
    "orange",
    "pink",
    "emerald",
    "sky"
  ];
  const hash = String(seed)
    .split("")
    .reduce((total, char) => total + char.charCodeAt(0), 0);
  return palette[Math.abs(hash) % palette.length];
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
  defaultTone = "all",
  onChange
}: {
  values: string[];
  options: DropdownOption[];
  label: string;
  searchLabel: string;
  summaryLabel?: string;
  defaultTone?: DropdownOption["tone"];
  onChange: (values: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selectedSet = useMemo(() => new Set(values), [values]);
  const filteredOptions = options.filter((option) => option.label.toLowerCase().includes(search.trim().toLowerCase()));
  const selectedLabels = options.filter((option) => selectedSet.has(option.value)).map((option) => option.label);
  const displayLabel =
    selectedLabels.length === 0 ? label : selectedLabels.length === 1 ? selectedLabels[0] : `${selectedLabels.length} ${summaryLabel || "selected"}`;
  const selectedOption = options.find((option) => selectedSet.has(option.value));
  /** Text uses semantic tones only after a selection; placeholder label stays default (like column headings). Icon still uses category tone when idle. */
  const labelTone = selectedSet.size === 1 ? selectedOption?.tone : undefined;
  const markerTone = selectedSet.size === 0 ? defaultTone : selectedSet.size === 1 ? selectedOption?.tone : undefined;

  function DropdownOptionMarker({ tone, dotTone }: { tone?: DropdownOption["tone"]; dotTone?: DropdownOption["dotTone"] }) {
    if (dotTone) return <span className={`dropdown-option-dot ${dotTone}`} />;
    if (!tone || tone === "neutral") return null;
    if (tone === "all") return <Globe2 size={13} className={`dropdown-option-icon ${tone}`} />;
    if (tone === "group") return <Layers3 size={13} className={`dropdown-option-icon ${tone}`} />;
    if (tone === "platform") return <Globe2 size={13} className={`dropdown-option-icon ${tone}`} />;
    if (tone === "status") return <CheckCircle2 size={13} className={`dropdown-option-icon ${tone}`} />;
    if (tone === "ready") return <CheckCircle2 size={13} className={`dropdown-option-icon ${tone}`} />;
    if (tone === "opening") return <RefreshCw size={13} className={`dropdown-option-icon ${tone}`} />;
    if (tone === "running") return <Play size={13} className={`dropdown-option-icon ${tone}`} />;
    if (tone === "failed") return <XCircle size={13} className={`dropdown-option-icon ${tone}`} />;
    return null;
  }

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
        <span className={labelTone ? `dropdown-trigger-label ${labelTone}` : "dropdown-trigger-label"}>
          <DropdownOptionMarker tone={markerTone} dotTone={selectedSet.size === 1 ? selectedOption?.dotTone : undefined} />
          {displayLabel}
        </span>
        <ChevronDown size={15} className="dropdown-chevron" />
      </button>
      {open && (
        <div className="smart-dropdown-menu">
          <label className="smart-dropdown-search">
            <Search size={15} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={searchLabel} autoFocus />
          </label>
          <div className="smart-dropdown-options">
            <button type="button" className={values.length === 0 ? "smart-dropdown-option active" : "smart-dropdown-option"} onMouseDown={(event) => event.preventDefault()} onClick={() => onChange([])}>
              <span className="dropdown-checkbox">{values.length === 0 ? <Check size={10} /> : null}</span>
              <span className="dropdown-option-label">
                <DropdownOptionMarker tone="all" />
                All
              </span>
            </button>
            {filteredOptions.map((option) => (
              <button
                type="button"
                className={selectedSet.has(option.value) ? "smart-dropdown-option active" : "smart-dropdown-option"}
                key={option.value}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => toggleValue(option.value)}
              >
                <span className="dropdown-checkbox">{selectedSet.has(option.value) ? <Check size={10} /> : null}</span>
                <span className={option.tone ? `dropdown-option-label ${option.tone}` : "dropdown-option-label"}>
                  <DropdownOptionMarker tone={option.tone} dotTone={option.dotTone} />
                  {option.label}
                </span>
              </button>
            ))}
            {filteredOptions.length === 0 && <span className="dropdown-empty">No matches</span>}
          </div>
        </div>
      )}
    </div>
  );
}

function StandardTableHeader({
  title,
  summary,
  stats,
  filters,
  actions,
  topClassName = "",
  statsClassName = "",
  filtersClassName = "",
  actionsClassName = ""
}: {
  title: string;
  summary: string;
  stats: ReactNode;
  filters: ReactNode;
  actions: ReactNode;
  topClassName?: string;
  statsClassName?: string;
  filtersClassName?: string;
  actionsClassName?: string;
}) {
  return (
    <>
      <div className={`table-header-top ${topClassName}`.trim()}>
        <h2>{title}</h2>
        <span>{summary}</span>
      </div>
      <div className={`table-header-stats ${statsClassName}`.trim()}>{stats}</div>
      <div className={`table-header-filters ${filtersClassName}`.trim()}>{filters}</div>
      <div className={`table-header-actions ${actionsClassName}`.trim()}>{actions}</div>
    </>
  );
}

export function App() {
  const [view, setView] = useState<View>("profiles");
  const [theme, setTheme] = useState<Theme>(() => readStoredThemeMode());
  const [baseUrl, setBaseUrl] = useState(getStoredBaseUrl);
  const [apiStatus, setApiStatus] = useState<"checking" | "connected" | "offline">("checking");
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [groups, setGroups] = useState<GpmGroup[]>([]);
  const [selected, setSelected] = useState<Set<string | number>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const [newProfileGroupId, setNewProfileGroupId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [logs, setLogs] = useState<RunLog[]>([]);
  const [history, setHistory] = useState<RunHistoryItem[]>([]);
  const [newName, setNewName] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showToolGuide, setShowToolGuide] = useState(false);
  const [showVersionLog, setShowVersionLog] = useState(false);
  const [showWorkflowSettings, setShowWorkflowSettings] = useState(false);
  const [savedWorkflowConfigs, setSavedWorkflowConfigs] = useState<WorkflowConfig[]>(readStoredWorkflows);
  const [draftWorkflowConfigs, setDraftWorkflowConfigs] = useState<WorkflowConfig[]>(savedWorkflowConfigs);
  const [activeWorkflow, setActiveWorkflow] = useState<WorkflowId>(readStoredActiveWorkflow);
  const [selectedWorkflowIds, setSelectedWorkflowIds] = useState<WorkflowId[]>([readStoredActiveWorkflow()]);
  const [savePulse, setSavePulse] = useState(false);
  const [selectedScriptStepId, setSelectedScriptStepId] = useState<string>("");
  const [automationRunning, setAutomationRunning] = useState(false);
  const [historyHoverId, setHistoryHoverId] = useState<string | null>(null);
  const [historyPopoverCoords, setHistoryPopoverCoords] = useState({ top: 0, left: 0 });
  const historyAnchorRef = useRef<HTMLElement | null>(null);
  const historyPopoverPanelRef = useRef<HTMLDivElement | null>(null);
  const historyHoverHideTimerRef = useRef<number | null>(null);
  const [pendingWorkflowImportId, setPendingWorkflowImportId] = useState<string>("");
  const [workflowUndoStack, setWorkflowUndoStack] = useState<WorkflowConfig[][]>([]);
  const [workflowRedoStack, setWorkflowRedoStack] = useState<WorkflowConfig[][]>([]);
  const workflowImportRef = useRef<HTMLInputElement>(null);
  const singleWorkflowImportRef = useRef<HTMLInputElement>(null);

  const clearHistoryHoverTimer = useCallback(() => {
    const t = historyHoverHideTimerRef.current;
    if (t !== null) {
      window.clearTimeout(t);
      historyHoverHideTimerRef.current = null;
    }
  }, []);

  const updateHistoryPopoverPosition = useCallback(() => {
    const anchor = historyAnchorRef.current;
    const panel = historyPopoverPanelRef.current;
    if (!anchor || !panel || !historyHoverId) return;

    const margin = 12;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const r = anchor.getBoundingClientRect();

    const pr = panel.getBoundingClientRect();
    const pw = pr.width || panel.offsetWidth || 280;
    const ph = pr.height || panel.offsetHeight || 160;

    // Prefer RIGHT of dot, vertically centered on the anchor (stable next to sidebar).
    let left = r.right + margin;
    let top = r.top + r.height / 2 - ph / 2;

    if (left + pw > vw - margin) {
      left = r.left - pw - margin;
    }
    if (left < margin) {
      left = margin;
    }
    if (left + pw > vw - margin) {
      left = Math.max(margin, vw - margin - pw);
    }

    if (top + ph > vh - margin) {
      top = vh - margin - ph;
    }
    if (top < margin) {
      top = margin;
    }

    setHistoryPopoverCoords({ top, left });
  }, [historyHoverId]);

  useLayoutEffect(() => {
    if (!historyHoverId) return;
    updateHistoryPopoverPosition();
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      updateHistoryPopoverPosition();
      raf2 = requestAnimationFrame(() => updateHistoryPopoverPosition());
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [historyHoverId, history, updateHistoryPopoverPosition]);

  useEffect(() => {
    if (!historyHoverId) return;
    const sync = () => updateHistoryPopoverPosition();
    window.addEventListener("scroll", sync, true);
    window.addEventListener("resize", sync);
    return () => {
      window.removeEventListener("scroll", sync, true);
      window.removeEventListener("resize", sync);
    };
  }, [historyHoverId, updateHistoryPopoverPosition]);

  useEffect(() => () => clearHistoryHoverTimer(), [clearHistoryHoverTimer]);

  const openHistoryPopover = useCallback(
    (id: string, anchor: HTMLElement) => {
      clearHistoryHoverTimer();
      historyAnchorRef.current = anchor;
      setHistoryHoverId(id);
    },
    [clearHistoryHoverTimer]
  );

  const scheduleCloseHistoryPopover = useCallback(() => {
    clearHistoryHoverTimer();
    const handle = window.setTimeout(() => {
      setHistoryHoverId(null);
      historyAnchorRef.current = null;
      historyHoverHideTimerRef.current = null;
    }, 140);
    historyHoverHideTimerRef.current = handle;
  }, [clearHistoryHoverTimer]);

  const {
    search,
    setSearch,
    selectedGroupIds,
    setSelectedGroupIds,
    selectedStatuses,
    setSelectedStatuses,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    sortColumn,
    sortDirection,
    toggleProfileSort,
    selectedProfiles,
    filteredProfiles,
    totalPages,
    pageStart,
    pagedProfiles,
    profileCounts
  } = useProfiles(profiles, selected);
  const workflowConfigs = draftWorkflowConfigs;
  const activeWorkflowConfig = workflowConfigs.find((workflow) => workflow.id === activeWorkflow) || workflowConfigs[0];
  const ActiveWorkflowIcon = workflowIconFor(activeWorkflowConfig.icon);
  const workflowName = activeWorkflowConfig.name;
  const {
    workflowSearch,
    setWorkflowSearch,
    workflowGroupFilters,
    setWorkflowGroupFilters,
    workflowPlatformFilters,
    setWorkflowPlatformFilters,
    selectedWorkflowConfigs,
    workflowGroupOptions,
    workflowPlatformOptions,
    filteredWorkflows,
    pagedFilteredWorkflows,
    workflowTablePage,
    setWorkflowTablePage,
    workflowTablePageSize,
    setWorkflowTablePageSize,
    workflowTableTotalPages,
    workflowTablePageStart,
    workflowTablePageEnd,
    selectedWorkflowCount,
    visibleWorkflowSteps
  } = useWorkflows(workflowConfigs, selectedWorkflowIds, workflowDisplayId, workflowDisplayPlatform);
  const workflowGroupDropdownOptions = useMemo(
    () => workflowGroupOptions.map((option) => ({ ...option, tone: "group" as const, dotTone: toneFromSeed(`group:${option.value}`) })),
    [workflowGroupOptions]
  );
  const workflowPlatformDropdownOptions = useMemo(
    () =>
      workflowPlatformOptions.map((option) => ({ ...option, tone: "platform" as const, dotTone: toneFromSeed(`platform:${option.value}`) })),
    [workflowPlatformOptions]
  );
  const runWorkflowConfigs = selectedWorkflowConfigs.length > 0 ? selectedWorkflowConfigs : [activeWorkflowConfig];
  const runWorkflowLabel = runWorkflowConfigs.length === 1 ? runWorkflowConfigs[0].name : `${runWorkflowConfigs.length} workflows`;
  const selectedScriptStep = activeWorkflowConfig.steps.find((step) => step.id === selectedScriptStepId) || activeWorkflowConfig.steps[0];
  const profileGroupOptions = useMemo(
    () =>
      groups.map((group) => ({
        value: String(group.id),
        label: groupName(group),
        tone: "group" as const,
        dotTone: toneFromSeed(`profile-group:${group.id}`)
      })),
    [groups]
  );
  const profileStatusOptions = useMemo(
    () => [
      { value: "closed", label: "Ready", tone: "ready" as const },
      { value: "opening", label: "Opening", tone: "opening" as const },
      { value: "running", label: "Running", tone: "running" as const },
      { value: "failed", label: "Failed", tone: "failed" as const }
    ],
    []
  );
  useEffect(() => {
    setCurrentPage(1);
    setLastSelectedIndex(null);
  }, [pageSize, search, selectedGroupIds, selectedStatuses]);

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
      if (event.key === "Escape") {
        clearHistoryHoverTimer();
        setHistoryHoverId(null);
        historyAnchorRef.current = null;
      }
    }

    window.addEventListener("keydown", closeHistoryPopover);
    return () => window.removeEventListener("keydown", closeHistoryPopover);
  }, [clearHistoryHoverTimer]);

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

  function applyProfilesPayload(
    health: Awaited<ReturnType<typeof checkHealth>>,
    nextGroups: GpmGroup[],
    nextProfiles: GpmProfile[]
  ) {
    setApiStatus(health.ok === false ? "offline" : "connected");
    setGroups(nextGroups);
    setProfiles((current) => {
      const currentMap = new Map(
        current.map((item) => [
          profileId(item),
          { status: item.status, lastMessage: item.lastMessage } as Pick<ProfileRow, "status" | "lastMessage">
        ])
      );
      return nextProfiles.map((profile) => {
        const id = profileId(profile);
        const previous = currentMap.get(id);
        const merged = syncProfileRowState(profile, previous);
        return {
          ...profile,
          status: merged.status,
          lastMessage: merged.lastMessage
        };
      });
    });
  }

  const syncProfilesFromApi = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent === true;
    if (!silent) {
      setBusy(true);
      setError("");
    }
    try {
      const [health, nextGroups, nextProfiles] = await Promise.all([
        checkHealth(baseUrl),
        getGroups(baseUrl),
        getProfiles(baseUrl, {})
      ]);
      applyProfilesPayload(health, nextGroups, nextProfiles);
    } catch (refreshError) {
      setApiStatus("offline");
      if (!silent) {
        setError(refreshError instanceof Error ? refreshError.message : "Unable to load GPM data.");
      }
    } finally {
      if (!silent) setBusy(false);
    }
  }, [baseUrl]);

  async function refreshAll() {
    await syncProfilesFromApi({ silent: false });
  }

  useEffect(() => {
    refreshAll();
  }, []);

  const profileStatusPoll = useMemo(
    () => profiles.some((p) => p.status === "running" || p.status === "opening"),
    [profiles]
  );

  useEffect(() => {
    if (apiStatus !== "connected" || !profileStatusPoll) return;
    const tick = () => {
      void syncProfilesFromApi({ silent: true });
    };
    const handle = window.setInterval(tick, 5000);
    return () => window.clearInterval(handle);
  }, [apiStatus, profileStatusPoll, syncProfilesFromApi]);

  function setThemeMode(next: Theme) {
    localStorage.setItem(GPM_CONSOLE_THEME_KEY, next);
    setTheme(next);
  }

  useEffect(() => {
    syncDocumentTheme(theme);
  }, [theme]);

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

  function updateActiveWorkflowConfig(patch: Partial<WorkflowConfig>) {
    setDraftWorkflowConfigs((items) =>
      items.map((workflow) => {
        if (workflow.id !== activeWorkflow) return workflow;
        const nextTargetUrl = patch.targetUrl ?? workflow.targetUrl;
        return {
          ...workflow,
          ...patch,
          concurrency: patch.concurrency === undefined ? workflow.concurrency : clampConcurrency(Number(patch.concurrency)),
          steps: patch.targetUrl === undefined ? workflow.steps : syncFirstNavigateStep(workflow.steps, workflow.targetUrl, nextTargetUrl)
        };
      })
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

  function selectScriptWorkflow(workflowId: WorkflowId) {
    setActiveWorkflow(workflowId);
    setSelectedWorkflowIds([workflowId]);
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
    } finally {
      window.setTimeout(() => void syncProfilesFromApi({ silent: true }), 400);
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
    } finally {
      window.setTimeout(() => void syncProfilesFromApi({ silent: true }), 400);
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

  async function runProfileAutomation(profile: ProfileRow, workflow: WorkflowConfig, url?: string) {
    const id = profileId(profile);
    const startedAt = Date.now();
    const historyId = crypto.randomUUID();
    const historyTarget = url || `action:${workflow.action}`;
    updateProfileStatus(id, "opening", "Opening profile and connecting CDP");
    addLog("info", profileName(profile), `${workflow.name} started${url ? `: ${url}` : ""}`);
    addHistory({
      id: historyId,
      profileName: profileName(profile),
      workflowName: workflow.name,
      targetUrl: historyTarget,
      status: "running",
      startedAt,
      durationMs: 0,
      finishedAt: "Running"
    });

    try {
      const result = await executeWorkflowAction({
        action: workflow.action,
        baseUrl,
        profile,
        targetUrl: url,
        takeScreenshot: workflow.takeScreenshot,
        closeWhenDone: workflow.closeWhenDone,
        inspectMode: workflow.inspectMode,
        steps: workflowStepsForRun(workflow, url || "")
      });
      result.logs.forEach((log) => addLog(log.level, profileName(profile), log.message));

      if (result.ok) {
        updateProfileStatus(id, result.status, result.message);
        updateHistory(historyId, {
          status: "success",
          durationMs: Date.now() - startedAt,
          finishedAt: now(),
          screenshotPath: result.screenshotPath
        });
      } else {
        updateProfileStatus(id, "failed", result.error || result.message || "Automation failed");
        updateHistory(historyId, {
          status: "failed",
          durationMs: Date.now() - startedAt,
          finishedAt: now(),
          error: result.error || result.message || "Automation failed"
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
    } finally {
      window.setTimeout(() => void syncProfilesFromApi({ silent: true }), 800);
    }
  }

  async function runAutomationQueue() {
    if (selectedProfiles.length === 0 || runWorkflowConfigs.length === 0) return;

    setAutomationRunning(true);
    setError("");

    try {
      for (const workflow of runWorkflowConfigs) {
        const requiresUrl = workflow.action !== "set-screen-resolution-real";
        const url = requiresUrl ? normalizeUrl(workflow.targetUrl) : undefined;
        if (requiresUrl) {
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

  const totalProfiles = profileCounts.total;
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
    <div className="shell">
      <aside className="sidebar">
        <div className="brand-mark">
          <img src={brandMarkIcon} alt="GPM brand mark" className="brand-mark-icon" />
        </div>
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
            <button className="ghost slim-button" onClick={() => setShowToolGuide(true)} title="Tool functions and usage guide">
              <BookOpen size={16} />
              Guide
            </button>
            <button className="ghost slim-button" onClick={() => setShowVersionLog(true)} title="Release update log">
              <History size={16} />
              Release Log
            </button>
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
          <section className="layout profile-layout">
            <div className="left-pane card profile-queue-frame">
              <StandardTableHeader
                title="Profile"
                summary={`${filteredProfiles.length} of ${totalProfiles}`}
                statsClassName="metrics"
                filtersClassName="profile-filters"
                actionsClassName="profile-table-header-actions"
                stats={
                  <>
                    <div className="metric-card">
                      <span className="metric-icon metric-ready">
                        <Database size={12} />
                      </span>
                      <div className="metric-content">
                        <span className="metric-label">Total Profiles</span>
                        <strong className="metric-value">{totalProfiles}</strong>
                      </div>
                    </div>
                    <div className="metric-card">
                      <span className="metric-icon metric-ready">
                        <CheckCircle2 size={12} />
                      </span>
                      <div className="metric-content">
                        <span className="metric-label">Ready</span>
                        <strong className="metric-value">{profileCounts.ready}</strong>
                      </div>
                    </div>
                    <div className="metric-card">
                      <span className="metric-icon metric-running">
                        <RefreshCw size={12} />
                      </span>
                      <div className="metric-content">
                        <span className="metric-label">Running</span>
                        <strong className="metric-value">{profileCounts.running}</strong>
                      </div>
                    </div>
                    <div className="metric-card">
                      <span className="metric-icon metric-applied">
                        <CircleAlert size={12} />
                      </span>
                      <div className="metric-content">
                        <span className="metric-label">Failed</span>
                        <strong className="metric-value">{profileCounts.failed}</strong>
                      </div>
                    </div>
                  </>
                }
                filters={
                  <>
                    <label className="input with-icon">
                      <Search size={15} />
                      <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search profiles" />
                    </label>
                    <MultiSelectDropdown
                      values={selectedGroupIds}
                      options={profileGroupOptions}
                      label="Group"
                      searchLabel="Search groups..."
                      summaryLabel="groups"
                      defaultTone="group"
                      onChange={setSelectedGroupIds}
                    />
                    <MultiSelectDropdown
                      values={selectedStatuses}
                      options={profileStatusOptions}
                      label="Status"
                      searchLabel="Search statuses..."
                      summaryLabel="statuses"
                      defaultTone="status"
                      onChange={(values) => setSelectedStatuses(values as ProfileRow["status"][])}
                    />
                  </>
                }
                actions={
                  <>
                    <div className="toolbar profile-table-header-buttons">
                      <button className="ghost compact profile-header-btn-run" onClick={() => selectedProfiles.forEach(openOne)} disabled={!selectedProfiles.length} title="Open selected">
                        <Play size={14} />
                        Run
                      </button>
                      <button className="ghost compact profile-header-btn-close" onClick={() => selectedProfiles.forEach(closeOne)} disabled={!selectedProfiles.length} title="Close selected">
                        <Square size={12} />
                        Close
                      </button>
                      <button className="ghost compact profile-header-btn-new" onClick={() => setShowCreate(true)}>
                        <Plus size={14} />
                        New
                      </button>
                      <button className="ghost compact profile-header-btn-delete" onClick={deleteSelected} disabled={!selectedProfiles.length || busy}>
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                    <div className="selection-summary profile-table-header-summary">
                      <button className="icon-only" onClick={clearSelection} title="Clear selection">
                        <X size={16} />
                      </button>
                      <span>{selectedProfiles.length} selected</span>
                      <button className="ghost compact" onClick={selectVisibleRows}>
                        Select visible
                      </button>
                    </div>
                  </>
                }
              />
              <div className="job-list table-panel native-table row-select-table">
                <div className="table-head-wrap">
                  <table className="queue-table profile-table profile-table-head" aria-hidden="true">
                    <thead>
                      <tr>
                        <th aria-sort={sortColumn === "profile" ? (sortDirection === "asc" ? "ascending" : "descending") : undefined}>
                          <button
                            type="button"
                            className="table-sort-head table-col-head table-col-profile"
                            onClick={() => toggleProfileSort("profile")}
                            title={profileColumnSortTitle("Profile", sortColumn === "profile", sortDirection)}
                          >
                            <Database size={13} />
                            Profile
                            <ProfileSortIndicator active={sortColumn === "profile"} direction={sortDirection} />
                          </button>
                        </th>
                        <th aria-sort={sortColumn === "group" ? (sortDirection === "asc" ? "ascending" : "descending") : undefined}>
                          <button
                            type="button"
                            className="table-sort-head table-col-head table-col-group"
                            onClick={() => toggleProfileSort("group")}
                            title={profileColumnSortTitle("Group", sortColumn === "group", sortDirection)}
                          >
                            <Layers3 size={13} />
                            Group
                            <ProfileSortIndicator active={sortColumn === "group"} direction={sortDirection} />
                          </button>
                        </th>
                        <th aria-sort={sortColumn === "status" ? (sortDirection === "asc" ? "ascending" : "descending") : undefined}>
                          <button
                            type="button"
                            className="table-sort-head table-col-head table-col-status"
                            onClick={() => toggleProfileSort("status")}
                            title={profileColumnSortTitle("Status", sortColumn === "status", sortDirection)}
                          >
                            <CheckCircle2 size={13} />
                            Status
                            <ProfileSortIndicator active={sortColumn === "status"} direction={sortDirection} />
                          </button>
                        </th>
                        <th aria-sort={sortColumn === "proxy" ? (sortDirection === "asc" ? "ascending" : "descending") : undefined}>
                          <button
                            type="button"
                            className="table-sort-head table-col-head table-col-proxy"
                            onClick={() => toggleProfileSort("proxy")}
                            title={profileColumnSortTitle("Proxy", sortColumn === "proxy", sortDirection)}
                          >
                            <Globe2 size={13} />
                            Proxy
                            <ProfileSortIndicator active={sortColumn === "proxy"} direction={sortDirection} />
                          </button>
                        </th>
                        <th aria-sort={sortColumn === "note" ? (sortDirection === "asc" ? "ascending" : "descending") : undefined}>
                          <button
                            type="button"
                            className="table-sort-head table-col-head table-col-note"
                            onClick={() => toggleProfileSort("note")}
                            title={profileColumnSortTitle("Note", sortColumn === "note", sortDirection)}
                          >
                            <MessageCircle size={13} />
                            Note
                            <ProfileSortIndicator active={sortColumn === "note"} direction={sortDirection} />
                          </button>
                        </th>
                        <th className="action-col">
                          <span className="table-col-head table-col-actions">
                            <Settings size={13} />
                            Actions
                          </span>
                        </th>
                      </tr>
                    </thead>
                  </table>
                </div>
                <div className="table-wrap table-scroll">
                  <table className="queue-table profile-table">
                    <tbody>
                      {pagedProfiles.map((profile, index) => (
                        <tr
                          key={profileId(profile)}
                          className={selected.has(profileId(profile)) ? "queue-row selected-row active" : "queue-row"}
                          onClick={(event) => selectRow(profile, pageStart + index, event)}
                        >
                          <td>
                            <strong className="queue-channel-name">{profileName(profile)}</strong>
                          </td>
                          <td>{profile.group_name || profile.group_id || "-"}</td>
                          <td>
                            <span className={`status ${profile.status}`}>
                              <StatusMarker status={profile.status} />
                              {statusLabel(profile.status)}
                            </span>
                          </td>
                          <td>{profile.raw_proxy || profile.proxy || "Local IP"}</td>
                          <td className="note-cell queue-message">{profile.lastMessage || profile.note || "-"}</td>
                          <td className="row-actions queue-actions">
                            <button
                              className="table-action-btn table-action-run"
                              title="Open profile"
                              onClick={(event) => {
                                event.stopPropagation();
                                openOne(profile);
                              }}
                            >
                              <Play size={12} />
                            </button>
                            <button
                              className="table-action-btn table-action-close"
                              title="Close profile"
                              onClick={(event) => {
                                event.stopPropagation();
                                closeOne(profile);
                              }}
                            >
                              <Square size={11} />
                            </button>
                          </td>
                        </tr>
                      ))}
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
                    <button className="page-button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1} title="Previous page">
                      <ChevronLeft size={15} />
                    </button>
                    <span>
                      {currentPage} / {totalPages}
                    </span>
                    <button className="page-button" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages} title="Next page">
                      <ChevronRight size={15} />
                    </button>
                    <button className="page-button" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} title="Last page">
                      <ChevronLast size={15} />
                    </button>
                  </div>
                  <div className="pagination-meta">
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
                      options={workflowGroupDropdownOptions}
                      label="Group"
                      searchLabel="Search groups..."
                      summaryLabel="groups"
                      defaultTone="group"
                      onChange={setWorkflowGroupFilters}
                    />
                    <MultiSelectDropdown
                      values={workflowPlatformFilters}
                      options={workflowPlatformDropdownOptions}
                      label="Platform"
                      searchLabel="Search platforms..."
                      summaryLabel="platforms"
                      defaultTone="platform"
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
                            {platformSvgUrl ? <img src={platformSvgUrl} alt="" /> : <WorkflowIcon size={13} />}
                          </span>
                          <span className="workflow-id">{workflowDisplayId(workflow.id)}</span>
                          <strong>{workflow.name}</strong>
                          <span className="workflow-meta">
                            {workflow.group} / {displayPlatform} / {workers} workers / {workflow.steps.length} steps / {workflow.targetUrl || "-"}
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
                            <Settings size={14} />
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
                  disabled={
                    !selectedProfiles.length ||
                    automationRunning ||
                    !runWorkflowConfigs.some(
                      (workflow) => workflow.action === "set-screen-resolution-real" || workflow.targetUrl.trim()
                    )
                  }
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
                      clearHistoryHoverTimer();
                      setHistory([]);
                      setHistoryHoverId(null);
                      historyAnchorRef.current = null;
                    }}
                  >
                    Clear
                  </button>
                </div>
                <div className="history-dot-grid">
                  {history.map((item) => (
                    <button
                      type="button"
                      className={`history-dot ${item.status}`}
                      key={item.id}
                      aria-label={`${item.profileName} — ${item.status}`}
                      onMouseEnter={(event) => openHistoryPopover(item.id, event.currentTarget)}
                      onMouseLeave={() => scheduleCloseHistoryPopover()}
                      onFocus={(event) => openHistoryPopover(item.id, event.currentTarget)}
                      onBlur={() => scheduleCloseHistoryPopover()}
                    >
                      <span />
                    </button>
                  ))}
                  {history.length === 0 && <p className="muted">No completed runs yet.</p>}
                </div>
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
              <StandardTableHeader
                title="Workflows"
                summary={`${filteredWorkflows.length} of ${workflowConfigs.length}`}
                statsClassName="workflow-stats metrics"
                filtersClassName="script-workflow-filters"
                actionsClassName="table-header-actions-grid"
                stats={
                  <>
                    <div className="metric-card">
                      <span className="metric-icon metric-ready">
                        <Layers3 size={12} />
                      </span>
                      <div className="metric-content">
                        <span className="metric-label">Total</span>
                        <strong className="metric-value">{workflowConfigs.length}</strong>
                      </div>
                    </div>
                    <div className="metric-card">
                      <span className="metric-icon metric-running">
                        <Search size={12} />
                      </span>
                      <div className="metric-content">
                        <span className="metric-label">Visible</span>
                        <strong className="metric-value">{filteredWorkflows.length}</strong>
                      </div>
                    </div>
                    <div className="metric-card">
                      <span className="metric-icon metric-scheduled">
                        <Bot size={12} />
                      </span>
                      <div className="metric-content">
                        <span className="metric-label">Selected</span>
                        <strong className="metric-value">{selectedWorkflowCount}</strong>
                      </div>
                    </div>
                    <div className="metric-card">
                      <span className="metric-icon metric-applied">
                        <ClipboardList size={12} />
                      </span>
                      <div className="metric-content">
                        <span className="metric-label">Steps</span>
                        <strong className="metric-value">{visibleWorkflowSteps}</strong>
                      </div>
                    </div>
                  </>
                }
                filters={
                  <>
                    <label className="input with-icon workflow-search">
                      <Search size={15} />
                      <input value={workflowSearch} onChange={(event) => setWorkflowSearch(event.target.value)} placeholder="Search workflows" />
                    </label>
                    <MultiSelectDropdown
                      values={workflowGroupFilters}
                      options={workflowGroupDropdownOptions}
                      label="Group"
                      searchLabel="Search groups..."
                      summaryLabel="groups"
                      defaultTone="group"
                      onChange={setWorkflowGroupFilters}
                    />
                    <MultiSelectDropdown
                      values={workflowPlatformFilters}
                      options={workflowPlatformDropdownOptions}
                      label="Platform"
                      searchLabel="Search platforms..."
                      summaryLabel="platforms"
                      defaultTone="platform"
                      onChange={setWorkflowPlatformFilters}
                    />
                  </>
                }
                actions={
                  <>
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
                  </>
                }
              />
              <div className="script-workflows-table-region">
                <div className="job-list table-panel native-table row-select-table">
                  <div className="table-head-wrap">
                    <table className="queue-table profile-table workflow-script-table profile-table-head" aria-hidden="true">
                      <thead>
                        <tr>
                          <th>
                            <span className="table-col-head table-col-wf-id">
                              <Hash size={13} />
                              ID
                            </span>
                          </th>
                          <th>
                            <span className="table-col-head table-col-wf-name">
                              <Type size={13} />
                              Name
                            </span>
                          </th>
                          <th>
                            <span className="table-col-head table-col-wf-platform">
                              <Layers3 size={13} />
                              Platform
                            </span>
                          </th>
                          <th>
                            <span className="table-col-head table-col-wf-url">
                              <Globe2 size={13} />
                              URL
                            </span>
                          </th>
                          <th className="action-col">
                            <span className="table-col-head table-col-actions">
                              <Settings size={13} />
                              Actions
                            </span>
                          </th>
                        </tr>
                      </thead>
                    </table>
                  </div>
                  <div className="table-wrap table-scroll">
                    <table className="queue-table profile-table workflow-script-table">
                      <tbody>
                        {pagedFilteredWorkflows.map((workflow) => {
                          const displayPlatform = workflowDisplayPlatform(workflow);
                          const WorkflowIcon = workflowPlatformIconFor(displayPlatform);
                          const platformSvgUrl = workflowPlatformSvgUrl(displayPlatform);
                          const rowActive = activeWorkflow === workflow.id;
                          return (
                            <tr
                              key={workflow.id}
                              className={rowActive ? "queue-row selected-row active" : "queue-row"}
                              tabIndex={0}
                              onClick={() => selectScriptWorkflow(workflow.id)}
                              onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                  event.preventDefault();
                                  selectScriptWorkflow(workflow.id);
                                }
                              }}
                            >
                              <td>
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
                              </td>
                              <td>
                                <strong className="queue-channel-name workflow-row-name">{workflow.name}</strong>
                              </td>
                              <td>
                                <span className="workflow-platform-cell workflow-table-platform">
                                  <span className={`workflow-icon workflow-brand-icon ${workflowPlatformTone(displayPlatform)}`}>
                                    {platformSvgUrl ? <img src={platformSvgUrl} alt="" /> : <WorkflowIcon size={15} />}
                                  </span>
                                  <span>{displayPlatform}</span>
                                </span>
                              </td>
                              <td className="note-cell queue-message workflow-row-url-cell">
                                <span className="workflow-row-url">{workflow.targetUrl || "-"}</span>
                              </td>
                              <td className="row-actions queue-actions workflow-script-actions">
                                <button
                                  className="table-action-btn table-action-run"
                                  type="button"
                                  title="Run script from Profiles"
                                  aria-label="Run script from Profiles"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    openProfilesForWorkflow(workflow.id);
                                  }}
                                >
                                  <Play size={12} />
                                </button>
                                <button
                                  className="table-action-btn table-action-export"
                                  type="button"
                                  title="Export workflow"
                                  aria-label="Export workflow"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    exportWorkflow(workflow);
                                  }}
                                >
                                  <Download size={12} />
                                </button>
                                <button
                                  className="table-action-btn table-action-import"
                                  type="button"
                                  title="Import into workflow"
                                  aria-label="Import into workflow"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    startWorkflowImport(workflow.id);
                                  }}
                                >
                                  <Upload size={12} />
                                </button>
                                <button
                                  className="table-action-btn table-action-copy"
                                  type="button"
                                  title="Copy workflow"
                                  aria-label="Copy workflow"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    copyWorkflow(workflow);
                                  }}
                                >
                                  <Copy size={12} />
                                </button>
                                <button
                                  className="table-action-btn table-action-reset"
                                  type="button"
                                  title="Reset workflow"
                                  aria-label="Reset workflow"
                                  disabled={!DEFAULT_WORKFLOWS.some((item) => item.id === workflow.id)}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    resetWorkflow(workflow.id);
                                  }}
                                >
                                  <RotateCcw size={12} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                        {filteredWorkflows.length === 0 && (
                          <tr>
                            <td colSpan={5} className="empty">
                              No workflows match the current filters.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="pagination-footer">
                    <div className="pagination-actions">
                      <button className="page-button" onClick={() => setWorkflowTablePage(1)} disabled={workflowTablePage === 1} title="First page" aria-label="First page">
                        <ChevronFirst size={15} />
                      </button>
                      <button
                        className="page-button"
                        onClick={() => setWorkflowTablePage((page) => Math.max(1, page - 1))}
                        disabled={workflowTablePage === 1}
                        title="Previous page"
                        aria-label="Previous page"
                      >
                        <ChevronLeft size={15} />
                      </button>
                      <span>
                        {workflowTablePage} / {workflowTableTotalPages}
                      </span>
                      <button
                        className="page-button"
                        onClick={() => setWorkflowTablePage((page) => Math.min(workflowTableTotalPages, page + 1))}
                        disabled={workflowTablePage === workflowTableTotalPages}
                        title="Next page"
                        aria-label="Next page"
                      >
                        <ChevronRight size={15} />
                      </button>
                      <button
                        className="page-button"
                        onClick={() => setWorkflowTablePage(workflowTableTotalPages)}
                        disabled={workflowTablePage === workflowTableTotalPages}
                        title="Last page"
                        aria-label="Last page"
                      >
                        <ChevronLast size={15} />
                      </button>
                    </div>
                    <div className="pagination-meta">
                      <span>
                        {filteredWorkflows.length === 0 ? "0" : workflowTablePageStart + 1}-{workflowTablePageEnd} of {filteredWorkflows.length} workflows
                      </span>
                      <label>
                        Workflows per page
                        <select value={workflowTablePageSize} onChange={(event) => setWorkflowTablePageSize(Number(event.target.value))}>
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

        {showToolGuide && (
          <div className="modal-backdrop" onMouseDown={() => setShowToolGuide(false)}>
            <div className="modal info-modal" onMouseDown={(event) => event.stopPropagation()}>
              <header>
                <div>
                  <h2>
                    <Info size={17} />
                    Tool Guide
                  </h2>
                  <p className="muted">Core functions and usage notes.</p>
                </div>
                <button className="icon-only" onClick={() => setShowToolGuide(false)} title="Close guide">
                  <X size={18} />
                </button>
              </header>
              <div className="info-modal-body">
                {TOOL_GUIDE_SECTIONS.map((section) => {
                  const SectionIcon = section.icon;
                  return (
                    <section className="info-section" key={section.title}>
                      <div className="info-section-title">
                        <span className="info-section-icon">
                          <SectionIcon size={15} />
                        </span>
                        <h3>{section.title}</h3>
                      </div>
                      <ul>
                        {section.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </section>
                  );
                })}
              </div>
              <footer>
                <button className="primary" onClick={() => setShowToolGuide(false)}>
                  Close
                </button>
              </footer>
            </div>
          </div>
        )}

        {showVersionLog && (
          <div className="modal-backdrop" onMouseDown={() => setShowVersionLog(false)}>
            <div className="modal info-modal" onMouseDown={(event) => event.stopPropagation()}>
              <header>
                <div>
                  <h2>
                    <History size={17} />
                    Release Log
                  </h2>
                  <p className="muted">Recent update highlights from the release log.</p>
                </div>
                <button className="icon-only" onClick={() => setShowVersionLog(false)} title="Close version log">
                  <X size={18} />
                </button>
              </header>
              <div className="info-modal-body version-log-list">
                {VERSION_LOG_ENTRIES.map((entry) => {
                  const EntryIcon = entry.icon;
                  return (
                    <section className="info-section version-log-entry" key={`${entry.version}-${entry.title}`}>
                      <div className="version-log-title">
                        <span className="info-section-icon">
                          <EntryIcon size={15} />
                        </span>
                        <span className="version-log-version">{entry.version}</span>
                        <span className="version-log-timestamp">{entry.timestamp}</span>
                        <h3>{entry.title}</h3>
                      </div>
                      <ul>
                        {entry.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </section>
                  );
                })}
              </div>
              <footer>
                <button className="primary" onClick={() => setShowVersionLog(false)}>
                  Close
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
                <option value="set-screen-resolution-real">Set Screen Resolution Real</option>
              </select>
              <label>Target URL</label>
              <input
                value={activeWorkflowConfig.targetUrl}
                onChange={(event) => updateActiveWorkflowConfig({ targetUrl: event.target.value })}
                placeholder="https://example.com"
                disabled={activeWorkflowConfig.action === "set-screen-resolution-real"}
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
                <button
                  className="primary"
                  onClick={() => {
                    saveWorkflowChanges();
                    setShowWorkflowSettings(false);
                  }}
                >
                  Save settings
                </button>
              </footer>
            </div>
          </div>
        )}

        {historyHoverId && (
          <PortaledThemeSurface>
            <div
              ref={historyPopoverPanelRef}
              className="history-popover history-popover-portal"
              role="tooltip"
              aria-label="Run history detail"
              style={{
                position: "fixed",
                top: historyPopoverCoords.top,
                left: historyPopoverCoords.left,
                zIndex: 2147483000,
                isolation: "isolate"
              }}
              onMouseEnter={clearHistoryHoverTimer}
              onMouseLeave={scheduleCloseHistoryPopover}
            >
              {history
                .filter((item) => item.id === historyHoverId)
                .map((item) => (
                  <div key={item.id}>
                    <div className="history-popover-title">
                      <strong>{item.profileName}</strong>
                      <span className={`history-status ${item.status}`}>{item.status}</span>
                    </div>
                    <p>{item.workflowName}</p>
                    <p>{item.targetUrl}</p>
                    <div className="history-popover-meta">
                      <div className={`history-popover-timing history-popover-timing--${item.status}`}>
                        <Clock3 size={12} strokeWidth={2} className="history-meta-clock" aria-hidden />
                        <span className="history-duration-value">
                          {item.status === "running" ? "Running" : formatDuration(item.durationMs)}
                        </span>
                      </div>
                      <span className="history-finished-at">{item.finishedAt}</span>
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
          </PortaledThemeSurface>
        )}
      </main>
    </div>
  );
}
