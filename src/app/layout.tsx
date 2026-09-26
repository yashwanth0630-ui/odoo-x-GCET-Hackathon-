import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "StockSense | Modular Real-Time Inventory Management System",
  description:
    "Enterprise-grade modular inventory management system replacing legacy paper registers with centralized, real-time stock control and multi-role operations.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full bg-[#0b0f19]">
      <body className={`${inter.className} min-h-full bg-[#0b0f19] text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white`}>
        {children}
      </body>
    </html>
  );
}
