import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Scholar Sky | Extract Research Papers",
  description: "Extract upto 1000 research papers from Google Scholar",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
