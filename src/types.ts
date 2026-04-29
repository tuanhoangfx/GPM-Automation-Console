export type ApiEnvelope<T = unknown> = {
  success?: boolean;
  message?: string;
  data?: T;
};

export type GpmGroup = {
  id: number | string;
  name?: string;
  group_name?: string;
};

export type GpmProfile = {
  id: number | string;
  profile_id?: number | string;
  name?: string;
  profile_name?: string;
  group_id?: number | string;
  group_name?: string;
  proxy?: string;
  proxy_type?: string;
  raw_proxy?: string;
  note?: string;
  browser_type?: string;
  browser_version?: string;
  created_at?: string;
  updated_at?: string;
  remote_debugging_address?: string;
  driver_path?: string;
};

export type ProfileRow = GpmProfile & {
  status: "closed" | "opening" | "running" | "failed";
  lastMessage?: string;
};

export type RunLog = {
  id: string;
  time: string;
  level: "info" | "success" | "error";
  profileName: string;
  message: string;
};

export type ScriptStepKind = "navigate" | "wait" | "click" | "type" | "delay" | "scroll" | "screenshot" | "condition" | "action";

export type ScriptStep = {
  id: string;
  kind: ScriptStepKind;
  name: string;
  selector?: string;
  value?: string;
  timeoutMs?: number;
  enabled: boolean;
};

export type AutomationResult = {
  ok: boolean;
  screenshotPath?: string;
  error?: string;
  logs: Array<{
    level: "info" | "success" | "error";
    message: string;
    time: string;
  }>;
};

declare global {
  interface Window {
    gpm: {
      request: <T = unknown>(channel: string, payload?: Record<string, unknown>) => Promise<T>;
    };
  }
}
