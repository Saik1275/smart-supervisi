import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppShell } from "../components/supervisi/AppShell";
import { SupervisiProvider } from "../components/supervisi/context";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "SMART-SUPERVISI | Manajemen Supervisi Keperawatan RS Semen Gresik",
  description: "Sistem pemantauan Patient Safety dan kepatuhan prosedur klinik keperawatan.",
};

export const instant = false;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`h-full antialiased ${inter.variable} font-sans`}>
      <body className={`${inter.className} min-h-full font-sans bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50`}>
        <SupervisiProvider>
          <AppShell>{children}</AppShell>
        </SupervisiProvider>
      </body>
    </html>
  );
}
