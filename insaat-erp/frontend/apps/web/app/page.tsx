'use client'

import { useState } from 'react'
import Sidebar from '@/components/Sidebar'
import Dashboard from '@/components/Dashboard'
import ProjectsPage from '@/components/ProjectsPage'
import CustomersPage from '@/components/CustomersPage'
import SalesPage from '@/components/SalesPage'
import ExpensesPage from '@/components/ExpensesPage'

type Page = 'dashboard' | 'projects' | 'customers' | 'sales' | 'expenses'

export default function Home() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />
      case 'projects': return <ProjectsPage />
      case 'customers': return <CustomersPage />
      case 'sales': return <SalesPage />
      case 'expenses': return <ExpensesPage />
      default: return <Dashboard />
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className="flex-1 overflow-auto">
        {renderPage()}
      </main>
    </div>
  )
}
