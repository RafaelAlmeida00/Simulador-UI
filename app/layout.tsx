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
  const runtimeEnv = {
    apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "",
    socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL ?? "",
  };

  // Avoid `</script>` termination issues by escaping '<'
  const runtimeEnvJson = JSON.stringify(runtimeEnv).replace(/</g, "\\u003c");

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__RUNTIME_ENV__=${runtimeEnvJson};`,
          }}
        />
        <AppRouterCacheProvider>
          <ColorModeProvider>{children}</ColorModeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
