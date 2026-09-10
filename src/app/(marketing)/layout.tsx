import { getCurrentUser } from "@/lib/auth";
import { HomeHeader } from "@/components/home-header";
import { SiteFooter } from "@/components/site-footer";

export const revalidate = 60;

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await getCurrentUser();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col antialiased">
      <HomeHeader currentUser={currentUser} />
      <div className="flex-1 flex flex-col">{children}</div>
      <SiteFooter />
    </div>
  );
}
