import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "Haushaltsbuch",
  description: "Gülmisal Kuzu | IHK Projektarbeit",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
