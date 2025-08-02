import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import WalletProvider from './WalletProvider';
import { SmoothCursor } from "@/components/ui/smooth-cursor";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Time Oracle - Decentralized File Locker",
  description: "Lock files with time-based unlocking using Tezos Smart Rollups",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased cursor-none`}>
        <SmoothCursor />
        <WalletProvider>
          {children}
        </WalletProvider>
      </body>
    </html>
  );
}