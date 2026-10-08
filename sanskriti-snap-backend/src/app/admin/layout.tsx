import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sanskriti Snap | Admin",
  description: "Manage Sanskriti Snap's cultural discovery community.",
  icons: { icon: "/assets/images/logo.png" },
};

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
