const path = require("path");
const fs = require("fs");

exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== "win32") return;

  const exeName = `${context.packager.appInfo.productFilename}.exe`;
  const exePath = path.join(context.appOutDir, exeName);
  const iconPath = path.join(__dirname, "build", "icon.ico");

  if (!fs.existsSync(exePath) || !fs.existsSync(iconPath)) return;

  let rcedit = require("rcedit");
  if (typeof rcedit !== "function") rcedit = rcedit.rcedit || rcedit.default;
  if (typeof rcedit !== "function") {
    throw new Error("Unable to load rcedit function");
  }

  await rcedit(exePath, { icon: iconPath });
};
