import { TopNavBar } from '@/components/Navigation';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface-dim">
      <TopNavBar />
      <div className="pt-16 min-h-screen flex items-center justify-center p-6">
        {children}
      </div>
    </div>
  );
}
