import { PageTransition } from "@/components/ui/page-transition";

export default function EventTemplate({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
