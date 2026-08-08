import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { UiPrefsProvider } from "@/components/providers/ui-prefs-provider";
import "./globals.css";

const display = Sora({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const body = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "YLIKA Ops",
  description:
    "Plataforma ERP / BOS / CRM del grupo YLIKA — MONE · DAKAM · NARAMO",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning className="h-full">
      <body
        className={`${display.variable} ${body.variable} min-h-full antialiased`}
      >
        <AuthSessionProvider>
          <ThemeProvider>
            <UiPrefsProvider>{children}</UiPrefsProvider>
          </ThemeProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
