export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="px-6 py-4 border-b border-slate-800 bg-slate-950/50 backdrop-blur-md flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center font-bold text-white shadow-lg">
            Q
          </div>
          <span className="font-bold tracking-tight">QuoteGen Backoffice</span>
        </div>
      </header>
      <main className="flex-1 p-6 md:p-12 w-full max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
}
