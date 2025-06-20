import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { RouteProvider } from "@/context/RouteContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "Puriwise - Breathe Clean, Live Healthy",
  description:
    "Empowering healthier outdoor decisions with real-time air quality data and AI-driven insights",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${playfair.variable} bg-primary text-text`}
      >
        <AuthProvider>
          <RouteProvider>{children}</RouteProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
