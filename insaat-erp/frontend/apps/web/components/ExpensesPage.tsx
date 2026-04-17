'use client'

import { useState } from 'react'
import {
  Receipt, Plus, Search, X, ChevronRight, Calendar,
  Building, Truck, Wallet, AlertTriangle, CheckCircle,
  Clock, Filter, DollarSign, Tag, Users,
} from 'lucide-react'

function formatCurrency(n: number) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 }).format(n)
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// ── Mock Data ──
const suppliers = [
  { id: 'sup1', name: 'ABC İnşaat Malzemeleri', contact: 'Hasan Çelik', phone: '0532 100 2000', category: 'malzeme', total_debt: 450000 },
  { id: 'sup2', name: 'XYZ Demir Çelik A.Ş.', contact: 'Yusuf Demir', phone: '0533 200 3000', category: 'malzeme', total_debt: 680000 },
  { id: 'sup3', name: 'Doğan Taşeronluk', contact: 'Eren Doğan', phone: '0535 300 4000', category: 'taseron', total_debt: 320000 },
  { id: 'sup4', name: 'Anadolu Elektrik Ltd.', contact: 'Kemal Anadolu', phone: '0536 400 5000', category: 'taseron', total_debt: 85000 },
  { id: 'sup5', name: 'Mega Boya Kimya', contact: 'Selim Mega', phone: '0537 500 6000', category: 'malzeme', total_debt: 120000 },
]

const expenses = [
  {
    id: 'e1', supplier: 'ABC İnşaat Malzemeleri', project: 'Park Evler',
    category: 'malzeme', description: 'Çimento alımı — 200 ton', amount: 450000,
    due_date: '2026-04-15', paid_amount: 0, status: 'pending',
    invoice_no: 'FTR-2026-0401', created_at: '2026-04-01',
  },
  {
    id: 'e2', supplier: 'XYZ Demir Çelik A.Ş.', project: 'Park Evler',
    category: 'malzeme', description: 'Demir donatı çelik', amount: 680000,
    due_date: '2026-04-20', paid_amount: 0, status: 'pending',
    invoice_no: 'FTR-2026-0385', created_at: '2026-03-28',
  },
  {
    id: 'e3', supplier: 'Doğan Taşeronluk', project: 'Deniz Konakları',
    category: 'iscilik', description: 'Nisan ayı hakedişi — Kaba inşaat', amount: 320000,
    due_date: '2026-04-30', paid_amount: 0, status: 'pending',
    invoice_no: 'HAK-2026-04', created_at: '2026-04-05',
  },
  {
    id: 'e4', supplier: 'Anadolu Elektrik Ltd.', project: 'Park Evler',
    category: 'taseron', description: 'Elektrik tesisatı — A Blok 3-5. katlar', amount: 85000,
    due_date: '2026-03-25', paid_amount: 85000, status: 'paid',
    invoice_no: 'FTR-2026-0310', created_at: '2026-03-10',
  },
  {
    id: 'e5', supplier: 'ABC İnşaat Malzemeleri', project: 'Deniz Konakları',
    category: 'malzeme', description: 'Tuğla ve yapı malzemesi', amount: 195000,
    due_date: '2026-03-10', paid_amount: 100000, status: 'partial',
    invoice_no: 'FTR-2026-0280', created_at: '2026-02-28',
  },
  {
    id: 'e6', supplier: null, project: null,
    category: 'kira', description: 'Ofis kirası — Nisan 2026', amount: 45000,
    due_date: '2026-04-01', paid_amount: 45000, status: 'paid',
    invoice_no: null, created_at: '2026-03-28',
  },
  {
    id: 'e7', supplier: null, project: null,
    category: 'vergi', description: 'KDV ödemesi — Q1 2026', amount: 230000,
    due_date: '2026-04-25', paid_amount: 0, status: 'pending',
    invoice_no: null, created_at: '2026-04-01',
  },
  {
    id: 'e8', supplier: 'Mega Boya Kimya', project: 'Park Evler',
    category: 'malzeme', description: 'İç cephe boya ve astar', amount: 120000,
    due_date: '2026-03-01', paid_amount: 0, status: 'overdue',
    invoice_no: 'FTR-2026-0250', created_at: '2026-02-15',
  },
]

const categoryConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  malzeme: { label: 'Malzeme', color: 'text-blue-700', bg: 'bg-blue-50', icon: Building },
  iscilik: { label: 'İşçilik', color: 'text-purple-700', bg: 'bg-purple-50', icon: Users },
  taseron: { label: 'Taşeron', color: 'text-orange-700', bg: 'bg-orange-50', icon: Truck },
  kira:    { label: 'Kira',    color: 'text-teal-700', bg: 'bg-teal-50', icon: Building },
  vergi:   { label: 'Vergi',   color: 'text-red-700', bg: 'bg-red-50', icon: Receipt },
  diger:   { label: 'Diğer',   color: 'text-gray-700', bg: 'bg-gray-100', icon: Tag },
}

const expenseStatusConfig: Record<string, { label: string; color: string; bg: string }> = {
  paid:    { label: 'Ödendi',  color: 'text-emerald-700', bg: 'bg-emerald-50' },
  partial: { label: 'Kısmi',   color: 'text-amber-700',   bg: 'bg-amber-50' },
  pending: { label: 'Bekliyor', color: 'text-gray-600',    bg: 'bg-gray-50' },
  overdue: { label: 'Gecikmiş', color: 'text-red-700',     bg: 'bg-red-50' },
}

type View = 'expenses' | 'suppliers' | 'calendar'

export default function ExpensesPage() {
  const [view, setView] = useState<View>('expenses')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showNewForm, setShowNewForm] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<typeof expenses[0] | null>(null)

  // Stats
  const totalPending = expenses.filter(e => e.status === 'pending').reduce((s, e) => s + (e.amount - e.paid_amount), 0)
  const totalOverdue = expenses.filter(e => e.status === 'overdue').reduce((s, e) => s + (e.amount - e.paid_amount), 0)
  const totalPaidThisMonth = expenses.filter(e => e.status === 'paid').reduce((s, e) => s + e.paid_amount, 0)

  // Category summary
  const categoryTotals = Object.entries(
    expenses.reduce((acc, e) => {
      if (!acc[e.category]) acc[e.category] = 0
      acc[e.category] += e.amount
      return acc
    }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1])

  const filteredExpenses = expenses.filter(e => {
    const matchSearch =
      e.description.toLowerCase().includes(search.toLowerCase()) ||
      (e.supplier || '').toLowerCase().includes(search.toLowerCase()) ||
      (e.project || '').toLowerCase().includes(search.toLowerCase())
    const matchCat = categoryFilter === 'all' || e.category === categoryFilter
    const matchStatus = statusFilter === 'all' || e.status === statusFilter
    return matchSearch && matchCat && matchStatus
  })

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Firma Giderleri</h1>
          <p className="text-sm text-gray-500 mt-1">{expenses.length} gider kaydı · {suppliers.length} tedarikçi</p>
        </div>
        <button
          onClick={() => setShowNewForm(true)}
          className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow-md"
        >
          <Plus className="w-4 h-4" /> Yeni Gider
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">Bekleyen Ödemeler</p>
              <p className="text-xl font-bold text-orange-600">{formatCurrency(totalPending)}</p>
              <p className="text-xs text-gray-400 mt-1">{expenses.filter(e => e.status === 'pending').length} adet</p>
            </div>
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-500" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">Geciken Ödemeler</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(totalOverdue)}</p>
              <p className="text-xs text-gray-400 mt-1">{expenses.filter(e => e.status === 'overdue').length} adet</p>
            </div>
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">Bu Ay Ödenen</p>
              <p className="text-xl font-bold text-emerald-600">{formatCurrency(totalPaidThisMonth)}</p>
            </div>
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {categoryTotals.map(([cat, total]) => {
          const cfg = categoryConfig[cat] || categoryConfig.diger
          const CIcon = cfg.icon
          return (
            <div
              key={cat}
              className={`rounded-lg p-3 border cursor-pointer transition hover:shadow-sm ${
                categoryFilter === cat ? 'border-primary-400 bg-primary-50' : 'border-gray-100 bg-white'
              }`}
              onClick={() => setCategoryFilter(categoryFilter === cat ? 'all' : cat)}
            >
              <div className="flex items-center gap-2 mb-1">
                <CIcon className={`w-4 h-4 ${cfg.color}`} />
                <span className="text-xs font-medium text-gray-700">{cfg.label}</span>
              </div>
              <p className="text-sm font-bold text-gray-900">{formatCurrency(total)}</p>
            </div>
          )
        })}
      </div>

      {/* View Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-5 w-fit">
        {([
          { id: 'expenses' as View, label: 'Giderler' },
          { id: 'suppliers' as View, label: 'Tedarikçiler' },
          { id: 'calendar' as View, label: 'Vade Takvimi' },
        ]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setView(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              view === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Gider Listesi ── */}
      {view === 'expenses' && (
        <>
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Açıklama, tedarikçi veya proje ara..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 text-sm transition outline-none"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none bg-white"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="pending">Bekliyor</option>
              <option value="paid">Ödendi</option>
              <option value="partial">Kısmi</option>
              <option value="overdue">Gecikmiş</option>
            </select>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Açıklama</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Tedarikçi</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Kategori</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Vade</th>
                  <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">Tutar</th>
                  <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">Ödenen</th>
                  <th className="text-center text-xs font-semibold text-gray-500 px-5 py-3">Durum</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map(expense => {
                  const catCfg = categoryConfig[expense.category] || categoryConfig.diger
                  const sCfg = expenseStatusConfig[expense.status]
                  return (
                    <tr
                      key={expense.id}
                      className={`border-b border-gray-50 hover:bg-gray-50/50 transition cursor-pointer ${expense.status === 'overdue' ? 'bg-red-50/30' : ''}`}
                      onClick={() => setSelectedExpense(expense)}
                    >
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-gray-900">{expense.description}</p>
                        {expense.project && <p className="text-xs text-gray-400">{expense.project}</p>}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600">{expense.supplier || '—'}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${catCfg.bg} ${catCfg.color}`}>
                          {catCfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600">{formatDate(expense.due_date)}</td>
                      <td className="px-5 py-4 text-sm font-semibold text-gray-900 text-right">{formatCurrency(expense.amount)}</td>
                      <td className="px-5 py-4 text-sm text-gray-600 text-right">{formatCurrency(expense.paid_amount)}</td>
                      <td className="px-5 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${sCfg.bg} ${sCfg.color}`}>
                          {sCfg.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── Tedarikçiler ── */}
      {view === 'suppliers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map(sup => {
            const catCfg = categoryConfig[sup.category] || categoryConfig.diger
            return (
              <div key={sup.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{sup.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{sup.contact}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${catCfg.bg} ${catCfg.color}`}>
                    {catCfg.label}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                  <Receipt className="w-3.5 h-3.5 text-gray-400" /> {sup.phone}
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                  <span className="text-xs text-gray-500">Toplam Borç</span>
                  <span className="text-sm font-bold text-orange-600">{formatCurrency(sup.total_debt)}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Vade Takvimi ── */}
      {view === 'calendar' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary-500" /> Nisan 2026 Vade Takvimi
          </h3>

          {/* Grouped by week */}
          {[
            { week: '1-7 Nisan', items: expenses.filter(e => new Date(e.due_date) >= new Date('2026-04-01') && new Date(e.due_date) <= new Date('2026-04-07') && e.status !== 'paid') },
            { week: '8-14 Nisan', items: expenses.filter(e => new Date(e.due_date) >= new Date('2026-04-08') && new Date(e.due_date) <= new Date('2026-04-14') && e.status !== 'paid') },
            { week: '15-21 Nisan', items: expenses.filter(e => new Date(e.due_date) >= new Date('2026-04-15') && new Date(e.due_date) <= new Date('2026-04-21') && e.status !== 'paid') },
            { week: '22-30 Nisan', items: expenses.filter(e => new Date(e.due_date) >= new Date('2026-04-22') && new Date(e.due_date) <= new Date('2026-04-30') && e.status !== 'paid') },
          ].map(({ week, items }) => (
            <div key={week} className="mb-5 last:mb-0">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{week}</h4>
              {items.length === 0 ? (
                <p className="text-xs text-gray-400 py-2">Bu haftada bekleyen ödeme yok.</p>
              ) : (
                <div className="space-y-2">
                  {items.map(item => {
                    const sCfg = expenseStatusConfig[item.status]
                    return (
                      <div key={item.id} className={`flex items-center justify-between py-3 px-4 rounded-lg border ${item.status === 'overdue' ? 'border-red-200 bg-red-50/50' : 'border-gray-100 bg-gray-50/50'}`}>
                        <div className="flex items-center gap-3">
                          <div className="text-center w-12">
                            <p className="text-lg font-bold text-gray-900">{new Date(item.due_date).getDate()}</p>
                            <p className="text-[10px] text-gray-400 -mt-0.5">Nis</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{item.description}</p>
                            <p className="text-xs text-gray-400">{item.supplier || 'Genel Gider'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-900">{formatCurrency(item.amount - item.paid_amount)}</p>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${sCfg.bg} ${sCfg.color}`}>{sCfg.label}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Gider Detay Modal ── */}
      {selectedExpense && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-4" onClick={() => setSelectedExpense(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Gider Detayı</h2>
              <button onClick={() => setSelectedExpense(null)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Açıklama</p>
                <p className="text-sm font-medium text-gray-900">{selectedExpense.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-0.5">Tutar</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(selectedExpense.amount)}</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-0.5">Ödenen</p>
                  <p className="text-lg font-bold text-emerald-600">{formatCurrency(selectedExpense.paid_amount)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Tedarikçi</p>
                  <p className="font-medium text-gray-900">{selectedExpense.supplier || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Proje</p>
                  <p className="font-medium text-gray-900">{selectedExpense.project || 'Genel'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Vade Tarihi</p>
                  <p className="font-medium text-gray-900">{formatDate(selectedExpense.due_date)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Fatura No</p>
                  <p className="font-medium text-gray-900 font-mono">{selectedExpense.invoice_no || '—'}</p>
                </div>
              </div>
              {selectedExpense.status !== 'paid' && (
                <button className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition shadow-sm hover:shadow-md flex items-center justify-center gap-2">
                  <Wallet className="w-4 h-4" /> Ödeme Kaydet
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Yeni Gider Modal ── */}
      {showNewForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-4" onClick={() => setShowNewForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Yeni Gider Kaydı</h2>
              <button onClick={() => setShowNewForm(false)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Tedarikçi</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none bg-white">
                  <option value="">Tedarikçi seçin (opsiyonel)...</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Kategori *</label>
                  <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none bg-white">
                    <option value="malzeme">Malzeme</option>
                    <option value="iscilik">İşçilik</option>
                    <option value="taseron">Taşeron</option>
                    <option value="kira">Kira</option>
                    <option value="vergi">Vergi</option>
                    <option value="diger">Diğer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Proje (opsiyonel)</label>
                  <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none bg-white">
                    <option value="">Seçin...</option>
                    <option>Park Evler</option>
                    <option>Deniz Konakları</option>
                    <option>Yeşil Vadi</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Açıklama *</label>
                <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition" placeholder="Gider açıklaması..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Tutar (₺) *</label>
                  <input type="number" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition" placeholder="450,000" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Vade Tarihi *</label>
                  <input type="date" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Fatura No</label>
                <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition font-mono" placeholder="FTR-2026-XXXX" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowNewForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">İptal</button>
              <button className="px-5 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition shadow-sm hover:shadow-md">Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
