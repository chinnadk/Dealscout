import type { Metadata } from "next";
import "./dealscout.css";

export const metadata: Metadata = {
  title: "CartWatch — Good finds. Great prices.",
  description: "Discover Amazon and Flipkart deals, compare daily prices, and explore price history.",
  icons: {
    icon: "/dealscout.svg",
    shortcut: "/dealscout.svg",
  },
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
