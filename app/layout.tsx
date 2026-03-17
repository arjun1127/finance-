import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Finance Planner",
  description: "Personal financial planning and cashflow survival simulator",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
