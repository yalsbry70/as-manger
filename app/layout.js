import "./globals.css";
import { IBM_Plex_Sans_Arabic } from "next/font/google";

const arabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font",
});

export const metadata = { title: "المهندس رشاد سعيد | سجل الأعمال والحسابات", description: "سجل أعمال المكيفات وحساباتها" };
export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0e1525",
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl" className={arabic.variable}>
      <body>{children}</body>
    </html>
  );
}
