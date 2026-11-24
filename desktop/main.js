const { app, BrowserWindow, shell, Menu, nativeImage, session } = require("electron");
const path = require("path");
const fs = require("fs");

const APP_URL = "https://abood-33.vercel.app";

function resolveIcon() {
  const candidates = [
    path.join(__dirname, "build", "icon.ico"),
    path.join(__dirname, "build", "icon.png"),
    path.join(process.resourcesPath || "", "build", "icon.ico"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return nativeImage.createFromPath(p);
  }
  return undefined;
}

async function createWindow() {
  const icon = resolveIcon();
  const win = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 900,
    minHeight: 600,
    title: "المهندس رشاد سعيد",
    backgroundColor: "#0e1525",
    autoHideMenuBar: true,
    ...(icon ? { icon } : {}),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  Menu.setApplicationMenu(null);

  // Avoid stale UI after website deploys
  try {
    await session.defaultSession.clearCache();
  } catch {
    /* ignore */
  }

  const url = APP_URL + "/?v=" + Date.now();
  win.loadURL(url, { extraHeaders: "Cache-Control: no-cache\n" });

  win.webContents.setWindowOpenHandler(({ url: openUrl }) => {
    shell.openExternal(openUrl);
    return { action: "deny" };
  });

  win.webContents.on("will-navigate", (event, navUrl) => {
    const allowed = navUrl.startsWith(APP_URL) || navUrl.startsWith("https://abood-33.vercel.app");
    if (!allowed) {
      event.preventDefault();
      shell.openExternal(navUrl);
    }
  });
}

app.whenReady().then(async () => {
  await createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
