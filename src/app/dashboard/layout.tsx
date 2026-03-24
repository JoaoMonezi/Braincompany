import type { ReactNode } from 'react'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 flex flex-col">
      <header className="border-b border-neutral-800 bg-neutral-900 px-6 py-4 flex items-center justify-between sticky top-0 z-10 w-full">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-pink-600 flex items-center justify-center font-bold text-white tracking-tighter">
            BC
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">Brain Company</h1>
        </div>
        <nav className="flex items-center gap-6 text-sm font-medium">
          <a href="/dashboard" className="text-neutral-400 hover:text-white transition-colors">
            Projetos
          </a>
          <div className="w-px h-4 bg-neutral-800" />
          <button className="text-neutral-400 hover:text-white transition-colors">
            Sair
          </button>
        </nav>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto p-6 md:p-8">
        {children}
      </main>
    </div>
  )
}
