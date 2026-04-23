import type { Metadata, Viewport } from "next";
import { Source_Serif_4, Space_Grotesk } from "next/font/google";

import "@/app/globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"]
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"]
});

const fallbackSiteUrl = "https://novel-typing-practice.com";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? fallbackSiteUrl;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Novel Typing Practice | Learn Typing by Retyping Classic Literature",
    template: "%s | Novel Typing Practice"
  },
  description:
    "Train typing speed and accuracy with classic public domain novels. Track WPM, build streaks, and hit consistent typing goals.",
  keywords: [
    "typing practice",
    "typing speed",
    "WPM trainer",
    "classic literature",
    "education tool",
    "typing accuracy"
  ],
  openGraph: {
    title: "Novel Typing Practice",
    description:
      "Gamified typing sessions with classic novels, performance analytics, and progress tracking for students and professionals.",
    type: "website",
    url: "/",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Novel Typing Practice Dashboard Preview"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Novel Typing Practice",
    description:
      "Retype literature classics, improve WPM, and measure real progress with a focused typing dashboard.",
    images: ["/og-image.svg"]
  },
  alternates: {
    canonical: "/"
  },
  robots: {
    index: true,
    follow: true
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0d1117"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className="dark" lang="en">
      <body className={`${spaceGrotesk.variable} ${sourceSerif.variable}`}>{children}</body>
    </html>
  );
}
