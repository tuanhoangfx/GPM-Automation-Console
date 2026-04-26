const { app, BrowserWindow, ipcMain } = require("electron");
const { autoUpdater } = require("electron-updater");
const path = require("node:path");
const { runOpenUrlAutomation } = require("./automation.cjs");

const DEFAULT_GPM_BASE_URL = "http://127.0.0.1:19995";

function normalizeBaseUrl(baseUrl) {
  return String(baseUrl || DEFAULT_GPM_BASE_URL).replace(/\/+$/, "");
}

function buildUrl(baseUrl, pathname, params = {}) {
  const url = new URL(`${normalizeBaseUrl(baseUrl)}${pathname}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });
  return url;
}

async function requestJson(url, options = {}) {
  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });
  } catch (error) {
    throw new Error(`Unable to connect to GPM API: ${error.message}`);
  }

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`GPM API returned non-JSON data: ${text.slice(0, 160)}`);
    }
  }

  if (!response.ok) {
    throw new Error(data?.message || `HTTP ${response.status}`);
  }

  return data;
}

function bindGpmApi() {
  ipcMain.handle("gpm:health", async (_event, payload = {}) => {
    const data = await requestJson(buildUrl(payload.baseUrl, "/api/v3/groups"));
    return { ok: Boolean(data?.success), data };
  });

  ipcMain.handle("gpm:groups", async (_event, payload = {}) => {
    return requestJson(buildUrl(payload.baseUrl, "/api/v3/groups"));
  });

  ipcMain.handle("gpm:profiles", async (_event, payload = {}) => {
    const { baseUrl, ...params } = payload;
    return requestJson(buildUrl(baseUrl, "/api/v3/profiles", params));
  });

  ipcMain.handle("gpm:profile", async (_event, payload = {}) => {
    if (!payload.id) throw new Error("Missing profile id");
    return requestJson(buildUrl(payload.baseUrl, `/api/v3/profile/${encodeURIComponent(payload.id)}`));
  });

  ipcMain.handle("gpm:startProfile", async (_event, payload = {}) => {
    if (!payload.id) throw new Error("Missing profile id");
    const { baseUrl, id, ...params } = payload;
    return requestJson(buildUrl(baseUrl, `/api/v3/profiles/start/${encodeURIComponent(id)}`, params));
  });

  ipcMain.handle("gpm:closeProfile", async (_event, payload = {}) => {
    if (!payload.id) throw new Error("Missing profile id");
    return requestJson(buildUrl(payload.baseUrl, `/api/v3/profiles/close/${encodeURIComponent(payload.id)}`));
  });

  ipcMain.handle("gpm:createProfile", async (_event, payload = {}) => {
    const { baseUrl, profile } = payload;
    if (!profile?.profile_name) throw new Error("Missing profile name");
    return requestJson(buildUrl(baseUrl, "/api/v3/profiles/create"), {
      method: "POST",
      body: JSON.stringify(profile)
    });
  });

  ipcMain.handle("gpm:updateProfile", async (_event, payload = {}) => {
    const { baseUrl, id, patch } = payload;
    if (!id) throw new Error("Missing profile id");
    return requestJson(buildUrl(baseUrl, `/api/v3/profiles/update/${encodeURIComponent(id)}`), {
      method: "POST",
      body: JSON.stringify(patch || {})
    });
  });

  ipcMain.handle("gpm:deleteProfile", async (_event, payload = {}) => {
    if (!payload.id) throw new Error("Missing profile id");
    return requestJson(
      buildUrl(payload.baseUrl, `/api/v3/profiles/delete/${encodeURIComponent(payload.id)}`, {
        mode: payload.mode || 1
      })
    );
  });

  ipcMain.handle("automation:openUrl", async (_event, payload = {}) => {
    const { baseUrl, profile, targetUrl, screenshot = true, closeWhenDone = false, workflowAction = "open-url", inspectMode = false, steps = [] } = payload;
    const id = profile?.id ?? profile?.profile_id;

    if (!id) throw new Error("Missing profile id");
    if (!targetUrl) throw new Error("Missing automation URL");

    const startResponse = await requestJson(buildUrl(baseUrl, `/api/v3/profiles/start/${encodeURIComponent(id)}`));

    return runOpenUrlAutomation({
      profile,
      startResponse,
      targetUrl,
      screenshot,
      closeWhenDone,
      workflowAction,
      inspectMode,
      steps,
      closeProfile: () => requestJson(buildUrl(baseUrl, `/api/v3/profiles/close/${encodeURIComponent(id)}`))
    });
  });
}

function bindAppApi() {
  ipcMain.handle("app:info", () => ({
    name: app.getName(),
    version: app.getVersion(),
    isPackaged: app.isPackaged
  }));

  ipcMain.handle("app:checkForUpdates", async () => {
    if (!app.isPackaged) {
      return { ok: false, message: "Updates are only available in the packaged app." };
    }

    const result = await autoUpdater.checkForUpdates();
    return { ok: true, updateInfo: result?.updateInfo || null };
  });
}

function configureAutoUpdater() {
  if (!app.isPackaged) return;

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on("error", (error) => {
    console.error("Auto update failed:", error);
  });

  autoUpdater.on("update-available", (info) => {
    console.log("Update available:", info.version);
  });

  autoUpdater.on("update-downloaded", (info) => {
    console.log("Update downloaded:", info.version);
  });

  autoUpdater.checkForUpdatesAndNotify();
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1380,
    height: 880,
    minWidth: 1100,
    minHeight: 720,
    backgroundColor: "#f5f2eb",
    title: "GPM Automation Console",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }
}

app.whenReady().then(() => {
  bindGpmApi();
  bindAppApi();
  createWindow();
  configureAutoUpdater();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
