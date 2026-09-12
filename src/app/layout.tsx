import type { Metadata } from "next";
import { Manrope, DM_Sans, Lora } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});
const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});
const lora = Lora({
  subsets: ["latin"],
  variable: "--font-editorial",
  display: "swap",
  style: ["normal", "italic"],
});
export const metadata: Metadata = {
  title: "TalentYug — From Campus to Possibility",
  description:
    "A stronger start for every career. TalentYug connects students, colleges and employers through career development, industry readiness and campus hiring in Bihar and beyond.",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "TalentYug — From Campus to Possibility",
    description:
      "Building career readiness. Connecting the right opportunities. Discover TalentYug’s campus-to-company programme.",
    type: "website",
    locale: "en_IN",
  },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${dmSans.variable} ${lora.variable}`}
    >
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
