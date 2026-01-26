import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import TopNav from "@/components/TopNav";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Spitfire Labs",
  description: "View and manage HubSpot deals",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${montserrat.variable} antialiased`}
        >
          <TopNav />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
