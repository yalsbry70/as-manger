/** @type {import('next').NextConfig} */
const pack = process.env.NEXT_PUBLIC_MOBILE === "1" || process.env.NEXT_PUBLIC_OFFLINE === "1";

const nextConfig = {
  images: { unoptimized: true },
  transpilePackages: ["@capacitor/core", "@capacitor/browser", "@aparajita/capacitor-biometric-auth"],
  ...(pack
    ? {
        output: "export",
        trailingSlash: true,
      }
    : {}),
};

export default nextConfig;
