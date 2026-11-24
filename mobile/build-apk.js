const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const androidDir = path.join(__dirname, "android");
const sdk = process.env.ANDROID_HOME
  || process.env.ANDROID_SDK_ROOT
  || path.join(process.env.LOCALAPPDATA || "", "Android", "Sdk");

const localProps = path.join(androidDir, "local.properties");
const sdkDirProp = sdk.replace(/\\/g, "\\\\").replace(/:/g, "\\:");
fs.writeFileSync(localProps, `## Auto-generated\nsdk.dir=${sdkDirProp}\n`, "utf8");

const env = {
  ...process.env,
  ANDROID_HOME: sdk,
  ANDROID_SDK_ROOT: sdk,
};

const gradlew = process.platform === "win32" ? "gradlew.bat" : "./gradlew";
const build = spawnSync(gradlew, ["assembleDebug", "--no-daemon"], {
  cwd: androidDir,
  env,
  stdio: "inherit",
  shell: true,
});

if (build.status !== 0) {
  process.exit(build.status || 1);
}

const apkSrc = path.join(androidDir, "app", "build", "outputs", "apk", "debug", "app-debug.apk");
const distDir = path.join(__dirname, "dist");
const apkDest = path.join(distDir, "AC-Manager-1.2.0.apk");
fs.mkdirSync(distDir, { recursive: true });
fs.copyFileSync(apkSrc, apkDest);
console.log("APK ready:", apkDest);
