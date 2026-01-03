import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ColorModeProvider } from "./src/providers/ColorModeProvider";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Simulador UI",
  description: "Simulador UI Plant Floor Monitoring Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AppRouterCacheProvider>
          <ColorModeProvider>{children}</ColorModeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
