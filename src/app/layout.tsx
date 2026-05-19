import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "Perhutani - RTT Digital System",
  description: "Security Managed Forestry System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${jakarta.className} antialiased min-h-screen bg-[#0b1120] text-slate-100 selection:bg-emerald-500/30 overflow-x-hidden`}
      >
        {children}
      </body>
    </html>
  );
}
