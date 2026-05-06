import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/lib/auth/context";
import { Toaster } from "sonner";
import { HydrateStore } from "@/components/hydrate-store";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "ClientHub — Modern client portal for agencies & SaaS",
  description:
    "A polished client portal demo by Let's Build My App — projects, billing, support, and team workflow in one place.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <HydrateStore />
          <AuthProvider>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                classNames: {
                  toast:
                    "border bg-card text-card-foreground shadow-lg",
                },
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
