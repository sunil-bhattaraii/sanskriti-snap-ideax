import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Epilogue, Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";

const epilogue = Epilogue({
  subsets: ["latin"],
  variable: "--font-epilogue",
  weight: ["600", "700"],
});
const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["400", "500", "600"],
});
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  weight: ["500", "700"],
});

export const metadata: Metadata = {
  title: "Sanskriti Snap - Discover Nepal",
  description: "An interactive cultural exploration app.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${epilogue.variable} ${manrope.variable} ${spaceGrotesk.variable} h-full`}
      >
        <body className="min-h-full flex flex-col font-body antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
