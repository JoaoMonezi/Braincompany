'use client'

import { useState } from 'react'
import { FilterIcon, PrinterIcon } from 'lucide-react'

// Este componente envolve os actions do lado do cliente para os relatorios
export function ReportActions() {
  const [isFiltering, setIsFiltering] = useState(false)

  function handlePrint() {
    window.print()
  }

  return (
    <div className="flex items-center gap-3 print:hidden">
      <button 
        onClick={() => setIsFiltering(!isFiltering)}
        className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none h-10 px-4 border ${
          isFiltering 
            ? 'bg-neutral-800 border-neutral-700 text-white' 
            : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800'
        }`}
      >
        <FilterIcon className="w-4 h-4 mr-2" />
        Filtros
      </button>

      <button 
        onClick={handlePrint}
        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none h-10 px-4 bg-white text-neutral-950 hover:bg-neutral-200"
      >
        <PrinterIcon className="w-4 h-4 mr-2" />
        Exportar PDF
      </button>
    </div>
  )
}
