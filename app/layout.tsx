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
      <body className={inter.className}>
        <AuthSync />
        {children}
      </body>
    </html>
  );
}

