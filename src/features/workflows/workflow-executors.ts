import { runOpenUrlAutomation, updateProfile } from "../../api";
import type { GpmProfile, ScriptStep } from "../../types";

export type WorkflowExecutorAction = "open-url" | "google-form-ag-appeal" | "set-screen-resolution-real";

export type ExecuteWorkflowActionInput = {
  action: WorkflowExecutorAction;
  baseUrl: string;
  profile: GpmProfile;
  targetUrl?: string;
  takeScreenshot: boolean;
  closeWhenDone: boolean;
  inspectMode: boolean;
  steps: ScriptStep[];
};

export type ExecuteWorkflowActionResult = {
  ok: boolean;
  logs: Array<{
    level: "info" | "success" | "error";
    message: string;
    time: string;
  }>;
  status: "closed" | "running";
  message: string;
  screenshotPath?: string;
  error?: string;
};

function nowIso() {
  return new Date().toISOString();
}

export async function executeWorkflowAction(input: ExecuteWorkflowActionInput): Promise<ExecuteWorkflowActionResult> {
  if (input.action === "set-screen-resolution-real") {
    const id = input.profile.id ?? input.profile.profile_id;
    if (id == null || String(id).trim() === "") {
      return {
        ok: false,
        logs: [{ level: "error", message: "Missing profile id", time: nowIso() }],
        status: "closed",
        message: "Missing profile id",
        error: "Missing profile id"
      };
    }

    const profileName = input.profile.profile_name || input.profile.name;
    const payloadCandidates: Record<string, unknown>[] = [
      {
        profile_name: profileName,
        is_random_screen: false,
        screen_resolution: "Real",
        screenResolution: "Real"
      },
      {
        profile_name: profileName,
        is_random_screen: false,
        screen_resolution: "real",
        screen: "Real"
      },
      {
        profile_name: profileName,
        is_random_screen: false,
        screen_resolution: "",
        screenResolution: ""
      },
      {
        profile_name: profileName,
        is_random_screen: false,
        screen_resolution: null,
        screenResolution: null
      },
      {
        profile_name: profileName,
        is_random_screen: false,
        screen_resolution: "0x0",
        screenResolution: "0x0"
      },
      {
        profile_name: profileName,
        is_random_screen: false,
        screen_resolution: "0",
        screenResolution: "0"
      }
    ];

    let lastResponse: { success?: boolean; message?: string } | undefined;
    let updated = false;
    for (const patch of payloadCandidates) {
      const response = await updateProfile(input.baseUrl, id, patch);
      lastResponse = response;
      if (response?.success !== false) {
        updated = true;
      }
    }

    if (!updated) {
      const message = lastResponse?.message || "Unable to set screen resolution to Real.";
      return {
        ok: false,
        logs: [{ level: "error", message, time: nowIso() }],
        status: "closed",
        message,
        error: message
      };
    }

    return {
      ok: true,
      logs: [{ level: "success", message: "Screen resolution set to Real (API update sent)", time: nowIso() }],
      status: "closed",
      message: "Screen resolution set to Real"
    };
  }

  if (!input.targetUrl) {
    return {
      ok: false,
      logs: [{ level: "error", message: "Automation URL is empty.", time: nowIso() }],
      status: "closed",
      message: "Automation URL is empty.",
      error: "Automation URL is empty."
    };
  }

  const result = await runOpenUrlAutomation(input.baseUrl, input.profile, {
    targetUrl: input.targetUrl,
    screenshot: input.takeScreenshot,
    closeWhenDone: input.closeWhenDone,
    workflowAction: input.action,
    inspectMode: input.inspectMode,
    steps: input.steps
  });

  if (result.ok) {
    return {
      ok: true,
      logs: result.logs,
      status: input.closeWhenDone ? "closed" : "running",
      message: result.screenshotPath ? `Screenshot saved: ${result.screenshotPath}` : "Automation completed",
      screenshotPath: result.screenshotPath
    };
  }

  return {
    ok: false,
    logs: result.logs,
    status: "closed",
    message: result.error || "Automation failed",
    error: result.error || "Automation failed"
  };
}
