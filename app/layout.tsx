import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Limited Links",
  description: "Hostează un site din ZIP pentru un număr limitat de zile.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro">
      <body>{children}</body>
    </html>
  );
}
