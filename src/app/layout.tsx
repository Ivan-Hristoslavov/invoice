import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { Toaster } from "@/components/ui/sonner-toaster";
import { APP_NAME } from "@/config/constants";
import { Theme } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: `${APP_NAME} - Система за фактуриране`,
  description: "Модерна система за фактуриране за бизнеси",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bg" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Theme appearance="inherit" accentColor="blue" grayColor="slate" radius="medium">
            <AuthProvider>
              {children}
              <Toaster />
            </AuthProvider>
          </Theme>
        </ThemeProvider>
      </body>
    </html>
  );
}
