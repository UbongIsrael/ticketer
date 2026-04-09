export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[#0e0e10] min-h-screen">
      {children}
    </div>
  );
}
