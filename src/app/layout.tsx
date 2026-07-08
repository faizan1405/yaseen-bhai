import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "../context/AppContext";
import { I18nProvider } from "../i18n/I18nProvider";
import { Cormorant_Garamond, Poppins, Great_Vibes, Amiri, Noto_Nastaliq_Urdu } from "next/font/google";

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const greatVibes = Great_Vibes({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-script",
  display: "swap",
});

const amiri = Amiri({
  subsets: ["arabic"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-arabic",
  display: "swap",
});

// Readable Nastaliq script for Urdu UI text (RTL). Exposed as --font-urdu and
// applied via [dir="rtl"] rules in globals.css.
const notoNastaliqUrdu = Noto_Nastaliq_Urdu({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-urdu",
  display: "swap",
});

import {
  ProfileDetails,
  ChatbotWidget,
  CallButton,
  WhatsAppButton
} from "../components/ClientDynamicWrappers";

export const metadata: Metadata = {
  metadataBase: new URL("https://asannikah.com"),
  title: "Asan Nikah — Trusted Muslim Matrimonial Platform",
  description: "Asan Nikah is a secure, manual-verified Muslim matrimonial site offering verified matches, curated profiles, basic access matches, and premium premium match access options.",
  openGraph: {
    images: [{ url: "/images/rishte-forever-logo.png", width: 900, height: 340 }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr" className={`${cormorantGaramond.variable} ${poppins.variable} ${greatVibes.variable} ${amiri.variable} ${notoNastaliqUrdu.variable}`}>
      <body>
        <I18nProvider>
          <AppProvider>
            <ProfileDetails />
            {children}
            <ChatbotWidget />
            <CallButton />
            <WhatsAppButton />
          </AppProvider>
        </I18nProvider>
      </body>
    </html>
  );
}




