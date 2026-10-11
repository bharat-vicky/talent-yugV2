import type { Metadata } from "next";
import { PahchaanLanding } from "@/features/landing/components/PahchaanLanding";
import { appUrl } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Pahchaan — Every guest. A warm welcome.",
  description: "Bring people together with thoughtful event registration, beautiful QR passes, and smooth check-ins. Your entire event, in one place.",
  openGraph: { title: "Pahchaan — Every guest. A warm welcome.", description: "Thoughtful tools for the people bringing people together.", siteName: "Pahchaan", type: "website", url: appUrl() },
  alternates: { canonical: appUrl() },
};
export default function LandingPage() { return <PahchaanLanding />; }
