import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sanskriti Snap | Admin",
  description: "Manage Sanskriti Snap's cultural discovery community.",
};

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
