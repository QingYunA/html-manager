import { HomeHeader } from "@/components/home-header";
import { SiteFooter } from "@/components/site-footer";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col antialiased overflow-x-hidden w-full max-w-full">
      <HomeHeader />
      <div className="flex-1 flex flex-col w-full max-w-full overflow-x-hidden">{children}</div>
      <SiteFooter />
    </div>
  );
}
