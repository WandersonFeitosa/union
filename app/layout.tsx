import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Nav } from "@/components/nav";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Union App",
  description: "A modern web application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body 
        className={`${inter.className} bg-background text-foreground dark:bg-gray-950 dark:text-gray-50`}
        suppressHydrationWarning
      >
        <Providers>
          <Nav />
          <div className="pt-16">
            {children}
          </div>
          <Toaster theme="dark" position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
