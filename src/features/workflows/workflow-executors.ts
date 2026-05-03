import { runOpenUrlAutomation } from "../../api";
import type { GpmProfile, ScriptStep } from "../../types";

export type WorkflowExecutorAction = "open-url" | "google-form-ag-appeal";

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
