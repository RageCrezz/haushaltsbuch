import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "../styles/globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-nunito",
});

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
    <html lang="de" className="h-full antialiased">
      <body className={`${nunito.className} ${nunito.variable} min-h-full flex flex-col`}>
        {children}
      </body>
    </html>
  );
}
