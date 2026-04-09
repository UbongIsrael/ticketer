import { TopNavBar, BottomNavBar } from '@/components/Navigation';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-surface-dim min-h-screen text-on-surface selection:bg-primary selection:text-on-primary">
      <TopNavBar />
      
      {/* Main Content */}
      <main className="pt-16 pb-24 min-h-screen">
        {children}
      </main>

      <BottomNavBar />
    </div>
  );
}
