'use client'

import {
  LayoutDashboard, Building2, Users, ShoppingCart,
  Receipt, FileText, Settings, LogOut, ChevronLeft, Truck,
} from 'lucide-react'
import { useState } from 'react'

type Page = 'dashboard' | 'projects' | 'customers' | 'sales' | 'expenses' | 'suppliers'

interface SidebarProps {
  currentPage: Page
  onNavigate: (page: Page) => void
}

const menuItems = [
  { id: 'dashboard' as Page, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'projects' as Page, label: 'Projeler & Stok', icon: Building2 },
  { id: 'customers' as Page, label: 'Müşteriler / CRM', icon: Users },
  { id: 'sales' as Page, label: 'Satışlar & Tahsilat', icon: ShoppingCart },
  { id: 'expenses' as Page, label: 'Firma Giderleri', icon: Receipt },
  { id: 'suppliers' as Page, label: 'Tedarikçiler', icon: Truck },
]

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside className={`${collapsed ? 'w-20' : 'w-64'} bg-primary-800 text-white flex flex-col transition-all duration-300`}>
      {/* Logo */}
      <div className="p-4 border-b border-primary-700 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="AC Grup Proje"
              className="h-9 w-auto object-contain"
            />
          </div>
        )}
        {collapsed && (
          <img
            src="/logo.png"
            alt="AC Grup Proje"
            className="h-8 w-auto object-contain mx-auto"
          />
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-primary-300 hover:text-white transition"
        >
          <ChevronLeft className={`w-5 h-5 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Menü */}
      <nav className="flex-1 py-4">
        {menuItems.map(item => {
          const Icon = item.icon
          const isActive = currentPage === item.id
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${isActive
                  ? 'bg-primary-600 text-white border-r-4 border-accent-500'
                  : 'text-primary-200 hover:bg-primary-700 hover:text-white'
                }`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${collapsed ? 'mx-auto' : ''}`} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          )
        })}
      </nav>

      {/* Alt kısım */}
      <div className="p-4 border-t border-primary-700">
        {!collapsed && (
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-xs font-semibold">
              MY
            </div>
            <div className="text-sm">
              <p className="font-medium text-primary-100">Mehmet Yılmaz</p>
              <p className="text-xs text-primary-400">Satış Müdürü</p>
            </div>
          </div>
        )}
        <button className={`flex items-center gap-2 text-primary-300 hover:text-white text-sm transition ${collapsed ? 'justify-center w-full' : ''}`}>
          <LogOut className="w-4 h-4" />
          {!collapsed && <span>Çıkış</span>}
        </button>
      </div>
    </aside>
  )
}
