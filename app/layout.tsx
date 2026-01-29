import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthSync from "@/components/AuthSync";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Petrotech - Fuel Delivery Service",
  description: "Order fuel online and get it delivered to your doorstep",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Inline script to sync cookie IMMEDIATELY before React hydrates */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window !== 'undefined' && typeof document !== 'undefined') {
                  try {
                    const token = localStorage.getItem('token');
                    if (token) {
                      const expiresIn = 7 * 24 * 60 * 60; // 7 days
                      document.cookie = 'token=' + token + '; path=/; max-age=' + expiresIn + '; SameSite=Lax';
                    }
                  } catch (e) {
                    // Silently fail if localStorage is not available
                  }
                }
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <AuthSync />
        {children}
      </body>
    </html>
  );
}

